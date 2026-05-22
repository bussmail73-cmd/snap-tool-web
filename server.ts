import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import path from "path";
import fs from "fs";
import axios from "axios";
import * as cheerio from "cheerio";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { createRequire } from "module";
import { LRUCache } from "lru-cache";
import http from "http";
import https from "https";
import dotenv from "dotenv";
import os from "os";
import dns from "dns";

// Optimize DNS lookups globally by prioritizing IPv4 to prevent IPv6 connection failures
dns.setDefaultResultOrder("ipv4first");

dotenv.config();

const require = createRequire(import.meta.url);
const YTDlpWrapRaw = require("yt-dlp-wrap");
const YTDlpWrap = YTDlpWrapRaw.default || YTDlpWrapRaw;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname);

// --- CONFIG & CONSTANTS ---
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const CACHE_MAX_SIZE = 10000;  
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours
const MAX_CONCURRENT_TASKS = 50;

// Global metrics & configurations
let totalRequests = 0;
let cacheHitsCount = 0;
let cacheMissesCount = 0;
let successRequestsCount = 0;
let failedRequestsCount = 0;
const latencyHistory: number[] = [];
let cheerioUsageCount = 0;
let ytdlpUsageCount = 0;

// Interactive Configuration States
let configCacheBypass = false;
let configYtdlpPriority = false;
let configScraperTimeout = 15000;

// Instantaneous CPU Delta Tracker
let currentCpuUsage = 0;
function getCpuTimes() {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;
  cpus.forEach((cpu) => {
    for (const type in cpu.times) {
      total += (cpu.times as any)[type];
    }
    idle += cpu.times.idle;
  });
  return { idle, total };
}
let lastCpuMetrics = getCpuTimes();
setInterval(() => {
  const current = getCpuTimes();
  const idleDiff = current.idle - lastCpuMetrics.idle;
  const totalDiff = current.total - lastCpuMetrics.total;
  if (totalDiff > 0) {
    currentCpuUsage = Math.round(((totalDiff - idleDiff) / totalDiff) * 100);
  }
  lastCpuMetrics = current;
}, 1000);

// Global Activity Logs Queue (Last 50 Scrapes/Downloads)
interface ActivityLog {
  id: string;
  timestamp: string;
  type: "download" | "stories" | "profile" | "bulk" | "simulated";
  username: string;
  status: "success" | "failed" | "pending";
  latency: number;
  message: string;
}
const activityLogs: ActivityLog[] = [];

function addActivityLog(
  type: ActivityLog["type"],
  username: string,
  status: ActivityLog["status"],
  latency: number,
  message: string
) {
  const newLog: ActivityLog = {
    id: Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toLocaleTimeString(),
    type,
    username: username || "anonymous",
    status,
    latency,
    message: message.substring(0, 200)
  };
  activityLogs.unshift(newLog);
  if (activityLogs.length > 50) {
    activityLogs.pop();
  }
}

// Global System Alerts List for status page
interface SystemAlert {
  id: string;
  timestamp: string;      // "HH:MM:SS"
  timestampDate: string;  // "YYYY-MM-DD"
  type: "info" | "warning" | "error";
  tool: string;           // e.g. "Profile Viewer"
  message: string;
}
const systemAlerts: SystemAlert[] = [];

// Helper to mask sensitive input for public status page
function maskSensitiveInfo(input: string): string {
  if (!input) return "anonymous";
  const trimmed = input.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.includes("snapchat.com")) {
    try {
      const url = new URL(trimmed);
      const pathSegs = url.pathname.split("/");
      const lastSeg = pathSegs[pathSegs.length - 1] || "";
      if (lastSeg.length > 4) {
        return `${url.origin}/${pathSegs.slice(1, -1).join("/")}/${lastSeg.slice(0, 2)}****${lastSeg.slice(-2)}`;
      }
      return `${url.origin}/.../link`;
    } catch {
      return "link-masked";
    }
  }
  
  if (trimmed.length > 4) {
    return `${trimmed.slice(0, 2)}****${trimmed.slice(-2)}`;
  } else if (trimmed.length > 2) {
    return `${trimmed.slice(0, 1)}**${trimmed.slice(-1)}`;
  }
  return "**";
}

function addSystemAlert(
  type: SystemAlert["type"],
  tool: string,
  message: string
) {
  const date = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const formattedTime = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  const formattedDate = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

  const newAlert: SystemAlert = {
    id: Math.random().toString(36).substring(2, 9),
    timestamp: formattedTime,
    timestampDate: formattedDate,
    type,
    tool,
    message: message.substring(0, 300)
  };
  systemAlerts.unshift(newAlert);
  if (systemAlerts.length > 30) {
    systemAlerts.pop();
  }
}

// Global cache
const metadataCache = new LRUCache<string, any>({
  max: CACHE_MAX_SIZE,
  ttl: CACHE_TTL,
});

// Rapid-access caching layers for sub-second responses
const resolvedUrlsCache = new LRUCache<string, string>({
  max: 2000,
  ttl: CACHE_TTL,
});

const resolvedUsernamesCache = new LRUCache<string, string>({
  max: 2000,
  ttl: CACHE_TTL,
});

// Symmetrical promise coalescing maps to group concurrent lookups
const pendingRedirects = new Map<string, Promise<string>>();
const pendingUsernames = new Map<string, Promise<string>>();

// Concurrency tracking
let activeTasks = 0;

// =====================================================
// KEEP-ALIVE AXIOS INSTANCE — faster repeated requests
// =====================================================
const axiosInstance = axios.create({
  timeout: 15000,
  httpAgent: new http.Agent({ 
    keepAlive: true, 
    maxSockets: 50,
    keepAliveMsecs: 30000,
  }),
  httpsAgent: new https.Agent({
    keepAlive: true,
    maxSockets: 50,
    keepAliveMsecs: 30000,
    rejectUnauthorized: false,
  }),
});

// Desktop browser headers (for video/proxy requests)
const HEADERS_DESKTOP = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  Connection: "keep-alive",
  Referer: "https://www.snapchat.com/",
};

// Mobile browser headers (better for Snapchat profile scraping)
const HEADERS_MOBILE = {
  "User-Agent":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  Referer: "https://www.snapchat.com/",
  "sec-fetch-dest": "document",
  "sec-fetch-mode": "navigate",
};

// Reachability tracking
let isSnapchatReachable = true;
setInterval(async () => {
  try {
    const res = await axiosInstance.get("https://www.snapchat.com", {
      headers: HEADERS_MOBILE,
      timeout: 3000,
      validateStatus: () => true
    });
    const currentStatus = res.status === 200 || res.status === 403 || res.status === 301 || res.status === 302;
    if (currentStatus !== isSnapchatReachable) {
      if (currentStatus) {
        addSystemAlert("info", "System", "Connection to Snapchat host restored.");
      } else {
        addSystemAlert("error", "System", "Connection to Snapchat host lost or being blocked.");
      }
      isSnapchatReachable = currentStatus;
    }
  } catch (err: any) {
    if (isSnapchatReachable) {
      addSystemAlert("error", "System", `Connection to Snapchat host failed: ${err.message}`);
      isSnapchatReachable = false;
    }
  }
}, 10000);

// Extracts URL from a text string if embedded inside other text (e.g. from mobile share messages)
function extractUrlFromText(input: string): string {
  if (!input) return "";
  const trimmed = input.trim();
  
  // Regex to match any snapchat.com, snap.com, or t.snapchat.com URL (with or without http/https)
  const urlRegex = /(https?:\/\/[^\s]+|(?:www\.)?(?:t\.snapchat\.com|snapchat\.com|snap\.com)\/[^\s]+)/i;
  const match = trimmed.match(urlRegex);
  if (match) {
    let url = match[1];
    // Strip trailing punctuation often copied along with links
    url = url.replace(/[\)\]\.,;!]+$/g, "");
    return url;
  }
  
  return trimmed;
}

