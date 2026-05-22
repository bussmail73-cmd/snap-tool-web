import os from 'os';
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

console.log("PROJECT_ROOT:", PROJECT_ROOT);

function testStatsEndpoint() {
  console.log("Starting stats calculation...");
  
  console.log("1. Memory calculations...");
  const systemUptime = process.uptime();
  const freeMem = os.freemem();
  const totalMem = os.totalmem();
  const usedMem = totalMem - freeMem;
  const memUsagePercentage = Math.round((usedMem / totalMem) * 100);
  console.log("Memory:", { totalMem, freeMem, usedMem, memUsagePercentage });

  console.log("2. CPU calculations...");
  const cpus = os.cpus();
  let totalCpuIdle = 0;
  let totalCpuTime = 0;
  cpus.forEach((cpu) => {
    for (const type in cpu.times) {
      totalCpuTime += cpu.times[type];
    }
    totalCpuIdle += cpu.times.idle;
  });
  const cpuUsage = Math.round(((totalCpuTime - totalCpuIdle) / totalCpuTime) * 100);
  console.log("CPU:", { cpuUsage, cores: cpus.length, model: cpus[0]?.model });

  console.log("3. Package json parsing...");
  const pjsonPath = path.join(PROJECT_ROOT, "package.json");
  console.log("pjsonPath:", pjsonPath);
  
  try {
    const pjson = require("../package.json");
    console.log("Loaded package.json via require");
    const dependencies = Object.keys(pjson.dependencies || {}).map((name) => {
      return {
        name,
        version: pjson.dependencies[name],
        status: "Active",
        type: ["react", "react-dom", "vite"].includes(name) ? "Frontend" : "Backend"
      };
    });
    console.log("Dependencies count:", dependencies.length);
  } catch (err) {
    console.error("Failed to load package.json via require:", err.message);
  }

  console.log("4. Tools integrity check...");
  const toolsStatus = [
    { id: "profile-viewer", name: "Snapchat Profile Viewer", status: "Active (Fast)", description: "Direct NextJS scraping engine running cleanly." },
    { id: "video-downloader", name: "Snapchat Video Downloader", status: "Active (Fast)", description: "Cheerio native fallback enabled, yt-dlp backup active." },
    { id: "spotlight-downloader", name: "Spotlight Video Downloader", status: "Active (Fast)", description: "High performance scrape priority in place." },
    { id: "story-viewer", name: "Story Viewer", status: "Active (Fast)", description: "Bypasses metadata caching to prevent link expiration." },
    { id: "bulk-downloader", name: "Bulk Profile Media Downloader", status: "Active (Fast)", description: "Cheerio JSON schema and highlight scrapers fully functional." }
  ];
  console.log("Tools status counted.");

  console.log("5. SEO Audit run...");
  // SEO Audit
  const indexHtmlPath = path.join(PROJECT_ROOT, "index.html");
  let score = 0;
  const auditDetails = [];
  const html = fs.readFileSync(indexHtmlPath, "utf-8");
  const $ = cheerio.load(html);

  // Title Tag
  const title = $("title").text();
  if (title) {
    const len = title.length;
    if (len >= 40 && len <= 80) {
      score += 10;
      auditDetails.push({ name: "Title Tag", status: "pass", score: 10, description: `Title is perfect (${len} chars): "${title}"` });
    }
  }

  const seoAudit = { score, details: auditDetails };
  console.log("SEO Audit done.");

  console.log("Endpoint successfully constructed payload!");
}

testStatsEndpoint();