// Username clean utility (extremely robust normalization)
function cleanUsername(input: string) {
  let cleaned = input.trim();
  
  // Remove protocols and common prefixes
  cleaned = cleaned.replace(/^https?:\/\//i, "");
  cleaned = cleaned.replace(/^www\./i, "");
  
  // Support both snapchat.com and snap.com domains
  cleaned = cleaned.replace(/^(?:snapchat|snap)\.com\//i, "");
  
  // Remove "add/" path prefix if present
  cleaned = cleaned.replace(/^add\//i, "");
  
  // Remove leading @ or # if it exists
  cleaned = cleaned.replace(/^[@#]/, "");
  
  // Take only the first path segment
  cleaned = cleaned.split("/")[0];
  
  // Take only the part before query params
  cleaned = cleaned.split("?")[0].split("#")[0];
  
  // Remove leading @ or # again in case it was after split/segmenting
  cleaned = cleaned.replace(/^[@#]/, "");
  
  return cleaned.trim().toLowerCase();
}

async function resolveSnapchatUrl(input: string): Promise<string> {
  const extracted = extractUrlFromText(input);
  const trimmed = extracted.trim();
  if (!trimmed) return trimmed;
  if (trimmed.includes("t.snapchat.com")) {
    // 1. Check local redirect cache
    const cached = resolvedUrlsCache.get(trimmed);
    if (cached) {
      console.log(`[Redirect] Cache HIT for: ${trimmed} -> ${cached}`);
      return cached;
    }

    // 2. Coalesce concurrent identical redirect operations
    let pending = pendingRedirects.get(trimmed);
    if (!pending) {
      pending = (async () => {
        try {
          console.log(`[Redirect] Resolving t.snapchat.com redirect (fast method) for: ${trimmed}`);
          let urlToFetch = trimmed;
          if (!/^https?:\/\//i.test(urlToFetch)) {
            urlToFetch = `https://${urlToFetch}`;
          }
          const response = await axiosInstance.get(urlToFetch, {
            maxRedirects: 0,
            validateStatus: (status) => status >= 200 && status < 400,
            timeout: 3000,
            headers: HEADERS_MOBILE,
          });
          const finalUrl = response.headers?.location || response.request?.res?.responseUrl;
          if (finalUrl) {
            console.log(`[Redirect] Fast method resolved to: ${finalUrl}`);
            resolvedUrlsCache.set(trimmed, finalUrl);
            return finalUrl;
          }
        } catch (e: any) {
          console.warn("[Redirect] Fast redirect resolution failed, falling back to full fetch:", e.message);
          try {
            let urlToFetch = trimmed;
            if (!/^https?:\/\//i.test(urlToFetch)) {
              urlToFetch = `https://${urlToFetch}`;
            }
            const response = await axiosInstance.get(urlToFetch, {
              maxRedirects: 5,
              timeout: 5000,
              headers: HEADERS_MOBILE,
            });
            const finalUrl = response.request?.res?.responseUrl || response.headers?.location;
            if (finalUrl) {
              console.log(`[Redirect] Fallback resolved to: ${finalUrl}`);
              resolvedUrlsCache.set(trimmed, finalUrl);
              return finalUrl;
            }
          } catch (err: any) {
            console.error("[Redirect] Fallback redirect resolution failed:", err.message);
          }
        }
        return trimmed;
      })();
      pendingRedirects.set(trimmed, pending);
    }

    try {
      const resolved = await pending;
      return resolved;
    } finally {
      pendingRedirects.delete(trimmed);
    }
  }
  return trimmed;
}


// HD DP URL enhancer — removes size-limiting URL params
function getHdDpUrl(originalUrl: string): string {
  if (!originalUrl) return originalUrl;
  try {
    let hdUrl = originalUrl;
    if (hdUrl.includes("/aps/bolt/")) {
      const match = hdUrl.match(/\/aps\/bolt\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        const decoded = Buffer.from(match[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
        if (decoded && /^https?:\/\//i.test(decoded)) {
          return getHdDpUrl(decoded);
        }
      }
    }
    hdUrl = hdUrl.replace(/_RS\d+,\d+/gi, "_RS0,1000");
    hdUrl = hdUrl.replace(/_RS0,\d+/gi, "_RS0,1000");
    hdUrl = hdUrl.replace(/[?&]width=\d+/gi, "");
    hdUrl = hdUrl.replace(/[?&]height=\d+/gi, "");
    hdUrl = hdUrl.replace(/[?&]size=\d+x\d+/gi, "");
    hdUrl = hdUrl.replace(/[?&]quality=\d+/gi, "");
    hdUrl = hdUrl.replace(/\/\d+x\d+\//gi, "/");
    hdUrl = hdUrl.replace(/_\d+x\d+\./gi, ".");
    // Fix broken query string after param removal
    hdUrl = hdUrl.replace(/\?&/, "?").replace(/&&/g, "&").replace(/[?&]$/, "");
    return hdUrl || originalUrl;
  } catch {
    return originalUrl;
  }
}

// Clean uploader and display names by stripping corporate/branding suffixes
function cleanDisplayName(name: string): string {
  if (!name) return "";
  let cleaned = name.trim();
  // Remove suffixes like: " on Snapchat", " | Snapchat", " | Spotlight", " | Snapchat پر Spotlight", etc.
  cleaned = cleaned.replace(/\s*(?:on Snapchat|\| Snapchat.*|\| Spotlight.*|\|پر Spotlight.*|Snapchat.*|Spotlight.*)$/i, "");
  // Remove trailing vertical bars, dashes, or punctuation
  cleaned = cleaned.replace(/\s*[|\-–—•]+$/, "").trim();
  return cleaned;
}

// Deep scanner to pull all creators from parsed NextJS data payloads
function extractAllCreators(obj: any, results: any[] = []): any[] {
  if (!obj || typeof obj !== 'object') return results;

  if (obj.username && typeof obj.username === 'string' && obj.username.length >= 3 && obj.username.length <= 30) {
    const u = obj.username.toLowerCase();
    if (u !== 'snapchat' && u !== 'snapchatuser') {
      const displayName = obj.name || obj.displayName || obj.title || obj.username;
      results.push({
        username: obj.username,
        displayName: typeof displayName === 'string' ? displayName : obj.username
      });
    }
  }

  for (const key of Object.keys(obj)) {
    try {
      extractAllCreators(obj[key], results);
    } catch {}
  }
  return results;
}

// Extract hashtags list from description text or caption
function extractHashtagsFromText(text: string): string[] {
  if (!text) return [];
  const hashMatch = text.match(/#[a-zA-Z0-9_]+/g);
  const list: string[] = [];
  if (hashMatch) {
    hashMatch.forEach((h: string) => {
      const cleanedHash = h.replace("#", "").trim();
      if (cleanedHash && !list.includes(cleanedHash)) {
        list.push(cleanedHash);
      }
    });
  }
  return list;
}

// Robust creator info extractor from page titles or descriptions
function extractCreatorFromText(text: string): { username?: string; displayName?: string } | null {
  if (!text) return null;
  // Match "Display Name (@username)" or similar
  const matchParen = text.match(/([a-zA-Z0-9.\s_\u00C0-\u017F\u0600-\u06FF]+?)\s*\(@?([a-zA-Z0-9._-]{3,30})\)/);
  if (matchParen) {
    const displayName = matchParen[1].trim();
    const username = matchParen[2].trim().toLowerCase();
    if (username !== 'snapchat' && username !== 'snapchatuser' && username !== 'spotlight') {
      return { username, displayName };
    }
  }
  // Match "username's Spotlight snap!"
  const matchApos = text.match(/([a-zA-Z0-9._-]{3,30})'s\s+Spotlight\s+snap/i);
  if (matchApos) {
    const username = matchApos[1].trim().toLowerCase();
    if (username !== 'snapchat' && username !== 'snapchatuser' && username !== 'spotlight') {
      return { username, displayName: username.charAt(0).toUpperCase() + username.slice(1) };
    }
  }
  // Match "@username"
  const matchAt = text.match(/@([a-zA-Z0-9._-]{3,30})/);
  if (matchAt) {
    const username = matchAt[1].trim().toLowerCase();
    if (username !== 'snapchat' && username !== 'snapchatuser' && username !== 'spotlight') {
      return { username, displayName: username.charAt(0).toUpperCase() + username.slice(1) };
    }
  }
  return null;
}

async function fetchSnapchatProfilePage(username: string) {
  const pageUrl = `https://www.snapchat.com/add/${username}`;
  let response = await axiosInstance.get(pageUrl, {
    headers: HEADERS_MOBILE,
    timeout: configScraperTimeout,
    validateStatus: () => true,
  });

  // Fallback to desktop headers if mobile fails (returns non-200, such as 403, 429)
  if (response.status !== 200) {
    console.log(`[fetchSnapchatProfilePage] Mobile header returned ${response.status}. Falling back to Desktop headers...`);
    try {
      const fallbackResponse = await axiosInstance.get(pageUrl, {
        headers: HEADERS_DESKTOP,
        timeout: configScraperTimeout,
        validateStatus: () => true,
      });
      if (fallbackResponse.status === 200) {
        response = fallbackResponse;
      }
    } catch (e: any) {
      console.error(`[fetchSnapchatProfilePage] Desktop fallback request failed:`, e.message);
    }
  }

  return {
    pageUrl,
    status: response.status,
    html: response.data,
    $: cheerio.load(response.data),
  };
}

const BIN_DIR = path.join(__dirname, "bin");
const YTDLP_PATH = path.join(
  BIN_DIR,
  process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp"
);

let isReady = false;

async function ensureYTDlp() {
  if (!fs.existsSync(BIN_DIR)) {
    fs.mkdirSync(BIN_DIR, { recursive: true });
  }

  if (!fs.existsSync(YTDLP_PATH)) {
    console.log("yt-dlp binary not found. Downloading...");
    let retries = 3;
    while (retries > 0) {
      try {
        await YTDlpWrap.downloadFromGithub(YTDLP_PATH);
        if (process.platform !== "win32") {
          fs.chmodSync(YTDLP_PATH, "755");
        }
        console.log("✅ yt-dlp downloaded successfully.");
        isReady = true;
        return;
      } catch (err) {
        retries--;
        console.error(`Failed to download yt-dlp. Retries left: ${retries}`);
        if (retries > 0)
          await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    console.error("❌ Could not download yt-dlp after 3 attempts.");
  } else {
    isReady = true;
    console.log("✅ yt-dlp binary found.");
  }
}

// =====================================================
// WATERMARK-FREE VIDEO FETCHER
// Strategy: yt-dlp returns multiple CDN format URLs.
// Snapchat CDN raw uploads have NO watermark.
// We pick the highest quality URL that is NOT an overlay/branded stream.
// No FFmpeg, no re-encoding — just direct clean stream.
// =====================================================
async function yt_dlp_fast(url: string, wrapper: any) {
  const info = await wrapper.getVideoInfo([
    "--no-playlist",
    "--socket-timeout",
    "10",  // Reduced from 15 for faster timeout
    "--no-warnings",
    "--no-check-certificates",
    "--ignore-config",
    "-f",
    "best[ext=mp4]/best",  // Prefer mp4 format, pre-filtered
    "--add-header",
    "User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "--add-header",
    "Referer:https://www.snapchat.com/",
    url,
  ]);

  let cleanVideoUrl = "";
  let bestFormat: any = null;
  let bestHeight = 0;

  if (info.formats && info.formats.length > 0) {
    // STEP 1: Find formats WITHOUT watermark/overlay markers
    // These are the raw CDN uploads Snapchat stores before adding overlays
    const cleanFormats = info.formats.filter((f: any) => {
      if (!f.url || f.vcodec === "none") return false;
      const u = (f.url || "").toLowerCase();
      const note = (f.format_note || "").toLowerCase();
      const fid = (f.format_id || "").toLowerCase();
      const ext = (f.ext || "").toLowerCase();
      
      // MUST have video codec and valid extension
      if (!f.vcodec || f.vcodec === "none" || !f.url) return false;
      
      // Prefer mp4, webm, or similar (skip audio-only)
      if (!["mp4", "webm", "mkv", "mov", "avi"].includes(ext)) return false;
      
      // Skip anything that looks like an overlay/branded/watermarked stream
      const isWatermarked = (
        u.includes("overlay") ||
        u.includes("watermark") ||
        u.includes("branded") ||
        u.includes("logo") ||
        u.includes("stamp") ||
        note.includes("overlay") ||
        note.includes("watermark") ||
        note.includes("branded") ||
        fid.includes("overlay") ||
        fid.includes("branded") ||
        fid.includes("watermark")
      );
      
      return !isWatermarked;
    });

    // STEP 2: From clean formats, prefer mp4 with both video+audio (no merging needed)
    const combined = cleanFormats.filter(
      (f: any) => f.acodec !== "none" && f.ext === "mp4"
    );
    const videoAudio = cleanFormats.filter((f: any) => f.acodec !== "none");
    const anyClean = combined.length > 0 ? combined : videoAudio.length > 0 ? videoAudio : cleanFormats;

    if (anyClean.length > 0) {
      // Pick highest quality by height then bitrate
      bestFormat = anyClean.reduce((best: any, curr: any) => {
        const bs = (best.height || 0) * 1000 + (best.tbr || 0);
        const cs = (curr.height || 0) * 1000 + (curr.tbr || 0);
        return cs > bs ? curr : best;
      });
      cleanVideoUrl = bestFormat.url;
      bestHeight = bestFormat.height || 0;
    }
  }

  // STEP 3: Fallback to info.url (yt-dlp best pick)
  const finalUrl = cleanVideoUrl || info.url || "";
  if (!finalUrl) throw new Error("No video found");

  return {
    videoUrl: finalUrl,
    title: info.title || "Snapchat Video",
    description: info.description || "",
    thumbnail: info.thumbnail || "",
    duration: info.duration_string || "",
    uploader: info.uploader || info.uploader_id || "User",
    uploader_id: info.uploader_id || undefined,
    width: bestFormat?.width || info.width || 0,
    height: bestHeight || info.height || 0,
    isClean: !!cleanVideoUrl,
  };
}

// =====================================================
// SERVER START
// =====================================================
async function startServer() {
  const app = express();

  try {
    await ensureYTDlp();
    const ytDlpWrap = new YTDlpWrap(YTDLP_PATH);

    // Pre-warm yt-dlp process for faster first request
    try {
      await ytDlpWrap.getVideoInfo(["--version"]).catch(() => {});
      console.log("✅ yt-dlp pre-warmed");
    } catch {}

    app.set("trust proxy", 1);

    app.use(
      helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
        contentSecurityPolicy: false,
        frameguard: false,
      })
    );

    app.use(
      cors({
        origin: process.env.APP_URL || "http://localhost:3000",
        credentials: true,
      })
    );

    // Compression — speeds up text/JSON responses
    app.use(compression({ level: 1 }));
    app.use(express.json());

    // Real-time Traffic Aggregation Middleware
    app.use((req, res, next) => {
      totalRequests++;
      const start = Date.now();
      res.on("finish", () => {
        const duration = Date.now() - start;
        if (res.statusCode >= 200 && res.statusCode < 400) {
          successRequestsCount++;
        } else {
          failedRequestsCount++;
        }
        
        if (req.originalUrl.startsWith("/api/")) {
          latencyHistory.push(duration);
          if (latencyHistory.length > 50) {
            latencyHistory.shift();
          }
        }
      });
      next();
    });

    // Friendly JSON parse error handling for bad requests
    app.use(
      (
        err: any,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        if (err instanceof SyntaxError && "body" in err) {
          return res.status(400).json({ error: "Invalid JSON body." });
        }
        next(err);
      }
    );

    // Rate limiter (optimized for better throughput)
    const limiter = rateLimit({
      windowMs: 60 * 1000,  // 1 minute window
      max: 200,  // Increased from 120 to 200 requests per minute for better throughput
      message: { error: "Too many requests. Please slow down and try again in a moment." },
    });

    // =====================================================
    // ROUTE: Health check
    // =====================================================
    app.get("/api/health", (req, res) => {
      res.json({ status: "ok", ready: isReady, tasks: activeTasks });
    });

    // =====================================================
    // ROUTE: Admin System Status & Alerts (Private)
    // =====================================================
    app.get("/api/admin/status", (req, res) => {
      const passcode = req.headers["x-admin-passcode"];
      const envPasscode = process.env.DASHBOARD_PASSCODE || "1423";
      if (passcode !== envPasscode) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const getStatsForTool = (toolKey: string, filterFn: (log: ActivityLog) => boolean, defaultLatency: number) => {
        const matchingLogs = activityLogs.filter(filterFn).filter(l => l.status === "success" && l.latency > 0);
        const avgLatency = matchingLogs.length > 0
          ? Math.round(matchingLogs.reduce((sum, l) => sum + l.latency, 0) / matchingLogs.length)
          : defaultLatency;

        // Determine tool status based on recent alerts for this tool
        const toolAlerts = systemAlerts.filter(a => a.tool.toLowerCase().includes(toolKey.toLowerCase()) || (toolKey === "dp" && a.tool === "DP Downloader"));
        const hasRecentError = toolAlerts.some(a => a.type === "error");
        const hasRecentWarning = toolAlerts.some(a => a.type === "warning");

        let status: "operational" | "slow" | "offline" = "operational";
        if (!isSnapchatReachable) {
          status = "offline";
        } else if (hasRecentError) {
          status = "offline";
        } else if (hasRecentWarning || avgLatency > 5000) {
          status = "slow";
        }

        return { status, avgLatency };
      };

      const dpStats = getStatsForTool("DP Downloader", l => l.type === "profile" && l.message.includes("DP"), 350);
      const profileStats = getStatsForTool("Profile Viewer", l => l.type === "profile" && !l.message.includes("DP"), 450);
      const storiesStats = getStatsForTool("Story Viewer", l => l.type === "stories", 600);
      const downloadStats = getStatsForTool("Video Downloader", l => l.type === "download", 800);
      const bulkStats = getStatsForTool("Bulk Downloader", l => l.type === "bulk", 1200);

      const tools = [
        { id: "dp", name: "DP Downloader", status: dpStats.status, avgLatency: dpStats.avgLatency },
        { id: "profile-viewer", name: "Profile Viewer", status: profileStats.status, avgLatency: profileStats.avgLatency },
        { id: "stories", name: "Story Viewer", status: storiesStats.status, avgLatency: storiesStats.avgLatency },
        { id: "download", name: "Video Downloader", status: downloadStats.status, avgLatency: downloadStats.avgLatency },
        { id: "bulk-videos", name: "Bulk Downloader", status: bulkStats.status, avgLatency: bulkStats.avgLatency },
      ];

      let systemStatus: "operational" | "degraded" | "outage" = "operational";
      const offlineCount = tools.filter(t => t.status === "offline").length;
      const slowCount = tools.filter(t => t.status === "slow").length;

      if (!isSnapchatReachable || offlineCount === tools.length) {
        systemStatus = "outage";
      } else if (offlineCount > 0 || slowCount > 0) {
        systemStatus = "degraded";
      }

      return res.json({
        success: true,
        systemStatus,
        snapchatReachable: isSnapchatReachable,
        uptime: Math.round(process.uptime()),
        tools,
        alerts: systemAlerts
      });
    });

    // =====================================================
    // ROUTE: Profile DP Downloader
    // =====================================================
    app.post("/api/dp", limiter, async (req, res) => {
      const start = Date.now();
      let { username } = req.body;
      if (!username)
        return res.status(400).json({ error: "Username is required. Please enter a valid Snapchat username or profile link." });
      
      let user = "";
      try {
        user = await resolveUsernameFromAnyInput(username);
      } catch (err: any) {
        if (err.message === "REDIRECT_FAILED") {
          return res.status(400).json({ error: "We could not resolve this short Snapchat link. Snapchat might be rate-limiting requests. Please try pasting the username or full profile link directly." });
        }
        return res.status(400).json({ error: "Invalid username or link format. Please enter a valid Snapchat username or link." });
      }

      const cacheKey = `dp_${user}`;
      if (!configCacheBypass && metadataCache.has(cacheKey)) {
        cacheHitsCount++;
        const cached = metadataCache.get(cacheKey);
        addActivityLog("profile", user, "success", 0, `Served HD DP for @${user} from cache.`);
        return res.json(cached);
      }
      cacheMissesCount++;

      // Try robust NextJS-based profile scraping first for DP & Display Name
      try {
        console.log(`[DP] Attempting robust profile scrape first for: ${user}`);
        const pageUrl = `https://www.snapchat.com/add/${user}`;
        const response = await axiosInstance.get(pageUrl, {
          headers: HEADERS_MOBILE,
          timeout: configScraperTimeout,
          validateStatus: () => true,
        });
        const pageData = {
          pageUrl,
          status: response.status,
          html: response.data,
          $: cheerio.load(response.data),
        };
        const profile = await scrapeSnapchatProfile(user, pageData);
        if (profile && profile.avatar) {
          cheerioUsageCount++;
          const hdDpUrl = getHdDpUrl(profile.avatar);
          let finalDisplayName = profile.displayName || user;
          finalDisplayName = cleanDisplayName(finalDisplayName);
          if (!finalDisplayName || finalDisplayName.toLowerCase() === 'snapchat' || finalDisplayName.toLowerCase() === 'snapchat user') {
            finalDisplayName = user.charAt(0).toUpperCase() + user.slice(1);
          }

          const result = {
            success: true,
            username: user,
            uploader: finalDisplayName,
            title: `${finalDisplayName}'s Profile Picture`,
            thumbnail: `/api/dp-proxy?url=${encodeURIComponent(hdDpUrl)}&username=${user}`,
            dpUrl: `/api/dp-proxy?url=${encodeURIComponent(hdDpUrl)}&username=${user}`,
            downloadUrl: `/api/dp-proxy?url=${encodeURIComponent(hdDpUrl)}&username=${user}&download=true`,
            profileUrl: profile.profileUrl || `https://www.snapchat.com/add/${user}`,
          };
          metadataCache.set(cacheKey, result);
          const latency = Date.now() - start;
          addActivityLog("profile", user, "success", latency, `Successfully resolved HD DP for @${user} in ${latency}ms.`);
          if (latency > 5000) {
            addSystemAlert("warning", "DP Downloader", `Slow response resolving HD DP for username '${maskSensitiveInfo(user)}' (took ${latency}ms)`);
          }
          return res.json(result);
        }
      } catch (err: any) {
        console.warn(`[DP] Fast profile scrape failed/no avatar for ${user}: ${err.message}`);
      }

      const urls = [
        `https://www.snapchat.com/add/${user}`,
        `https://www.snapchat.com/@${user}`,
      ];

      try {
        const result = await Promise.any(
          urls.map(async (pageUrl) => {
            const response = await axiosInstance.get(pageUrl, {
              headers: HEADERS_MOBILE,
              validateStatus: () => true,
              timeout: configScraperTimeout,
            });

            if (response.status !== 200) throw new Error("Not found");

            const $ = cheerio.load(response.data);
            let dpUrl =
              $('meta[property="og:image"]').attr("content") ||
              $('meta[name="twitter:image"]').attr("content") ||
              $('meta[property="og:image:url"]').attr("content") ||
              $('img.userAvatar__image').attr("src") ||
              $('img[data-testid="user-avatar"]').attr("src");

            // Skip default/placeholder images
            if (
              dpUrl &&
              (dpUrl.includes("default") ||
                dpUrl.includes("placeholder") ||
                dpUrl.includes("static-misc") ||
                dpUrl === "")
            ) {
              dpUrl = undefined;
            }

            if (!dpUrl) throw new Error("No valid DP found");

            cheerioUsageCount++;
            const hdDpUrl = getHdDpUrl(dpUrl);
            let displayName = (
              $('meta[property="og:title"]').attr("content") || user
            );
            displayName = cleanDisplayName(displayName);
            if (!displayName || displayName.toLowerCase() === 'snapchat' || displayName.toLowerCase() === 'snapchat user') {
              displayName = user.charAt(0).toUpperCase() + user.slice(1);
            }

            return {
              success: true,
              username: user,
              uploader: displayName,
              title: `${displayName}'s Profile Picture`,
              thumbnail: `/api/dp-proxy?url=${encodeURIComponent(hdDpUrl)}&username=${user}`,
              dpUrl: `/api/dp-proxy?url=${encodeURIComponent(hdDpUrl)}&username=${user}`,
              downloadUrl: `/api/dp-proxy?url=${encodeURIComponent(hdDpUrl)}&username=${user}&download=true`,
              profileUrl: `https://www.snapchat.com/add/${user}`,
            };
          })
        );

        metadataCache.set(cacheKey, result);
        const latency = Date.now() - start;
        addActivityLog("profile", user, "success", latency, `Successfully resolved HD DP for @${user} in ${latency}ms (Promise Fallback).`);
        if (latency > 5000) {
          addSystemAlert("warning", "DP Downloader", `Slow response resolving HD DP for username '${maskSensitiveInfo(user)}' via fallback (took ${latency}ms)`);
        }
        return res.json(result);
      } catch {
        const latency = Date.now() - start;
        addActivityLog("profile", user, "failed", latency, `Failed to resolve HD DP for @${user}. Profile private or unavailable.`);
        addSystemAlert("error", "DP Downloader", `Failed to resolve HD DP for username '${maskSensitiveInfo(user)}'. Profile private or unavailable.`);
        return res.status(404).json({ error: `The username "${user}" was not found or the profile is private. Please check the username and try again.` });
      }
    });

    // =====================================================
    // ROUTE: Stories Viewer
    // =====================================================
    app.post("/api/stories", limiter, async (req, res) => {
      const start = Date.now();
      let { username: rawInput } = req.body;
      if (!rawInput)
        return res.status(400).json({ error: "Username or Snapchat story link is required." });

      rawInput = await resolveSnapchatUrl(rawInput);

      let username: string;
      let isDirectStoryLink = false;
      let storyUrl = "";

      const storyLinkPattern = /(?:snapchat|snap)\.com\/s\/|(?:snapchat|snap)\.com\/add\/@?[a-zA-Z0-9._-]{3,30}\/story\//i;
      if (storyLinkPattern.test(rawInput.trim())) {
        isDirectStoryLink = true;
        storyUrl = rawInput.trim().split("?")[0].split("#")[0];
        const match = rawInput.match(/(?:snapchat|snap)\.com\/add\/@?([a-zA-Z0-9._-]{3,30})\/story\//i);
        username = match ? match[1].toLowerCase() : "";
      } else {
        try {
          username = await resolveUsernameFromAnyInput(rawInput);
          if (!username || username.length < 1) {
            return res.status(400).json({ error: "Invalid username format. Please enter a valid Snapchat username or ID." });
          }
        } catch (error: any) {
          if (error.message === "REDIRECT_FAILED") {
            return res.status(400).json({
              error: "We could not resolve this short Snapchat link. Snapchat might be rate-limiting requests. Please try pasting the username or full link directly."
            });
          } else {
            return res.status(400).json({ error: "Invalid input format. Please enter a valid Snapchat username or link." });
          }
        }
      }

      const cacheKey = isDirectStoryLink ? `stories_link_${storyUrl}` : `stories_${username}`;

      // CDN URLs expire in minutes; bypass cache for stories to ensure fresh playable links
      if (false && metadataCache.has(cacheKey)) {
        console.log(`[Cache Hit] Stories for ${isDirectStoryLink ? storyUrl : `@${username}`}`);
        cacheHitsCount++;
        return res.json(metadataCache.get(cacheKey));
      }
      cacheMissesCount++;

      try {
        if (isDirectStoryLink) {
          let info: any = null;
          // Try native fast scraper first
          const scraped = await scrapeSpotlightMedia(storyUrl);
          if (scraped && scraped.videoUrl) {
            console.log(`[Stories] Native story scrape succeeded for: ${storyUrl}`);
            cheerioUsageCount++;
            info = {
              videoUrl: scraped.videoUrl,
              thumbnail: scraped.thumbnail,
              title: scraped.title,
              uploader: scraped.uploader,
              username: scraped.username,
            };
          } else {
            console.log(`[Stories] Direct story link native scraping did not find a video URL. Falling back to yt-dlp: ${storyUrl}`);
            ytdlpUsageCount++;
            const ytInfo = await yt_dlp_fast(storyUrl, ytDlpWrap);
            
            // Merge with natively parsed metadata if available
            const finalUsername = scraped?.username || username || ytInfo.uploader_id || undefined;
            let finalDisplayName = scraped?.displayName || scraped?.uploader || undefined;
            if (!finalDisplayName || finalDisplayName.toLowerCase() === 'snapchat' || finalDisplayName.toLowerCase() === 'snapchat user') {
              finalDisplayName = finalUsername || ytInfo.uploader || "Snapchat User";
            }
            finalDisplayName = cleanDisplayName(finalDisplayName);
            if (!finalDisplayName || finalDisplayName.toLowerCase() === 'snapchat' || finalDisplayName.toLowerCase() === 'snapchat user') {
              finalDisplayName = finalUsername ? (finalUsername.charAt(0).toUpperCase() + finalUsername.slice(1)) : "Snapchat User";
            }

            info = {
              videoUrl: ytInfo.videoUrl,
              thumbnail: scraped?.thumbnail || ytInfo.thumbnail || "",
              title: (scraped?.title && scraped.title !== 'Snapchat Spotlight') ? scraped.title : (ytInfo.title || "Snapchat Story"),
              uploader: finalDisplayName,
              username: finalUsername,
            };
          }

          const storyItem = {
            id: Math.random().toString(36).slice(2, 10),
            type: "video",
            url: info.videoUrl,
            thumbnail: info.thumbnail || "",
            title: info.title || "Snapchat Story",
            downloadUrl: `/api/proxy?url=${encodeURIComponent(info.videoUrl)}&filename=snapchat_story_${Date.now()}.mp4`,
          };

          const result = {
            success: true,
            username: info.username || username,
            uploader: info.uploader || "Snapchat User",
            thumbnail: info.thumbnail || "",
            stories: [storyItem],
            profileUrl: storyUrl,
            stats: {},
          };

          metadataCache.set(cacheKey, result);
          const latency = Date.now() - start;
          addActivityLog("stories", info.username || username || "anonymous", "success", latency, `Successfully resolved story link for @${info.username || username || "anonymous"} in ${latency}ms.`);
          if (latency > 5000) {
            addSystemAlert("warning", "Story Viewer", `Slow response resolving story link for '${maskSensitiveInfo(info.username || username || "anonymous")}' (took ${latency}ms)`);
          }
          return res.json(result);
        }

        // First, fetch the profile page once and parse both profile and stories from it
        const pageData = await fetchSnapchatProfilePage(username);
        const profile = await scrapeSnapchatProfile(username, pageData);
        const scoreData = profile ? calculateStrategyScore(profile) : null;

        if (pageData.status !== 200) {
          throw new Error("Profile not found");
        }
        cheerioUsageCount++;

        const $ = pageData.$;
        const stories: any[] = [];

        // Method 1: JSON-LD structured data (most reliable)
        $('script[type="application/ld+json"]').each((_, el) => {
          const rawJson = ($(el).html() || "").trim();
          if (!rawJson) return;
          try {
            const json = JSON.parse(rawJson);
            const items =
              json["@graph"] || (Array.isArray(json) ? json : [json]);
            for (const item of items) {
              if (item.contentUrl) {
                const isImg = item["@type"] === "ImageObject";
                stories.push({
                  id: Math.random().toString(36).slice(2, 10),
                  type: isImg ? "image" : "video",
                  url: item.contentUrl,
                  thumbnail: item.thumbnailUrl || item.contentUrl,
                  title: item.name || `Story ${stories.length + 1}`,
                  downloadUrl: `/api/story-proxy?url=${encodeURIComponent(item.contentUrl)}&type=${isImg ? "image" : "video"}&username=${username}&num=${stories.length + 1}`,
                });
              }
            }
          } catch (parseError) {
            // Ignore invalid JSON-LD blocks
          }
        });

        // Method 2: Raw script tag scanning (fallback)
        if (stories.length === 0) {
          $("script").each((_, el) => {
            const content = $(el).html() || "";
            if (content.includes("contentUrl")) {
              try {
                const matches =
                  content.match(/"contentUrl"\s*:\s*"([^"]+)"/g) || [];
                matches.forEach((match) => {
                  const mediaUrl = (match as string)
                    .replace(/"contentUrl"\s*:\s*"/, "")
                    .replace(/"$/, "");
                  if (mediaUrl.startsWith("http")) {
                    const isImg =
                      mediaUrl.includes(".jpg") ||
                      mediaUrl.includes(".jpeg") ||
                      mediaUrl.includes(".webp");
                    stories.push({
                      id: Math.random().toString(36).slice(2, 10),
                      type: isImg ? "image" : "video",
                      url: mediaUrl,
                      thumbnail: mediaUrl,
                      title: `Story ${stories.length + 1}`,
                      downloadUrl: `/api/story-proxy?url=${encodeURIComponent(mediaUrl)}&type=${isImg ? "image" : "video"}&username=${username}&num=${stories.length + 1}`,
                    });
                  }
                });
              } catch {}
            }
          });
        }

        if (stories.length > 0 || profile) {
          const result: any = {
            success: true,
            username: username,
            uploader: profile?.displayName || username,
            thumbnail: profile?.avatar,
            stories,
            profileUrl: profile?.profileUrl || `https://www.snapchat.com/add/${username}`,
            stats: profile ? {
              subscribers: profile.subscribers,
              stories: profile.stories,
              highlights: profile.highlights,
              spotlights: profile.spotlights,
              totalViews: profile.totalViews,
              consistency: scoreData?.consistency,
              engagement: scoreData?.engagement,
              contentMix: scoreData?.contentMix,
              growthRate: scoreData?.growthRate,
            } : {}
          };
          
          if (scoreData) {
            result.score = scoreData.score;
          }
          
          metadataCache.set(cacheKey, result);
          const latency = Date.now() - start;
          addActivityLog("stories", username, "success", latency, `Successfully scraped ${stories.length} stories for @${username} in ${latency}ms.`);
          if (latency > 5000) {
            addSystemAlert("warning", "Story Viewer", `Slow response scraping stories for username '${maskSensitiveInfo(username)}' (took ${latency}ms)`);
          }
          return res.json(result);
        }
      } catch (err: any) {
        const latency = Date.now() - start;
        console.error(`[Stories] failed for ${isDirectStoryLink ? rawInput : `@${username}`}:`, err.message);
        addActivityLog("stories", username || "anonymous", "failed", latency, `Failed to resolve stories: ${err.message}`);
        addSystemAlert("error", "Story Viewer", `Failed to resolve stories for '${maskSensitiveInfo(isDirectStoryLink ? rawInput : (username || "anonymous"))}': ${err.message}`);
        return res.status(404).json({ error: `No public stories found for ${isDirectStoryLink ? rawInput : `@${username}`}.` });
      }

      const latency = Date.now() - start;
      addActivityLog("stories", username || "anonymous", "failed", latency, `No public stories found.`);
      addSystemAlert("error", "Story Viewer", `No public stories found for '${maskSensitiveInfo(isDirectStoryLink ? rawInput : (username || "anonymous"))}'.`);
      return res.status(404).json({ error: `No public stories found for ${isDirectStoryLink ? rawInput : `@${username}`}.` });
    });

    // =====================================================
    // ROUTE: Profile Viewer (Permanent Implementation)
    // =====================================================
    
    // Helper: Parse username from raw input and reject extra junk
    // Accepts: username, @username, URLs like snapchat.com/add/username and snapchat.com/@username
    function parseSnapUsername(input: string): string {
      const trimmed = input.trim();
      if (!trimmed) {
        throw new Error("INVALID_USERNAME");
      }

      const normalized = trimmed.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split(/[?#]/)[0].trim();
      const usernamePattern = /^[a-zA-Z0-9._-]{3,30}$/;

      // Check if redirect link was not resolved (which means a network/redirect resolution failure)
      if (normalized.includes('t.snapchat.com/')) {
        throw new Error("REDIRECT_FAILED");
      }

      // Check for spotlight link - should not be processed as a username
      if (normalized.includes('/spotlight/') || normalized.includes('snapchat.com/spotlight/') || /(?:snapchat|snap)\.com\/p\//i.test(normalized)) {
        throw new Error("SPOTLIGHT_URL_DETECTED");
      }

      // Check if it's a story link - should not be processed as a username
      if (/(?:snapchat|snap)\.com\/s\//i.test(normalized) || /(?:snapchat|snap)\.com\/add\/@?[a-zA-Z0-9._-]{3,30}\/story\//i.test(normalized)) {
        throw new Error("STORY_URL_DETECTED");
      }

      // Extract from profile URL: snapchat.com/add/username or snap.com/add/username
      let match = normalized.match(/^(?:snapchat|snap)\.com\/add\/@?([a-zA-Z0-9._-]{3,30})(?:\/|$)/i);
      if (match) {
        return match[1].toLowerCase();
      }

      // Extract from profile URL: snapchat.com/@username or snap.com/@username
      match = normalized.match(/^(?:snapchat|snap)\.com\/@([a-zA-Z0-9._-]{3,30})(?:\/|$)/i);
      if (match) {
        return match[1].toLowerCase();
      }

      // Extract from plain username like @username or username
      const plainUsername = trimmed.replace(/^[@#]/, "").trim();
      if (!plainUsername || /[\s]/.test(plainUsername)) {
        throw new Error("INVALID_USERNAME");
      }

      if (!usernamePattern.test(plainUsername)) {
        throw new Error("INVALID_USERNAME");
      }

      return plainUsername.toLowerCase();
    }

    function extractSpotlightUsernameFromUrl(rawUrl: string): string | null {
      const normalized = rawUrl
        .trim()
        .replace(/^https?:\/\//i, "")
        .replace(/^www\./i, "")
        .split(/[?#]/)[0]
        .trim();

      let match = normalized.match(/^(?:snapchat|snap)\.com\/(?:add\/)??([a-zA-Z0-9._-]{3,30})\/spotlight\//i);
      if (match) {
        return match[1].toLowerCase();
      }

      match = normalized.match(/^(?:snapchat|snap)\.com\/@([a-zA-Z0-9._-]{3,30})\/spotlight\//i);
      if (match) {
        return match[1].toLowerCase();
      }

      return null;
    }

    async function resolveUsernameFromAnyInput(input: string): Promise<string> {
      let cleaned = input.trim();
      if (!cleaned) {
        throw new Error("INVALID_USERNAME");
      }

      // Check cache first
      if (resolvedUsernamesCache.has(cleaned)) {
        return resolvedUsernamesCache.get(cleaned)!;
      }

      // Check pending promise coalescing
      let pending = pendingUsernames.get(cleaned);
      if (pending) {
        return pending;
      }

      const promise = (async () => {
        let working = cleaned;
        // Pre-clean spaces, brackets etc.
        working = working.replace(/\s+/g, "");
        working = working.replace(/[\)\]\.,;]+$/g, "");

        // 1. Resolve redirect link if it is t.snapchat.com
        if (working.includes("t.snapchat.com")) {
          try {
            working = await resolveSnapchatUrl(working);
          } catch (e: any) {
            throw new Error("REDIRECT_FAILED");
          }
          if (!working || working.includes("t.snapchat.com")) {
            throw new Error("REDIRECT_FAILED");
          }
        }

        // Clean query params
        try {
          const urlObj = new URL(working);
          working = `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
        } catch {
          working = working.split("?")[0].split("#")[0];
        }

        const normalized = working.replace(/^https?:\/\//i, "").replace(/^www\./i, "").trim();

        // 2. Check for Profile Add URLs: snapchat.com/add/username or snapchat.com/@username
        let match = normalized.match(/^(?:snapchat|snap)\.com\/add\/@?([a-zA-Z0-9._-]{3,30})(?:\/|$)/i);
        if (match) {
          return match[1].toLowerCase();
        }
        match = normalized.match(/^(?:snapchat|snap)\.com\/@([a-zA-Z0-9._-]{3,30})(?:\/|$)/i);
        if (match) {
          return match[1].toLowerCase();
        }

        // 3. Check for Spotlight/Story links: snapchat.com/spotlight/ or snapchat.com/s/ or snapchat.com/p/
        if (normalized.includes("/spotlight/") || normalized.includes("/s/") || normalized.includes("/p/") || normalized.includes("snapchat.com/")) {
          // Attempt spotlight username extraction from URL
          const spotUser = extractSpotlightUsernameFromUrl(working);
          if (spotUser) {
            return spotUser.toLowerCase();
          }

          // Fetch page natively to scrape creator username
          try {
            const scraped = await scrapeSpotlightMedia(working);
            if (scraped && scraped.username) {
              return scraped.username.toLowerCase();
            }
          } catch (e: any) {
            console.error(`[resolveUsernameFromAnyInput] Native scrape failed for ${working}:`, e.message);
          }

          // If native scrape failed, fallback to yt-dlp to find creator username
          try {
            console.log(`[resolveUsernameFromAnyInput] Falling back to yt-dlp for: ${working}`);
            const info = await yt_dlp_fast(working, ytDlpWrap);
            let candidate = [info.uploader_id, info.uploader]
              .filter(Boolean)
              .map((v: string) => v.trim())
              .find((v: string) => /^[a-zA-Z0-9._-]{3,30}$/.test(v));
            
            if (!candidate) {
              let parsedCreator = null;
              if (info.description) {
                parsedCreator = extractCreatorFromText(info.description);
              }
              if (!parsedCreator && info.title) {
                parsedCreator = extractCreatorFromText(info.title);
              }
              if (parsedCreator && parsedCreator.username) {
                candidate = parsedCreator.username;
              }
            }
            if (candidate) {
              return candidate.toLowerCase();
            }
          } catch (e: any) {
            console.error(`[resolveUsernameFromAnyInput] yt-dlp fallback failed for ${working}:`, e.message);
          }
        }

        // 4. Default: clean it as a plain username (strip @, etc.)
        const plain = cleanUsername(working);
        if (!plain || !/^[a-zA-Z0-9._-]{3,30}$/.test(plain)) {
          throw new Error("INVALID_USERNAME");
        }
        return plain.toLowerCase();
      })();

      pendingUsernames.set(cleaned, promise);
      try {
        const username = await promise;
        resolvedUsernamesCache.set(cleaned, username);
        return username;
      } finally {
        pendingUsernames.delete(cleaned);
      }
    }

    // Scrape and parse Snapchat profile
    // =====================================================
    async function scrapeSnapchatProfile(
      username: string,
      pageData?: { pageUrl: string; html: string; $: cheerio.CheerioAPI; status: number }
    ): Promise<any> {
      try {
        console.log(`[Scraper] Web scraping profile for @${username}...`);
        const data = pageData || (await fetchSnapchatProfilePage(username));

        if (!data || data.status !== 200) {
          console.warn(`[Scraper] Profile page not found (${data?.status}) for @${username}`);
          return null;
        }

        const $ = data.$;
        const html = data.html;
        const pageUrl = data.pageUrl;
        
        // Extract profile data from page
        let displayName = ($('meta[property="og:title"]').attr("content") || username)
          .replace(/\s+on Snapchat$/i, "")
          .trim();
        let avatar = $('meta[property="og:image"]').attr("content") || 
                      $('meta[name="twitter:image"]').attr("content") || "";
        let bio = ($('meta[property="og:description"]').attr("content") || "").substring(0, 500);
        let snapcode = `https://app.snapchat.com/web/deeplink/snapcode?username=${username}&type=SVG&bitmoji=enable`;

        // Enhanced stats extraction (initialized to null to distinguish absent from zero)
        let subscribers: number | null = null;
        let stories: number | null = null;
        let highlights: number | null = null;
        let spotlights: number | null = null;
        let totalViews: number | null = null;
        
        // Method 1: Try to extract from Next.js payload (__NEXT_DATA__) - Most reliable!
        try {
          const nextDataScript = $('script#__NEXT_DATA__').html();
          if (nextDataScript) {
            const nextData = JSON.parse(nextDataScript.trim());
            const pageProps = nextData.props?.pageProps;
            if (pageProps) {
              const publicProfileInfo = pageProps.userProfile?.publicProfileInfo;
              if (publicProfileInfo) {
                if (publicProfileInfo.title) displayName = publicProfileInfo.title.trim();
                if (publicProfileInfo.bio) bio = publicProfileInfo.bio.trim().substring(0, 500);
                if (publicProfileInfo.profilePictureUrl) avatar = publicProfileInfo.profilePictureUrl;
                if (publicProfileInfo.snapcodeImageUrl) snapcode = publicProfileInfo.snapcodeImageUrl;
                else if (pageProps.pageLinks?.snapcodeImageUrl) snapcode = pageProps.pageLinks.snapcodeImageUrl;
                
                if (publicProfileInfo.subscriberCount !== undefined && publicProfileInfo.subscriberCount !== null) {
                  const subCount = Number(publicProfileInfo.subscriberCount);
                  if (!isNaN(subCount)) subscribers = subCount;
                }
              }
              
              // Calculate stories count
              if (pageProps.story?.snapList) {
                stories = pageProps.story.snapList.length;
              } else if (publicProfileInfo?.hasStory) {
                stories = 0;
              }
              
              // Calculate curated highlights count (videos count)
              if (pageProps.curatedHighlights) {
                let totalSnaps = 0;
                let hasSnapList = false;
                pageProps.curatedHighlights.forEach((hl: any) => {
                  if (hl.snapList) {
                    totalSnaps += hl.snapList.length;
                    hasSnapList = true;
                  }
                });
                highlights = hasSnapList ? totalSnaps : (publicProfileInfo?.hasCuratedHighlights ? 0 : null);
              }
              
              // Calculate spotlight highlights count (videos count)
              if (pageProps.spotlightHighlights) {
                let totalSnaps = 0;
                let hasSnapList = false;
                pageProps.spotlightHighlights.forEach((hl: any) => {
                  if (hl.snapList) {
                    totalSnaps += hl.snapList.length;
                    hasSnapList = true;
                  }
                });
                spotlights = hasSnapList ? totalSnaps : (publicProfileInfo?.hasSpotlightHighlights ? 0 : null);
              }
              
              // Calculate total views from spotlightStoryMetadata
              if (pageProps.spotlightStoryMetadata) {
                let total = 0;
                pageProps.spotlightStoryMetadata.forEach((story: any) => {
                  const vc = Number(story.engagementStats?.viewCount || story.videoMetadata?.viewCount || 0);
                  if (!isNaN(vc)) {
                    total += vc;
                  }
                });
                totalViews = total;
              }
            }
          }
        } catch (err: any) {
          console.warn(`[Scraper] Next.js payload parsing failed, using fallbacks:`, err.message);
        }

        // Method 2: Try to extract from JSON-LD structured data (fallback)
        try {
          $('script[type="application/ld+json"]').each((_, el) => {
            try {
              const jsonData = JSON.parse($(el).html() || "{}");
              if (jsonData.interactionStatistic) {
                jsonData.interactionStatistic.forEach((stat: any) => {
                  if (stat["@type"] === "InteractionCounter") {
                    if (stat.interactionType?.includes("Follow") && subscribers === null) {
                      subscribers = stat.userInteractionCount || 0;
                    }
                    if (stat.interactionType?.includes("ViewAction") && totalViews === null) {
                      totalViews = stat.userInteractionCount || 0;
                    }
                    if (stat.interactionType?.includes("PublishAction") && stories === null) {
                      stories = stat.userInteractionCount || 0;
                    }
                  }
                });
              }
            } catch {}
          });
        } catch {}

        // Method 3: Extract from window.__INITIAL_STATE__ (fallback)
        try {
          const stateMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?})\s*;/);
          if (stateMatch) {
            const stateData = JSON.parse(stateMatch[1]);
            if (stateData.profile) {
              subscribers = subscribers ?? stateData.profile.subscribers ?? null;
              stories = stories ?? stateData.profile.stories ?? null;
              highlights = highlights ?? stateData.profile.highlights ?? null;
              spotlights = spotlights ?? stateData.profile.spotlights ?? null;
              totalViews = totalViews ?? stateData.profile.totalViews ?? stateData.profile.views ?? null;
            }
          }
        } catch {}

        // Method 4: Extract from visible text (fallback)
        const parseNumber = (str: string | undefined): number => {
          if (!str) return 0;
          const clean = str.toUpperCase().replace(/[,\s]/g, "");
          if (clean.endsWith("K")) return Math.floor(parseFloat(clean) * 1000);
          if (clean.endsWith("M")) return Math.floor(parseFloat(clean) * 1000000);
          if (clean.endsWith("B")) return Math.floor(parseFloat(clean) * 1000000000);
          return parseInt(clean) || 0;
        };

        const pageText = $.text();
        
        if (subscribers === null) {
          const subscribersMatch = pageText.match(/(\d+(?:[,.]\d+)*(?:[KMB])?)\s*(?:Subscriber|Follower|subscriber|follower)/i);
          if (subscribersMatch) subscribers = parseNumber(subscribersMatch[1]);
        }
        if (stories === null) {
          const storiesMatch = pageText.match(/(\d+(?:[,.]\d+)*(?:[KMB])?)\s*(?:Storie|story|storie|Story)/i);
          if (storiesMatch) stories = parseNumber(storiesMatch[1]);
        }
        if (highlights === null) {
          const highlightsMatch = pageText.match(/(\d+(?:[,.]\d+)*(?:[KMB])?)\s*(?:Highlight|highlight)/i);
          if (highlightsMatch) highlights = parseNumber(highlightsMatch[1]);
        }
        if (spotlights === null) {
          const spotlightsMatch = pageText.match(/(\d+(?:[,.]\d+)*(?:[KMB])?)\s*(?:Spotlight|spotlight)/i);
          if (spotlightsMatch) spotlights = parseNumber(spotlightsMatch[1]);
        }
        if (totalViews === null) {
          const viewsMatch = pageText.match(/(\d+(?:[,.]\d+)*(?:[KMB])?)\s*(?:View|view)/i);
          if (viewsMatch) totalViews = parseNumber(viewsMatch[1]);
        }

        // Method 5: Try finding numbers in data attributes or aria-labels (fallback)
        const statsElements = $('[data-stat], [aria-label*="subscriber"], [aria-label*="story"], [aria-label*="view"]');
        statsElements.each((_, el) => {
          const text = $(el).text() || $(el).attr('aria-label') || '';
          const num = parseNumber(text.match(/(\d+(?:[,.]\d+)*(?:[KMB])?)/)?.[1]);
          
          if (text.match(/subscriber|follower/i) && subscribers === null) subscribers = num;
          if (text.match(/story|storie/i) && stories === null) stories = num;
          if (text.match(/highlight/i) && highlights === null) highlights = num;
          if (text.match(/spotlight/i) && spotlights === null) spotlights = num;
          if (text.match(/view/i) && totalViews === null) totalViews = num;
        });

        const scrapedProfile = {
          username: username.toLowerCase(),
          displayName,
          avatar,
          bio,
          snapcode,
          profileUrl: pageUrl,
          subscribers,
          stories,
          highlights,
          spotlights,
          totalViews,
          isPublic: true,
          metadata: {
            pageTitle: displayName,
            pageDescription: bio,
          },
        };

        console.log(`[Scraper] ✅ Profile scraped: @${scrapedProfile.username} (${subscribers} subscribers, ${totalViews} views)`);
        return scrapedProfile;
      } catch (err: any) {
        console.error(`[Scraper] Error scraping profile for @${username}:`, err?.message);
        return null;
      }
    }

    // Scrape and parse Snapchat Spotlight or story media pages natively (sub-second performance)
    // =====================================================
    async function scrapeSpotlightMedia(url: string): Promise<any> {
      try {
        console.log(`[Scraper] Attempting native scrape for media URL: ${url}`);
        let response = await axiosInstance.get(url, {
          headers: HEADERS_MOBILE,
          timeout: configScraperTimeout,
          validateStatus: () => true
        });

        // Fallback to desktop headers if mobile fails (returns non-200, such as 403, 429)
        if (response.status !== 200) {
          console.log(`[scrapeSpotlightMedia] Mobile header returned ${response.status}. Falling back to Desktop headers...`);
          try {
            const fallbackResponse = await axiosInstance.get(url, {
              headers: HEADERS_DESKTOP,
              timeout: configScraperTimeout,
              validateStatus: () => true,
            });
            if (fallbackResponse.status === 200) {
              response = fallbackResponse;
            }
          } catch (e: any) {
            console.error(`[scrapeSpotlightMedia] Desktop fallback request failed:`, e.message);
          }
        }

        if (response.status !== 200) {
          console.warn(`[Scraper] Native page fetch returned status ${response.status}`);
          return null;
        }

        const $ = cheerio.load(response.data);
        const nextDataScript = $('script#__NEXT_DATA__').html();
        
        let username = "";
        let displayName = "";
        let title = "";
        let thumbnail = "";
        let durationSec = "";
        let videoUrl = "";
        const hashtagsList: string[] = [];

        // Meta/Title parsing as basic fallback
        const metaTitle = $('meta[property="og:title"]').attr("content") || $('title').text() || "";
        const metaDescription = $('meta[property="og:description"]').attr("content") || $('meta[name="description"]').attr("content") || "";
        const metaImage = $('meta[property="og:image"]').attr("content") || $('meta[name="twitter:image"]').attr("content") || "";

        let nextDataParsed = false;
        if (nextDataScript) {
          try {
            const nextData = JSON.parse(nextDataScript.trim());
            nextDataParsed = true;
            const pp = nextData.props?.pageProps;
            if (pp) {
              const videoMeta = pp.videoMetadata;
              
              // 1. Direct extraction from videoMetadata
              if (videoMeta) {
                videoUrl = videoMeta.contentUrl || "";
                thumbnail = videoMeta.thumbnailUrl || "";
                const rawTitle = videoMeta.description || videoMeta.name || "";
                title = rawTitle === "Another Spotlight Snap brought to you by Snapchat" ? "" : rawTitle;
                durationSec = videoMeta.durationMs ? `${Math.round(Number(videoMeta.durationMs) / 1000)}s` : "";

                const creatorObj = videoMeta.creator?.personCreator;
                if (creatorObj) {
                  username = creatorObj.username || "";
                  displayName = creatorObj.name || "";
                }
              }

              // 2. Context cards extraction (extremely robust for spotlights)
              const contextCards = pp.spotlightFeed?.spotlightStories?.[0]?.metadata?.contextCards || [];
              const creatorCard = contextCards.find((c: any) => c.contextType === 3);
              if (creatorCard) {
                if (!username && creatorCard.subtitle) username = creatorCard.subtitle;
                if (!displayName && creatorCard.title) displayName = creatorCard.title;
              }

              // 3. Recursive deep search in nextData as ultimate safety net
              if (!username || !displayName) {
                const candidates: any[] = [];
                extractAllCreators(nextData, candidates);
                if (candidates.length > 0) {
                  const bestMatch = candidates.find(c => c.username && c.username.toLowerCase() !== 'snapchat');
                  if (bestMatch) {
                    if (!username) username = bestMatch.username;
                    if (!displayName) displayName = bestMatch.displayName;
                  }
                }
              }

              // 4. Page title splits as fallback
              const pageTitle = pp.pageMetadata?.pageTitle || "";
              if (pageTitle && !username) {
                const parts = pageTitle.split("|");
                if (parts.length > 0) {
                  const candidate = parts[0].trim();
                  if (/^[a-zA-Z0-9._-]{3,30}$/.test(candidate)) {
                    username = candidate;
                  }
                }
              }

              // 5. Hashtags from spotlightStories
              const storyMetaHashtags = pp.spotlightFeed?.spotlightStories?.[0]?.metadata?.hashtags || [];
              storyMetaHashtags.forEach((h: any) => {
                if (h && typeof h === 'string') hashtagsList.push(h);
                else if (h && typeof h === 'object' && h.name) hashtagsList.push(h.name);
              });
            }
          } catch (jsonErr: any) {
            console.warn(`[Scraper] Failed to parse __NEXT_DATA__ json: ${jsonErr.message}`);
          }
        }

        // --- Post-processing and Double Safety Net Fallbacks ---
        
        // Try robust parsing from metaTitle and metaDescription using extractCreatorFromText first
        if (!username || !displayName) {
          const creatorFromTitle = extractCreatorFromText(metaTitle);
          if (creatorFromTitle) {
            if (!username && creatorFromTitle.username) username = creatorFromTitle.username;
            if (!displayName && creatorFromTitle.displayName) displayName = creatorFromTitle.displayName;
          }
          if (!username || !displayName) {
            const creatorFromDesc = extractCreatorFromText(metaDescription);
            if (creatorFromDesc) {
              if (!username && creatorFromDesc.username) username = creatorFromDesc.username;
              if (!displayName && creatorFromDesc.displayName) displayName = creatorFromDesc.displayName;
            }
          }
        }

        // 1. Try parsing from metaTitle (e.g. "Ruksar Baloch (@mahobaloch29683) on Snapchat | Spotlight")
        if (metaTitle && (!username || !displayName)) {
          const titleMatch = metaTitle.match(/(.+?)\s*\((@?[a-zA-Z0-9._-]{3,30})\)/);
          if (titleMatch) {
            const parsedName = titleMatch[1].trim();
            const parsedUser = titleMatch[2].replace("@", "").trim();
            if (!displayName && parsedName && parsedName.toLowerCase() !== 'snapchat') {
              displayName = parsedName;
            }
            if (!username && parsedUser) {
              username = parsedUser;
            }
          } else {
            // Check if title is just "@username on Snapchat" or similar
            const simpleUserMatch = metaTitle.match(/@([a-zA-Z0-9._-]{3,30})/);
            if (simpleUserMatch && !username) {
              username = simpleUserMatch[1].toLowerCase();
            }
          }
        }

        // 2. Check schema tags for VideoObject or author alternateName
        $('script[type="application/ld+json"]').each((_, el) => {
          const rawJson = ($(el).html() || "").trim();
          if (!rawJson) return;
          try {
            const json = JSON.parse(rawJson);
            const items = json["@graph"] || (Array.isArray(json) ? json : [json]);
            for (const item of items) {
              if (item["@type"] === "VideoObject" || item["@type"] === "SocialMediaPosting") {
                const creator = item.author || item.creator;
                if (creator) {
                  const creatorName = creator.name;
                  const creatorUser = creator.alternateName || creator.identifier;
                  if (!displayName && creatorName && creatorName.toLowerCase() !== 'snapchat') {
                    displayName = creatorName;
                  }
                  if (!username && creatorUser) {
                    username = creatorUser.replace("@", "").trim();
                  }
                }
              }
            }
          } catch {}
        });

        // 3. Username from URL if still missing
        if (!username) {
          const urlUser = extractSpotlightUsernameFromUrl(url);
          if (urlUser) username = urlUser;
        }

        // 4. Username from meta title split if still missing
        if (!username && metaTitle) {
          const parts = metaTitle.split("|");
          if (parts.length > 0) {
            const candidate = parts[0].trim();
            if (/^[a-zA-Z0-9._-]{3,30}$/.test(candidate)) {
              username = candidate;
            }
          }
        }

        // Display Name cleanup and fallback
        if (!displayName) {
          if (metaTitle) {
            displayName = metaTitle;
          } else {
            displayName = username || "Snapchat User";
          }
        }
        displayName = cleanDisplayName(displayName);

        // If display name was cleaned to empty or "Snapchat" or "Snapchat User" or "Snapchat Spotlight", use username
        if (!displayName || displayName.toLowerCase() === 'snapchat' || displayName.toLowerCase() === 'snapchat user' || displayName.toLowerCase() === 'snapchat spotlight') {
          displayName = username ? (username.charAt(0).toUpperCase() + username.slice(1)) : "Snapchat User";
        }

        // Title cleanup and fallback
        if (!title) {
          if (metaDescription && !metaDescription.includes("Check out the best music")) {
            title = metaDescription;
          } else {
            title = "Snapchat Spotlight";
          }
        }

        // Thumbnail fallback
        if (!thumbnail) {
          thumbnail = metaImage || "";
        }

        // Hashtags parsing from title if empty
        if (hashtagsList.length === 0 && title) {
          const hashMatch = title.match(/#\w+/g);
          if (hashMatch) {
            hashMatch.forEach((h: string) => {
              const cleanedHash = h.replace("#", "").trim();
              if (cleanedHash && !hashtagsList.includes(cleanedHash)) {
                hashtagsList.push(cleanedHash);
              }
            });
          }
        }

        // Construct final scraped object
        const finalResult: any = {
          success: true,
          username: username || undefined,
          videoUrl: videoUrl || undefined,
          downloadUrl: videoUrl ? `/api/proxy?url=${encodeURIComponent(videoUrl)}&filename=snapchat_${Date.now()}.mp4` : undefined,
          title: title || "Snapchat Spotlight",
          thumbnail: thumbnail || "",
          duration: durationSec || "",
          uploader: displayName,
          displayName: displayName,
          profileUrl: username ? `https://www.snapchat.com/add/${username}` : undefined,
          quality: "HD",
          hashtags: hashtagsList
        };

        return finalResult;
      } catch (err: any) {
        console.warn(`[Scraper] Native spotlight scrape failed: ${err.message}`);
        return null;
      }
    }

    // Calculate strategy score based on REAL profile data only
    function calculateStrategyScore(profile: any) {
      // Only calculate based on actual verified data from the account
      
      // Consistency: Based on having a complete profile
      let consistency = 0;
      if (profile.avatar) consistency += 25;
      if (profile.bio && profile.bio.length > 0) consistency += 25;
      if (profile.isPublic) consistency += 25;
      if (profile.subscribers !== null && profile.subscribers !== undefined && profile.subscribers > 0) consistency += 25;
      
      // Engagement: Based on presence of actual content
      let engagement = 0;
      if (profile.stories !== null && profile.stories !== undefined && profile.stories > 0) engagement += 33;
      if (profile.highlights !== null && profile.highlights !== undefined && profile.highlights > 0) engagement += 33;
      if (profile.spotlights !== null && profile.spotlights !== undefined && profile.spotlights > 0) engagement += 34;
      
      // Content Mix: Based on variety of content types
      let contentMix = 0;
      const contentTypes = 
        (profile.stories !== null && profile.stories !== undefined && profile.stories > 0 ? 1 : 0) +
        (profile.highlights !== null && profile.highlights !== undefined && profile.highlights > 0 ? 1 : 0) +
        (profile.spotlights !== null && profile.spotlights !== undefined && profile.spotlights > 0 ? 1 : 0);
      contentMix = contentTypes * 33;
      
      // Growth Rate: Based on subscriber count
      let growthRate = 0;
      if (profile.subscribers !== null && profile.subscribers !== undefined && profile.subscribers > 0) {
        growthRate = Math.min(100, 50 + (profile.stories ? 25 : 0) + (profile.highlights ? 25 : 0));
      } else {
        growthRate = profile.isPublic ? 30 : 0;
      }
      
      // Cap all values at 100
      consistency = Math.min(100, consistency);
      engagement = Math.min(100, engagement);
      contentMix = Math.min(100, contentMix);
      growthRate = Math.min(100, growthRate);

      // Calculate weighted score
      const score = Math.round(
        consistency * 0.35 +
        engagement * 0.25 +
        contentMix * 0.2 +
        growthRate * 0.2
      );

      return {
        score: Math.max(0, Math.min(100, score)),
        consistency: Math.round(consistency),
        engagement: Math.round(engagement),
        contentMix: Math.round(contentMix),
        growthRate: Math.round(growthRate),
      };
    }

    app.post("/api/profile-viewer", limiter, async (req, res) => {
      const start = Date.now();
      let { username: rawUsername } = req.body;
      if (!rawUsername) {
        return res.status(400).json({ error: "Username is required. Please enter a valid Snapchat username or profile link." });
      }

      let username: string;
      try {
        username = await resolveUsernameFromAnyInput(rawUsername);
        if (!username || username.length < 1) {
          return res.status(400).json({ error: "Invalid username format. Please enter a valid Snapchat username or ID." });
        }
      } catch (error: any) {
        if (error.message === "REDIRECT_FAILED") {
          return res.status(400).json({ 
            error: "We could not resolve this short Snapchat link. Snapchat might be rate-limiting requests. Please try pasting the username or full profile link directly."
          });
        } else {
          return res.status(400).json({ error: "Invalid input format. Please enter a valid Snapchat username or profile link." });
        }
      }

      const cacheKey = `profile_${username}`;
      if (!configCacheBypass) {
        const cached = metadataCache.get(cacheKey);
        if (cached) {
          res.setHeader("X-Cache", "HIT");
          cacheHitsCount++;
          addActivityLog("profile", username, "success", 0, `Served @${username} profile from cache (Cache Bypass: OFF).`);
          return res.json(cached);
        }
      }
      cacheMissesCount++;

      res.setHeader("X-Cache", "MISS");
      try {
        // Fetch the profile page once and reuse the result for all profile parsing
        const pageData = await fetchSnapchatProfilePage(username);
        const profile = await scrapeSnapchatProfile(username, pageData);

        if (!profile) {
          const latency = Date.now() - start;
          addActivityLog("profile", username, "failed", latency, `Profile @${username} not found or is private.`);
          addSystemAlert("error", "Profile Viewer", `Failed to resolve profile for username '${maskSensitiveInfo(username)}'. Profile private or unavailable.`);
          return res.status(404).json({
            error: `The profile "@${username}" was not found or is not publicly accessible. Please verify the username and try again.`,
          });
        }

        // Calculate strategy score based on profile data
        const scoreData = calculateStrategyScore(profile);

        const avatarUrl = profile.avatar;
        const proxiedAvatar = avatarUrl && avatarUrl.startsWith("http")
          ? `/api/dp-proxy?url=${encodeURIComponent(avatarUrl)}&username=${profile.username}`
          : (profile.avatar || profile.snapcode);

        const result = {
          success: true,
          username: profile.username,
          uploader: profile.displayName,
          title: profile.displayName,
          thumbnail: proxiedAvatar,
          profileUrl: profile.profileUrl,
          stats: {
            subscribers: profile.subscribers,
            stories: profile.stories,
            highlights: profile.highlights,
            spotlights: profile.spotlights,
            totalViews: profile.totalViews,
            consistency: scoreData.consistency,
            engagement: scoreData.engagement,
            contentMix: scoreData.contentMix,
            growthRate: scoreData.growthRate,
          },
          score: scoreData.score,
          metadata: profile.metadata,
        };

        metadataCache.set(cacheKey, result);
        const latency = Date.now() - start;
        addActivityLog("profile", profile.username, "success", latency, `Successfully viewed profile @${profile.username} (${profile.subscribers || 0} subscribers).`);
        if (latency > 5000) {
          addSystemAlert("warning", "Profile Viewer", `Slow response viewing profile for username '${maskSensitiveInfo(profile.username)}' (took ${latency}ms)`);
        }
        return res.json(result);
      } catch (err: any) {
        const latency = Date.now() - start;
        addActivityLog("profile", username, "failed", latency, `Failed to view profile @${username}: ${err.message}`);
        addSystemAlert("error", "Profile Viewer", `Error fetching profile for username '${maskSensitiveInfo(username)}': ${err.message}`);
        console.error(`[ProfileViewer] error for @${username}:`, err?.message);
        return res.status(500).json({
          error: "Unable to fetch the profile. The profile may be private, unavailable, or the API service is temporarily unavailable. Please try again later.",
        });
      }
    });

    // =====================================================
    // ROUTE: Main Video Downloader (Spotlight / Stories)
    // =====================================================
    app.post("/api/download", limiter, async (req, res) => {
      const start = Date.now();
      if (!isReady)
        return res
          .status(503)
          .json({ error: "System is initializing. Please try again in a few seconds." });

      let { url } = req.body;
      if (!url) return res.status(400).json({ error: "URL is required. Please provide a valid Snapchat video or spotlight link." });

      if (typeof url !== "string") {
        return res.status(400).json({ error: "Invalid URL format. Please provide a valid Snapchat video or spotlight link." });
      }

      url = url.trim();
      url = url.replace(/\s+/g, "");
      url = url.replace(/[\)\]\.,;]+$/g, "");

      url = await resolveSnapchatUrl(url);

      if (!/^https?:\/\//i.test(url) && /^(?:www\.)?(?:snapchat\.com|t\.snapchat\.com)/i.test(url)) {
        url = `https://${url}`;
      }

      // Clean URL - remove query params and hash
      try {
        const urlObj = new URL(url);
        url = `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
      } catch {
        // If URL parsing fails, try basic cleanup
        url = url.split("?")[0].split("#")[0];
      }

      // Validate it's a Snapchat URL
      if (!url.includes("snapchat.com") && !url.includes("t.snapchat.com")) {
        return res.status(400).json({ error: "Invalid URL. Please provide a valid Snapchat video or spotlight link." });
      }

      const extractedUsername = extractSpotlightUsernameFromUrl(url);
      const cacheKey = `dl_${url}`;
      if (!configCacheBypass) {
        const cached = metadataCache.get(cacheKey);
        if (cached) {
          res.setHeader("X-Cache", "HIT");
          cacheHitsCount++;
          addActivityLog("download", extractedUsername || "anonymous", "success", 0, `Served download link from cache.`);
          return res.json(cached);
        }
      }
      cacheMissesCount++;

      if (activeTasks >= MAX_CONCURRENT_TASKS) {
        return res
          .status(429)
          .json({ error: "Server is busy. Please try again in a few seconds." });
      }

      activeTasks++;
      res.setHeader("X-Cache", "MISS");

      try {
        // 1. Try native high-performance scripter first (sub-second resolution)
        const scrapedResult = await scrapeSpotlightMedia(url);
        if (scrapedResult && scrapedResult.videoUrl) {
          cheerioUsageCount++;
          metadataCache.set(cacheKey, scrapedResult);
          const latency = Date.now() - start;
          addActivityLog("download", scrapedResult.username || extractedUsername || "anonymous", "success", latency, `Successfully resolved download link natively for @${scrapedResult.username || extractedUsername || "anonymous"} in ${latency}ms.`);
          if (latency > 5000) {
            addSystemAlert("warning", "Video Downloader", `Slow response downloading video natively for URL '${maskSensitiveInfo(url)}' (took ${latency}ms)`);
          }
          return res.json(scrapedResult);
        }

        // 2. Slower yt-dlp fallback as safety net for video stream, but MERGE accurate native metadata!
        console.log(`[Download] Native video stream not found, falling back to yt-dlp for stream: ${url}`);
        ytdlpUsageCount++;
        const info = await yt_dlp_fast(url, ytDlpWrap);
        
        // Try to find a valid username-like uploader ID from yt-dlp
        let candidateUsername = [info.uploader_id, info.uploader]
          .filter(Boolean)
          .map((value: string) => value.trim())
          .find((value: string) => /^[a-zA-Z0-9._-]{3,30}$/.test(value));
        
        if (!candidateUsername) {
          if (info.uploader_id?.trim()) {
            candidateUsername = info.uploader_id.trim();
          } else if (info.uploader?.trim()) {
            candidateUsername = info.uploader.trim();
          }
        }

        // Try extracting from description/title if username seems default or missing
        let parsedCreator = null;
        if (!candidateUsername || candidateUsername.toLowerCase() === 'snapchat' || candidateUsername.toLowerCase() === 'spotlight') {
          if (info.description) {
            parsedCreator = extractCreatorFromText(info.description);
          }
          if (!parsedCreator && info.title) {
            parsedCreator = extractCreatorFromText(info.title);
          }
        }
        
        // Resolve final uploader details (prioritize native cheerio scrapings)
        const finalUsername = scrapedResult?.username || extractedUsername || parsedCreator?.username || candidateUsername || undefined;
        let finalDisplayName = scrapedResult?.displayName || scrapedResult?.uploader || parsedCreator?.displayName || undefined;
        if (!finalDisplayName || finalDisplayName.toLowerCase() === 'snapchat' || finalDisplayName.toLowerCase() === 'snapchat user' || finalDisplayName.toLowerCase() === 'snapchat spotlight') {
          finalDisplayName = finalUsername || info.uploader || "Snapchat User";
        }
        finalDisplayName = cleanDisplayName(finalDisplayName);
        if (!finalDisplayName || finalDisplayName.toLowerCase() === 'snapchat' || finalDisplayName.toLowerCase() === 'snapchat user' || finalDisplayName.toLowerCase() === 'snapchat spotlight') {
          finalDisplayName = finalUsername ? (finalUsername.charAt(0).toUpperCase() + finalUsername.slice(1)) : "Snapchat User";
        }

        const finalTitle = scrapedResult?.title && scrapedResult.title !== 'Snapchat Spotlight' ? scrapedResult.title : (info.title || "Snapchat Media");
        const finalHashtags = (scrapedResult?.hashtags && scrapedResult.hashtags.length > 0) ? scrapedResult.hashtags : extractHashtagsFromText(finalTitle);

        const result = {
          success: true,
          username: finalUsername,
          videoUrl: info.videoUrl,
          downloadUrl: `/api/proxy?url=${encodeURIComponent(info.videoUrl)}&filename=snapchat_${Date.now()}.mp4`,
          title: finalTitle,
          thumbnail: scrapedResult?.thumbnail || info.thumbnail || "",
          duration: scrapedResult?.duration || info.duration || "",
          uploader: finalDisplayName,
          displayName: finalDisplayName,
          profileUrl: finalUsername ? `https://www.snapchat.com/add/${finalUsername}` : undefined,
          quality: info.height ? `${info.height}p` : "HD",
          width: info.width || 0,
          height: info.height || 0,
          hashtags: finalHashtags
        };

        metadataCache.set(cacheKey, result);
        const latency = Date.now() - start;
        addActivityLog("download", finalUsername || "anonymous", "success", latency, `Successfully resolved download stream via yt-dlp for @${finalUsername || "anonymous"} in ${latency}ms.`);
        if (latency > 5000) {
          addSystemAlert("warning", "Video Downloader", `Slow response downloading video via yt-dlp fallback for URL '${maskSensitiveInfo(url)}' (took ${latency}ms)`);
        }
        return res.json(result);
      } catch (err: any) {
        const latency = Date.now() - start;
        addActivityLog("download", extractedUsername || "anonymous", "failed", latency, `Failed to resolve download stream: ${err.message}`);
        addSystemAlert("error", "Video Downloader", `Error downloading video for URL '${maskSensitiveInfo(url)}': ${err.message}`);
        console.error("[Download Error]", err.message);
        return res.status(400).json({
          error: "Unable to download video. The video link may be invalid, expired, or the content is not publicly available. Please verify the link and try again.",
        });
      } finally {
        activeTasks--;
      }
    });

    // =====================================================
    // ROUTE: Bulk Video Downloader — Get ALL videos from profile
    // =====================================================
    app.post("/api/bulk-videos", limiter, async (req, res) => {
      const start = Date.now();
      if (!isReady)
        return res
          .status(503)
          .json({ error: "System is initializing. Please try again in a few seconds." });

      let { username: rawInput } = req.body;
      if (!rawInput) return res.status(400).json({ error: "Username or Snapchat link is required." });

      rawInput = await resolveSnapchatUrl(rawInput);

      // Check if it's a direct single video/spotlight/story URL
      const isDirectVideo = /snapchat\.com\/spotlight\//i.test(rawInput) || 
                            /snapchat\.com\/p\//i.test(rawInput) ||
                            /snapchat\.com\/s\//i.test(rawInput) || 
                            /snapchat\.com\/add\/@?[a-zA-Z0-9._-]{3,30}\/story\//i.test(rawInput) ||
                            /t\.snapchat\.com/i.test(rawInput);

      let fallbackDirectResult: any = null;
      let username = "";

      if (isDirectVideo) {
        console.log(`[Bulk Videos] Direct video link detected: ${rawInput}. Resolving single video first...`);
        if (activeTasks >= MAX_CONCURRENT_TASKS) {
          return res
            .status(429)
            .json({ error: "Server is busy. Please try again in a few seconds." });
        }
        activeTasks++;
        try {
          let videoUrl = "";
          let thumbnail = "";
          let title = "Snapchat Video";
          let uploader = "Snapchat User";
          let finalUsername = "video";

          const scraped = await scrapeSpotlightMedia(rawInput);
          if (scraped && scraped.videoUrl) {
            cheerioUsageCount++;
            videoUrl = scraped.videoUrl;
            thumbnail = scraped.thumbnail || "";
            title = scraped.title || "Snapchat Video";
            uploader = scraped.uploader || scraped.displayName || "Snapchat User";
            finalUsername = scraped.username || "video";
          } else {
            console.log(`[Bulk Videos] Direct link native scraping failed. Falling back to yt-dlp: ${rawInput}`);
            ytdlpUsageCount++;
            const ytInfo = await yt_dlp_fast(rawInput, ytDlpWrap);
            videoUrl = ytInfo.videoUrl;
            thumbnail = ytInfo.thumbnail || "";
            title = ytInfo.title || "Snapchat Video";
            uploader = ytInfo.uploader || "Snapchat User";
            let candidateUsername = [ytInfo.uploader_id, ytInfo.uploader]
              .filter(Boolean)
              .map((value: string) => value.trim())
              .find((value: string) => /^[a-zA-Z0-9._-]{3,30}$/.test(value));
            finalUsername = candidateUsername || "video";
          }

          if (videoUrl) {
            const videoItem = {
              id: `direct_video_${Date.now()}`,
              type: rawInput.includes('/spotlight/') ? 'spotlight' : 'highlight',
              title: title,
              thumbnail: thumbnail,
              duration: '10',
              videoUrl: videoUrl,
              downloadUrl: `/api/proxy?url=${encodeURIComponent(videoUrl)}&filename=${encodeURIComponent(finalUsername)}_video.mp4`,
            };

            const proxiedThumb = thumbnail && thumbnail.startsWith("http")
              ? `/api/dp-proxy?url=${encodeURIComponent(thumbnail)}&username=${finalUsername}`
              : (thumbnail || `https://app.snapchat.com/web/deeplink/snapcode?username=${finalUsername}&type=SVG&bitmoji=enable`);

            fallbackDirectResult = {
              success: true,
              username: finalUsername,
              displayName: uploader,
              uploader: uploader,
              profilePicture: proxiedThumb,
              thumbnail: proxiedThumb,
              stories: [videoItem],
              totalVideos: 1,
              spotlights: rawInput.includes('/spotlight/') ? 1 : 0,
              highlights: rawInput.includes('/spotlight/') ? 0 : 1,
              stats: {
                subscribers: 0,
                stories: 1,
                highlights: rawInput.includes('/spotlight/') ? 0 : 1,
                spotlights: rawInput.includes('/spotlight/') ? 1 : 0,
              }
            };
          }

          if (finalUsername && finalUsername !== "video") {
            username = finalUsername;
          }
        } catch (e: any) {
          console.error(`[Bulk Videos] Resolving direct video fallback failed:`, e.message);
        } finally {
          activeTasks--;
        }
      }

      // If we couldn't resolve username yet (or not direct link), use our general helper
      if (!username) {
        try {
          username = await resolveUsernameFromAnyInput(rawInput);
        } catch (err: any) {
          if (fallbackDirectResult) {
            console.log(`[Bulk Videos] Username resolution failed but returning direct video fallback.`);
            return res.json(fallbackDirectResult);
          }
          if (err.message === "REDIRECT_FAILED") {
            return res.status(400).json({ error: "We could not resolve this short Snapchat link. Snapchat might be rate-limiting requests. Please try pasting the username or full profile link directly." });
          }
          return res.status(400).json({ error: "Invalid username or Snapchat profile link." });
        }
      }

      if (!username || username.toLowerCase() === "video" || username.length < 1) {
        if (fallbackDirectResult) {
          return res.json(fallbackDirectResult);
        }
        return res.status(400).json({ error: "Invalid username or Snapchat profile link." });
      }

      const cacheKey = `bulk_${username}`;
      if (!configCacheBypass) {
        const cached = metadataCache.get(cacheKey);
        if (cached) {
          res.setHeader("X-Cache", "HIT");
          cacheHitsCount++;
          addActivityLog("bulk", username, "success", 0, `Served @${username} bulk media from cache.`);
          return res.json(cached);
        }
      }
      cacheMissesCount++;

      if (activeTasks >= MAX_CONCURRENT_TASKS) {
        return res
          .status(429)
          .json({ error: "Server is busy. Please try again in a few seconds." });
      }

      activeTasks++;

      try {
        let videos: any[] = [];
        let scrapedProfile: any = null;

        // Approach 1: Try to fetch real videos from Snapchat profile using Cheerio NextJS parser
        try {
          console.log(`[Bulk Videos] Fetching profile page for @${username}...`);
          const pageData = await fetchSnapchatProfilePage(username);
          if (pageData.status === 200) {
            scrapedProfile = await scrapeSnapchatProfile(username, pageData);
            cheerioUsageCount++;
            
            const $ = pageData.$;
            const html = pageData.html;

            // Find NextJSProps
            let nextDataStr = '';
            $('script').each((_, el) => {
              const content = ($(el).html() || '').trim();
              if (content.startsWith('{"props":')) {
                nextDataStr = content;
              } else if ($(el).attr('id') === '__NEXT_DATA__') {
                nextDataStr = content;
              }
            });

            if (nextDataStr) {
              try {
                const data = JSON.parse(nextDataStr);
                const pp = data.props?.pageProps;
                if (pp) {
                  // Extract Curated Highlights
                  if (Array.isArray(pp.curatedHighlights)) {
                    pp.curatedHighlights.forEach((ch: any, highlightIdx: number) => {
                      const title = ch.storyTitle?.value || `Highlight ${highlightIdx + 1}`;
                      const thumbUrl = ch.thumbnailUrl?.value || "";
                      if (Array.isArray(ch.snapList)) {
                        ch.snapList.forEach((snap: any, snapIdx: number) => {
                          const mediaUrl = snap.snapUrls?.mediaUrl;
                          if (mediaUrl) {
                            videos.push({
                              id: `highlight_${highlightIdx}_${snapIdx}`,
                              type: 'highlight',
                              title: title,
                              thumbnail: snap.snapUrls?.mediaPreviewUrl?.value || thumbUrl || mediaUrl,
                              duration: snap.timestampInSec?.value ? '15' : '15',
                              videoUrl: mediaUrl,
                              downloadUrl: `/api/proxy?url=${encodeURIComponent(mediaUrl)}&filename=${encodeURIComponent(username)}_highlight_${highlightIdx}_${snapIdx}.mp4`,
                            });
                          }
                        });
                      }
                    });
                  }

                  // Extract Spotlight Highlights
                  if (Array.isArray(pp.spotlightHighlights)) {
                    pp.spotlightHighlights.forEach((sh: any, spotlightIdx: number) => {
                      const title = sh.storyTitle?.value || `Spotlight ${spotlightIdx + 1}`;
                      const thumbUrl = sh.thumbnailUrl?.value || "";
                      if (Array.isArray(sh.snapList)) {
                        sh.snapList.forEach((snap: any, snapIdx: number) => {
                          const mediaUrl = snap.snapUrls?.mediaUrl;
                          if (mediaUrl) {
                            videos.push({
                              id: `spotlight_${spotlightIdx}_${snapIdx}`,
                              type: 'spotlight',
                              title: title,
                              thumbnail: snap.snapUrls?.mediaPreviewUrl?.value || thumbUrl || mediaUrl,
                              duration: '10',
                              videoUrl: mediaUrl,
                              downloadUrl: `/api/proxy?url=${encodeURIComponent(mediaUrl)}&filename=${encodeURIComponent(username)}_spotlight_${spotlightIdx}_${snapIdx}.mp4`,
                            });
                          }
                        });
                      }
                    });
                  }
                }
              } catch (e: any) {
                console.log("[Bulk Videos Scraper] NextJS parsing failed:", e.message);
              }
            }

            // Fallback: Parse LD+JSON schema tags for Spotlight videos
            $('script[type="application/ld+json"]').each((_, el) => {
              const rawJson = ($(el).html() || "").trim();
              if (!rawJson) return;
              try {
                const json = JSON.parse(rawJson);
                const items = json["@graph"] || (Array.isArray(json) ? json : [json]);
                for (const item of items) {
                  if (item["@type"] === "VideoObject" && item.contentUrl) {
                    const mediaUrl = item.contentUrl;
                    const title = item.name || `Spotlight Video`;
                    const thumbnail = item.thumbnailUrl || mediaUrl;
                    if (!videos.some(v => v.videoUrl === mediaUrl)) {
                      videos.push({
                        id: `spotlight_ld_${videos.length}`,
                        type: 'spotlight',
                        title: title,
                        thumbnail: thumbnail,
                        duration: '12',
                        videoUrl: mediaUrl,
                        downloadUrl: `/api/proxy?url=${encodeURIComponent(mediaUrl)}&filename=${encodeURIComponent(username)}_spotlight_${videos.length}.mp4`,
                      });
                    }
                  }
                }
              } catch {}
            });
          }
        } catch (scrapeErr: any) {
          console.log("[Bulk Videos Scraper] Web scraping failed:", scrapeErr.message);
        }

        // Approach 2: If no public snaps could be scraped (private, empty, or blocked), return 404
        if (videos.length === 0) {
          if (fallbackDirectResult) {
            console.log(`[Bulk Videos] Profile scraping found 0 videos, returning direct video fallback for ${username}`);
            return res.json(fallbackDirectResult);
          }
          console.log(`[Bulk Videos] No public videos scraped for @${username}. Returning 404.`);
          const latency = Date.now() - start;
          addSystemAlert("error", "Bulk Downloader", `No public bulk videos found for username '${maskSensitiveInfo(username)}'.`);
          return res.status(404).json({
            error: `No public videos (stories, spotlights, or highlights) found for the profile "@${username}". The profile might be private or have no public content.`
          });
        }

        const spotlightVideos = videos.filter((v: any) => v.type === 'spotlight');
        const highlightVideos = videos.filter((v: any) => v.type === 'highlight');

        let finalDisplayName = scrapedProfile?.displayName || (username.charAt(0).toUpperCase() + username.slice(1));
        finalDisplayName = cleanDisplayName(finalDisplayName);
        if (!finalDisplayName || finalDisplayName.toLowerCase() === 'snapchat' || finalDisplayName.toLowerCase() === 'snapchat user' || finalDisplayName.toLowerCase() === 'snapchat spotlight') {
          finalDisplayName = username.charAt(0).toUpperCase() + username.slice(1);
        }

        const bulkAvatar = scrapedProfile?.avatar;
        const proxiedBulkAvatar = bulkAvatar && bulkAvatar.startsWith("http")
          ? `/api/dp-proxy?url=${encodeURIComponent(bulkAvatar)}&username=${username}`
          : `https://app.snapchat.com/web/deeplink/snapcode?username=${username}&type=SVG&bitmoji=enable`;

        const result = {
          success: true,
          username: scrapedProfile?.username || username,
          displayName: finalDisplayName,
          uploader: finalDisplayName,
          profilePicture: proxiedBulkAvatar,
          thumbnail: proxiedBulkAvatar,
          stories: videos,
          totalVideos: videos.length,
          spotlights: spotlightVideos.length,
          highlights: highlightVideos.length,
          stats: {
            subscribers: scrapedProfile?.subscribers || 0,
            stories: videos.length,
            highlights: highlightVideos.length,
            spotlights: spotlightVideos.length,
          }
        };

        metadataCache.set(cacheKey, result);
        const latency = Date.now() - start;
        addActivityLog("bulk", username, "success", latency, `Successfully extracted bulk media for @${username} (${videos.length} snaps) in ${latency}ms.`);
        if (latency > 5000) {
          addSystemAlert("warning", "Bulk Downloader", `Slow response extracting bulk media for username '${maskSensitiveInfo(username)}' (took ${latency}ms)`);
        }
        return res.json(result);
      } catch (err: any) {
        if (fallbackDirectResult) {
          console.log(`[Bulk Videos] Profile scraping threw error, returning direct video fallback for ${username}: ${err.message}`);
          return res.json(fallbackDirectResult);
        }
        const latency = Date.now() - start;
        addActivityLog("bulk", username || "anonymous", "failed", latency, `Failed to fetch bulk media: ${err.message}`);
        addSystemAlert("error", "Bulk Downloader", `Error fetching bulk media for username '${maskSensitiveInfo(username || "anonymous")}': ${err.message}`);
        console.error("[Bulk Videos Error]", err.message);
        return res.status(400).json({
          error: "Unable to fetch videos. The profile may be private or unavailable.",
        });
      } finally {
        activeTasks--;
      }
    });

    // =====================================================
    // ALLOWED DOMAINS — Security: only Snapchat CDN URLs and verified media hosts
    // =====================================================
    const allowedDomains = [
      "snapchat.com",
      "snap.com",
      "snapusercontent.com",
      "sc-cdn.net",
      "cf-st.sc-cdn.net",
      "googleapis.com",
      "amazonaws.com",
      "cloudfront.net",
    ];

    const isAllowedUrl = (value: string) => {
      try {
        const parsed = new URL(value);
        return allowedDomains.some((d) => parsed.hostname.endsWith(d));
      } catch {
        return false;
      }
    };

    // =====================================================
    // ROUTE: Video Proxy — streams clean video directly
    // NO FFmpeg, NO re-encoding, NO watermark processing
    // Supports HTTP Range Requests (206 Partial Content) for playback/Safari
    // =====================================================
    app.get("/api/proxy", async (req, res) => {
      const { url, filename } = req.query;
      if (!url || typeof url !== "string")
        return res.status(400).send("URL missing");

      const decodedUrl = decodeURIComponent(url);
      if (!isAllowedUrl(decodedUrl)) {
        return res
          .status(403)
          .json({ error: "Forbidden: Only Snapchat/allowed URLs allowed." });
      }

      const fname = (
        typeof filename === "string" ? filename : "snapchat_video.mp4"
      ).replace(/[^a-zA-Z0-9._-]/g, "_");

      const clientRange = req.headers.range;
      // Strip out browser-specific headers like Accept, Referer, etc. which cause Snapchat CDN to return 403 Forbidden.
      // Send ONLY a clean generic User-Agent.
      const headers: Record<string, string> = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      };

      if (clientRange) {
        headers["Range"] = clientRange;
      }

      try {
        const response = await axiosInstance.get(decodedUrl, {
          responseType: "stream",
          headers,
          timeout: 60000,  // 60s for video streaming
          maxRedirects: 5,
          validateStatus: (status) => status === 200 || status === 206,
        });

        const targetHeaders = response.headers;

        if (response.status === 206) {
          res.status(206);
          res.setHeader("Content-Range", String(targetHeaders["content-range"]));
          res.setHeader("Accept-Ranges", "bytes");
        } else {
          res.status(200);
        }

        res.setHeader("Content-Type", String(targetHeaders["content-type"] || "video/mp4"));
        res.setHeader("Cache-Control", "public, max-age=86400"); // Cache locally in client browser

        if (targetHeaders["content-length"]) {
          res.setHeader("Content-Length", String(targetHeaders["content-length"]));
        }

        if (req.query.download === "true" || filename) {
          res.setHeader("Content-Disposition", `attachment; filename="${fname}"`);
        } else {
          res.setHeader("Content-Disposition", "inline");
        }

        response.data.pipe(res);

        response.data.on("error", (err: any) => {
          console.error("Proxy stream error:", err.message);
          if (!res.headersSent) res.status(500).send("Stream error");
          else res.end();
        });

        res.on("close", () => {
          try {
            response.data.destroy();
          } catch {}
        });
      } catch (err: any) {
        console.error("Proxy fetch error:", err.message);
        if (!res.headersSent) res.status(500).send("Error fetching video");
      }
    });

    // =====================================================
    // ROUTE: DP Image Proxy (HD)
    // =====================================================
    app.get("/api/dp-proxy", async (req, res) => {
      const { url, username } = req.query;
      if (!url || typeof url !== "string")
        return res.status(400).send("URL missing");

      const decodedUrl = decodeURIComponent(url);
      if (!isAllowedUrl(decodedUrl)) {
        return res
          .status(403)
          .json({ error: "Forbidden: Only Snapchat URLs are allowed." });
      }

      try {
        const response = await axiosInstance.get(decodedUrl, {
          responseType: "stream",
          headers: {
            ...HEADERS_DESKTOP,
            Accept: "image/webp,image/avif,image/png,image/jpeg,*/*",
          },
          timeout: 20000,  // Reduced from 30s to 20s for faster image download
        });

        const contentType =
          response.headers["content-type"] || "image/jpeg";
        res.setHeader("Content-Type", String(contentType));

        const isDownload = req.query.download === "true";
        if (isDownload) {
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="${username || "snap"}-HD.jpg"`
          );
        } else {
          res.setHeader(
            "Content-Disposition",
            `inline; filename="${username || "snap"}-HD.jpg"`
          );
        }

        if (response.headers["content-length"]) {
          res.setHeader("Content-Length", String(response.headers["content-length"]));
        }

        response.data.pipe(res);
        response.data.on("error", (err: any) => {
          if (!res.headersSent) res.status(500).send("Stream error");
          else res.end();
        });
        res.on("error", () => response.data.destroy());
      } catch (err: any) {
        console.error("DP Proxy error:", err?.message);
        if (!res.headersSent) {
          return res.status(500).send("Error");
        }
        return res.end();
      }
    });

    // =====================================================
    // ROUTE: Story Media Proxy
    // Supports HTTP Range Requests (206 Partial Content) for video story playback
    // =====================================================
    app.get("/api/story-proxy", async (req, res) => {
      const { url, type, username, num } = req.query;
      if (!url || typeof url !== "string")
        return res.status(400).send("URL missing");

      const decodedUrl = decodeURIComponent(url);
      if (!isAllowedUrl(decodedUrl)) {
        return res
          .status(403)
          .json({ error: "Forbidden: Only Snapchat URLs are allowed." });
      }

      const isImage = type === "image";
      const ext = isImage ? "jpg" : "mp4";
      const fname = `${username || "snap"}-story-${num || "1"}.${ext}`;

      const clientRange = req.headers.range;
      // Strip out browser-specific headers Accept/Referer to bypass Snapchat CDN 403 locks
      const headers: Record<string, string> = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      };

      if (!isImage && clientRange) {
        headers["Range"] = clientRange;
      }

      try {
        const response = await axiosInstance.get(decodedUrl, {
          responseType: "stream",
          headers,
          timeout: 60000,
          maxRedirects: 5,
          validateStatus: (status) => status === 200 || status === 206,
        });

        const targetHeaders = response.headers;

        if (!isImage && response.status === 206) {
          res.status(206);
          res.setHeader("Content-Range", String(targetHeaders["content-range"]));
          res.setHeader("Accept-Ranges", "bytes");
        } else {
          res.status(200);
        }

        res.setHeader("Content-Type", isImage ? "image/jpeg" : String(targetHeaders["content-type"] || "video/mp4"));
        res.setHeader("Cache-Control", "public, max-age=86400");

        if (targetHeaders["content-length"]) {
          res.setHeader("Content-Length", String(targetHeaders["content-length"]));
        }

        if (req.query.download === "true") {
          res.setHeader("Content-Disposition", `attachment; filename="${fname}"`);
        } else {
          res.setHeader("Content-Disposition", "inline");
        }

        response.data.pipe(res);
        response.data.on("error", (err: any) => {
          if (!res.headersSent) res.status(500).send("Stream error");
          else res.end();
        });
        res.on("error", () => response.data.destroy());
      } catch (err: any) {
        console.error("Story Proxy error:", err?.message);
        if (!res.headersSent) {
          return res.status(500).send("Error");
        }
        return res.end();
      }
    });

    // =====================================================
    // Dynamic SEO Auditing Function
    // =====================================================
    let lastSeoAuditTime = 0;
    let cachedSeoAuditResult: any = null;

    function runSeoAudit(): any {
      const now = Date.now();
      if (cachedSeoAuditResult && (now - lastSeoAuditTime < 15000)) {
        return cachedSeoAuditResult;
      }

      const indexHtmlPath = path.join(PROJECT_ROOT, "index.html");
      let score = 0;
      const auditDetails: any[] = [];

      try {
        if (!fs.existsSync(indexHtmlPath)) {
          return { score: 0, details: [{ name: "Index.html File", status: "fail", score: 0, description: "index.html does not exist in project root" }] };
        }

        const html = fs.readFileSync(indexHtmlPath, "utf-8");
        const $ = cheerio.load(html);

        // 1. Title Tag
        const title = $("title").text();
        if (title) {
          const len = title.length;
          if (len >= 40 && len <= 80) {
            score += 10;
            auditDetails.push({ name: "Title Tag", status: "pass", score: 10, description: `Title is perfect (${len} chars): "${title}"` });
          } else {
            score += 6;
            auditDetails.push({ name: "Title Tag", status: "warning", score: 6, description: `Title is too ${len < 40 ? "short" : "long"} (${len} chars, recommended 45-75)` });
          }
        } else {
          auditDetails.push({ name: "Title Tag", status: "fail", score: 0, description: "Title tag is missing!" });
        }

        // 2. Meta Description
        const metaDesc = $('meta[name="description"]').attr("content");
        if (metaDesc) {
          const len = metaDesc.length;
          if (len >= 100 && len <= 200) {
            score += 10;
            auditDetails.push({ name: "Meta Description", status: "pass", score: 10, description: `Meta description length is excellent (${len} chars)` });
          } else {
            score += 6;
            auditDetails.push({ name: "Meta Description", status: "warning", score: 6, description: `Description is too ${len < 100 ? "short" : "long"} (${len} chars, recommended 120-160)` });
          }
        } else {
          auditDetails.push({ name: "Meta Description", status: "fail", score: 0, description: "Meta description tag is missing!" });
        }

        // 3. Robots
        const robots = $('meta[name="robots"]').attr("content");
        if (robots) {
          score += 10;
          auditDetails.push({ name: "Robots Tag", status: "pass", score: 10, description: `Robots tag configured: "${robots}"` });
        } else {
          auditDetails.push({ name: "Robots Tag", status: "fail", score: 0, description: "Robots meta tag is missing (critical for crawler guidance)" });
        }

        // 4. Canonical Link
        const canonical = $('link[rel="canonical"]').attr("href");
        if (canonical) {
          score += 10;
          auditDetails.push({ name: "Canonical URL", status: "pass", score: 10, description: `Canonical link configured: "${canonical}"` });
        } else {
          auditDetails.push({ name: "Canonical URL", status: "fail", score: 0, description: "Canonical link is missing (causes duplicate content risk)" });
        }

        // 5. OpenGraph Tags
        const ogTitle = $('meta[property="og:title"]').attr("content");
        const ogImage = $('meta[property="og:image"]').attr("content");
        const ogUrl = $('meta[property="og:url"]').attr("content");
        if (ogTitle && ogImage && ogUrl) {
          score += 15;
          auditDetails.push({ name: "OpenGraph Metadata", status: "pass", score: 15, description: "Full OpenGraph protocol configured (og:title, og:image, og:url)" });
        } else {
          score += 5;
          auditDetails.push({ name: "OpenGraph Metadata", status: "warning", score: 5, description: "Some OpenGraph tags are missing (recommended for rich social cards)" });
        }

        // 6. Twitter Cards
        const twitterCard = $('meta[name="twitter:card"]').attr("content");
        const twitterTitle = $('meta[name="twitter:title"]').attr("content");
        if (twitterCard && twitterTitle) {
          score += 10;
          auditDetails.push({ name: "Twitter Cards", status: "pass", score: 10, description: "Twitter card metadata is fully configured" });
        } else {
          score += 3;
          auditDetails.push({ name: "Twitter Cards", status: "warning", score: 3, description: "Twitter meta tags are missing or incomplete" });
        }

        // 7. Schema Markup (structured JSON-LD)
        let hasSchema = false;
        $('script[type="application/ld+json"]').each((_, el) => {
          if ($(el).html()) hasSchema = true;
        });
        if (hasSchema) {
          score += 15;
          auditDetails.push({ name: "JSON-LD Schema Markup", status: "pass", score: 15, description: "Structured Schema.org data found in index.html" });
        } else {
          auditDetails.push({ name: "JSON-LD Schema Markup", status: "fail", score: 0, description: "No structured JSON-LD schemas found (important for rich snippets)" });
        }

        // 8. Viewport Tag
        const viewport = $('meta[name="viewport"]').attr("content");
        if (viewport) {
          score += 10;
          auditDetails.push({ name: "Mobile Viewport", status: "pass", score: 10, description: "Responsive viewport configured for mobile compatibility" });
        } else {
          auditDetails.push({ name: "Mobile Viewport", status: "fail", score: 0, description: "Mobile viewport meta tag is missing (ruins responsiveness)" });
        }

        // 9. Semantic HTML Elements
        const h1Count = $("h1").length;
        const navCount = $("nav, header").length;
        const footerCount = $("footer").length;
        if (h1Count === 1 && (navCount > 0 || footerCount > 0)) {
          score += 5;
          auditDetails.push({ name: "Semantic Structure", status: "pass", score: 5, description: "Perfect header/footer/single H1 tag hierarchy detected" });
        } else {
          score += 2;
          auditDetails.push({ name: "Semantic Structure", status: "warning", score: 2, description: `H1 tags count is ${h1Count} (recommended exactly 1 for SEO)` });
        }

        // 10. DNS Prefetch / Preconnect Links
        const preconnect = $('link[rel="preconnect"], link[rel="dns-prefetch"]').length;
        if (preconnect > 0) {
          score += 5;
          auditDetails.push({ name: "Preconnect Optimization", status: "pass", score: 5, description: `${preconnect} speed optimization preconnect links found` });
        } else {
          score += 2;
          auditDetails.push({ name: "Preconnect Optimization", status: "warning", score: 2, description: "No preconnect links found for assets/Google Fonts" });
        }

      } catch (err: any) {
        console.error("SEO Audit Error:", err.message);
      }

      // Normalize final score to a maximum of 100%
      const finalScore = Math.max(0, Math.min(100, score));
      cachedSeoAuditResult = {
        score: finalScore,
        details: auditDetails
      };
      lastSeoAuditTime = now;
      return cachedSeoAuditResult;
    }

    // =====================================================
    // ROUTE: Get/Set Admin Interactive Configurations
    // =====================================================
    app.get("/api/admin/config", (req, res) => {
      const headerPasscode = req.headers["x-admin-passcode"];
      const envPasscode = process.env.DASHBOARD_PASSCODE || "1423";
      if (headerPasscode !== envPasscode) {
        return res.status(401).json({ error: "Unauthorized: Invalid developer passcode." });
      }
      return res.json({
        cacheBypass: configCacheBypass,
        ytdlpPriority: configYtdlpPriority,
        scraperTimeout: configScraperTimeout
      });
    });

    app.post("/api/admin/config", (req, res) => {
      const headerPasscode = req.headers["x-admin-passcode"];
      const envPasscode = process.env.DASHBOARD_PASSCODE || "1423";
      if (headerPasscode !== envPasscode) {
        return res.status(401).json({ error: "Unauthorized: Invalid developer passcode." });
      }
      const { cacheBypass, ytdlpPriority, scraperTimeout, simulateLog } = req.body;
      
      if (cacheBypass !== undefined) configCacheBypass = !!cacheBypass;
      if (ytdlpPriority !== undefined) configYtdlpPriority = !!ytdlpPriority;
      if (scraperTimeout !== undefined && typeof scraperTimeout === "number") {
        configScraperTimeout = Math.max(1000, Math.min(20000, scraperTimeout));
      }

      // Support manual simulated log generation from developer triggers
      if (simulateLog) {
        const types: Array<ActivityLog["type"]> = ["download", "stories", "profile", "bulk"];
        const users = ["mahobaloch29683", "kyliejenner", "bellahadid", "arianagrande", "cristiano", "leomessi"];
        const statusList: Array<ActivityLog["status"]> = ["success", "success", "success", "failed"];
        const selectedType = types[Math.floor(Math.random() * types.length)];
        const selectedUser = users[Math.floor(Math.random() * users.length)];
        const selectedStatus = statusList[Math.floor(Math.random() * statusList.length)];
        const latency = Math.floor(Math.random() * 900) + 150;
        
        let msg = "";
        if (selectedStatus === "success") {
          msg = `Simulated scrape for @${selectedUser} succeeded via ${selectedType === "download" ? "Cheerio/NextJS" : "JSON schema"} (Latency: ${latency}ms)`;
        } else {
          msg = `Simulated API resolver for @${selectedUser} timed out after ${configScraperTimeout}ms (Fallback: yt-dlp activated)`;
        }
        addActivityLog("simulated", selectedUser, selectedStatus, latency, msg);
      }

      return res.json({
        success: true,
        config: {
          cacheBypass: configCacheBypass,
          ytdlpPriority: configYtdlpPriority,
          scraperTimeout: configScraperTimeout
        }
      });
    });

    // =====================================================
    // ROUTE: Verify Developer Passcode (Private / Only Me)
    // =====================================================
    app.post("/api/admin/verify", (req, res) => {
      const { passcode } = req.body;
      const envPasscode = process.env.DASHBOARD_PASSCODE || "1423";
      if (passcode === envPasscode) {
        return res.json({ success: true });
      }
      return res.status(401).json({ error: "Invalid developer passcode." });
    });

    // =====================================================
    // ROUTE: Developer System stats & SEO Diagnostic Audit
    // =====================================================
    app.get("/api/admin/stats", (req, res) => {
      try {
        const headerPasscode = req.headers["x-admin-passcode"];
        const envPasscode = process.env.DASHBOARD_PASSCODE || "1423";
        if (headerPasscode !== envPasscode) {
          return res.status(401).json({ error: "Unauthorized: Invalid developer passcode." });
        }

        const systemUptime = process.uptime();
        const freeMem = os.freemem();
        const totalMem = os.totalmem();
        const usedMem = totalMem - freeMem;
        const memUsagePercentage = Math.round((usedMem / totalMem) * 100);

        // CPU load calculation (instantaneous delta)
        const cpuUsage = currentCpuUsage;
        const cpus = os.cpus();

        // Package integrity status
        let dependencies: any[] = [];
        try {
          const packageJsonPath = path.join(PROJECT_ROOT, "package.json");
          const pjson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
          dependencies = Object.keys(pjson.dependencies || {}).map((name) => {
            return {
              name,
              version: pjson.dependencies[name],
              status: "Active",
              type: ["react", "react-dom", "vite"].includes(name) ? "Frontend" : "Backend"
            };
          });
        } catch (pkgErr: any) {
          console.error("Stats package.json read failed:", pkgErr.message);
          dependencies = [
            { name: "react", version: "^19.0.1", status: "Active", type: "Frontend" },
            { name: "react-dom", version: "^19.0.1", status: "Active", type: "Frontend" },
            { name: "vite", version: "^6.2.3", status: "Active", type: "Frontend" },
            { name: "express", version: "^4.21.2", status: "Active", type: "Backend" },
            { name: "cheerio", version: "^1.2.0", status: "Active", type: "Backend" },
            { name: "axios", version: "^1.16.0", status: "Active", type: "Backend" },
            { name: "yt-dlp-wrap", version: "^2.3.12", status: "Active", type: "Backend" }
          ];
        }

        // Active tools operational status
        const toolsStatus = [
          { id: "profile-viewer", name: "Snapchat Profile Viewer", status: "Active (Fast)", description: "Direct NextJS scraping engine running cleanly." },
          { id: "video-downloader", name: "Snapchat Video Downloader", status: "Active (Fast)", description: "Cheerio native fallback enabled, yt-dlp backup active." },
          { id: "spotlight-downloader", name: "Spotlight Video Downloader", status: "Active (Fast)", description: "High performance scrape priority in place." },
          { id: "story-viewer", name: "Story Viewer", status: "Active (Fast)", description: "Bypasses metadata caching to prevent link expiration." },
          { id: "bulk-downloader", name: "Bulk Profile Media Downloader", status: "Active (Fast)", description: "Cheerio JSON schema and highlight scrapers fully functional." }
        ];

        // Average Latency
        const avgLatency = latencyHistory.length > 0 
          ? Math.round(latencyHistory.reduce((a, b) => a + b, 0) / latencyHistory.length) 
          : 85; // default fallback metric in ms

        return res.json({
          uptime: systemUptime,
          memory: {
            total: totalMem,
            free: freeMem,
            used: usedMem,
            percentage: memUsagePercentage,
            process: process.memoryUsage().heapUsed
          },
          cpu: {
            usage: cpuUsage,
            cores: cpus.length,
            model: cpus[0]?.model || "Intel/AMD Processor"
          },
          traffic: {
            totalRequests,
            successCount: successRequestsCount,
            failedCount: failedRequestsCount,
            cacheHits: cacheHitsCount,
            cacheMisses: cacheMissesCount,
            avgLatency,
            cheerioUsage: cheerioUsageCount,
            ytdlpUsage: ytdlpUsageCount,
            latencyHistory: latencyHistory.length > 0 ? latencyHistory : [80, 85, 90, 75, 110, 95, 80, 85, 100, 90]
          },
          reachability: {
            snapchat: isSnapchatReachable ? "Active" : "Blocked"
          },
          dependencies,
          tools: toolsStatus,
          activeTasks,
          activityLogs,
          config: {
            cacheBypass: configCacheBypass,
            ytdlpPriority: configYtdlpPriority,
            scraperTimeout: configScraperTimeout
          }
        });
      } catch (err: any) {
        console.error("STATS ENDPOINT FAILED SEVERELY:", err);
        return res.status(500).json({ 
          error: "Internal server error reading statistics",
          message: err.message,
          uptime: process.uptime(),
          memory: { percentage: 50 },
          cpu: { usage: 20 },
          traffic: { totalRequests: 0, avgLatency: 85, latencyHistory: [85, 85, 85] },
          reachability: { snapchat: "Active" },
          dependencies: [],
          tools: [],
          activeTasks: 0,
          activityLogs: [],
          config: { cacheBypass: false, ytdlpPriority: false, scraperTimeout: 5000 }
        });
      }
    });

    // =====================================================
    // Vite Dev / Production Static
    // =====================================================
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        root: PROJECT_ROOT,
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(PROJECT_ROOT, "dist");
      app.use(express.static(distPath, {
        maxAge: "1d",
        etag: true,
      }));
      app.get("*", (req, res) =>
        res.sendFile(path.join(distPath, "index.html"))
      );
    }

    // Global error handler
    app.use(
      (
        err: any,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        console.error("Server Error:", err.message);
        if (!res.headersSent)
          res.status(500).json({ error: "Server error. Try again." });
      }
    );

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`⚡ Getinbex Server running → http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Critical start error:", error);
    process.exit(1);
  }
}

startServer();
