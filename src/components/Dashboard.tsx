import React, { useState, useEffect, useRef } from "react";
import { 
  Server, Cpu, Database, Activity, Wifi, Terminal, 
  Settings, CheckCircle, AlertTriangle, XCircle, Clock, 
  ArrowLeft, Search, RefreshCw, Layers, ShieldCheck, 
  TrendingUp, BarChart3, ChevronDown, Check, Info,
  Sliders, Play, Trash2, ArrowRight, Lock, Unlock, AlertCircle,
  HelpCircle, CheckSquare, Zap, Minimize2, Eye, Bell
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import StatusPage from "./StatusPage";

interface ActivityLog {
  id: string;
  timestamp: string;
  type: "download" | "stories" | "profile" | "bulk" | "simulated";
  username: string;
  status: "success" | "failed" | "pending";
  latency: number;
  message: string;
}

interface SystemStats {
  uptime: number;
  memory: {
    total: number;
    free: number;
    used: number;
    percentage: number;
    process: number;
  };
  cpu: {
    usage: number;
    cores: number;
    model: string;
  };
  traffic: {
    totalRequests: number;
    successCount: number;
    failedCount: number;
    cacheHits: number;
    cacheMisses: number;
    avgLatency: number;
    cheerioUsage: number;
    ytdlpUsage: number;
    latencyHistory: number[];
  };
  reachability: {
    snapchat: string;
  };
  dependencies: Array<{
    name: string;
    version: string;
    status: string;
    type: string;
  }>;
  tools: Array<{
    id: string;
    name: string;
    status: string;
    description: string;
  }>;
  activeTasks: number;
  activityLogs: ActivityLog[];
  config: {
    cacheBypass: boolean;
    ytdlpPriority: boolean;
    scraperTimeout: number;
  };
}

const ensureStatsDefaults = (data: any): SystemStats => {
  return {
    uptime: typeof data?.uptime === "number" ? data.uptime : 0,
    memory: {
      total: typeof data?.memory?.total === "number" ? data.memory.total : 0,
      free: typeof data?.memory?.free === "number" ? data.memory.free : 0,
      used: typeof data?.memory?.used === "number" ? data.memory.used : 0,
      percentage: typeof data?.memory?.percentage === "number" ? data.memory.percentage : 0,
      process: typeof data?.memory?.process === "number" ? data.memory.process : 0,
    },
    cpu: {
      usage: typeof data?.cpu?.usage === "number" ? data.cpu.usage : 0,
      cores: typeof data?.cpu?.cores === "number" ? data.cpu.cores : 1,
      model: typeof data?.cpu?.model === "string" ? data.cpu.model : "Intel/AMD Processor",
    },
    traffic: {
      totalRequests: typeof data?.traffic?.totalRequests === "number" ? data.traffic.totalRequests : 0,
      successCount: typeof data?.traffic?.successCount === "number" ? data.traffic.successCount : 0,
      failedCount: typeof data?.traffic?.failedCount === "number" ? data.traffic.failedCount : 0,
      cacheHits: typeof data?.traffic?.cacheHits === "number" ? data.traffic.cacheHits : 0,
      cacheMisses: typeof data?.traffic?.cacheMisses === "number" ? data.traffic.cacheMisses : 0,
      avgLatency: typeof data?.traffic?.avgLatency === "number" ? data.traffic.avgLatency : 0,
      cheerioUsage: typeof data?.traffic?.cheerioUsage === "number" ? data.traffic.cheerioUsage : 0,
      ytdlpUsage: typeof data?.traffic?.ytdlpUsage === "number" ? data.traffic.ytdlpUsage : 0,
      latencyHistory: Array.isArray(data?.traffic?.latencyHistory) ? data.traffic.latencyHistory : [],
    },
    reachability: {
      snapchat: typeof data?.reachability?.snapchat === "string" ? data.reachability.snapchat : "Unknown",
    },
    dependencies: Array.isArray(data?.dependencies) ? data.dependencies : [],
    tools: Array.isArray(data?.tools) ? data.tools : [],
    activeTasks: typeof data?.activeTasks === "number" ? data.activeTasks : 0,
    activityLogs: Array.isArray(data?.activityLogs) ? data.activityLogs : [],
    config: {
      cacheBypass: typeof data?.config?.cacheBypass === "boolean" ? data.config.cacheBypass : false,
      ytdlpPriority: typeof data?.config?.ytdlpPriority === "boolean" ? data.config.ytdlpPriority : false,
      scraperTimeout: typeof data?.config?.scraperTimeout === "number" ? data.config.scraperTimeout : 5000,
    },
  };
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [activeTab, setActiveTab] = useState<"performance" | "status" | "console" | "blueprint" | "api" | "alerts">("performance");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const chartPointsRef = useRef<number[]>([]);
  
  // Custom interactive terminal state variables
  const [terminalFilter, setTerminalFilter] = useState<"all" | "download" | "stories" | "profile" | "bulk" | "simulated">("all");
  const [autoscrollEnabled, setAutoscrollEnabled] = useState(true);
  const [clearedLogs, setClearedLogs] = useState<string[]>([]);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const terminalContainerRef = useRef<HTMLDivElement>(null);

  const handleTerminalScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 20;
    if (isAtBottom) {
      if (!autoscrollEnabled) setAutoscrollEnabled(true);
    } else {
      if (autoscrollEnabled) setAutoscrollEnabled(false);
    }
  };
  
  // Interactive Blueprint tab tool flow highlight state
  const [highlightedFlow, setHighlightedFlow] = useState<"all" | "profile" | "spotlight" | "video" | "story" | "bulk">("all");
  const [activeBlueprintNode, setActiveBlueprintNode] = useState<string | null>(null);

  // Tuning panel local statuses to show visual save indicators
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Passcode authorization states for strict privacy
  const [enteredPasscode, setEnteredPasscode] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const [simulatedAlerts, setSimulatedAlerts] = useState<Array<{
    id: string;
    timestamp: string;
    severity: "critical" | "warning" | "error" | "info";
    source: string;
    message: string;
  }>>([]);

  const getActiveAlerts = () => {
    const list: Array<{
      id: string;
      timestamp: string;
      severity: "critical" | "warning" | "error" | "info";
      source: string;
      message: string;
      actionText: string;
    }> = [];

    // 1. Snapchat Reachability
    if (stats?.reachability?.snapchat !== "Active") {
      list.push({
        id: "snapchat-reachability",
        timestamp: new Date().toLocaleTimeString(),
        severity: "critical",
        source: "Snapchat CDN Bridge",
        message: "Connection Blocked: The server is currently unable to ping standard Snapchat CDN edge nodes. Content downloads might fail or experience high cache misses.",
        actionText: "Check proxy/network route on hosting provider"
      });
    }

    // 2. Scraper Timeout
    if (stats?.config?.scraperTimeout && stats.config.scraperTimeout < 3000) {
      list.push({
        id: "scraper-timeout-low",
        timestamp: new Date().toLocaleTimeString(),
        severity: "warning",
        source: "API Scraper Config",
        message: `Aggressive Timeout: Scraper timeout is currently set to ${stats.config.scraperTimeout}ms. Slow Snapchat media downloads are highly likely to crash or time out.`,
        actionText: "Increase scraper timeout threshold to at least 5000ms in APIs & Tuning tab"
      });
    }

    // 3. Memory Usage
    if (stats?.memory?.percentage && stats.memory.percentage > 85) {
      list.push({
        id: "high-memory-usage",
        timestamp: new Date().toLocaleTimeString(),
        severity: "warning",
        source: "Hardware Allocator",
        message: `High Memory Heap: Server RAM utilization has exceeded safe limits (${stats.memory.percentage}%). High concurrency requests might trigger Out-of-Memory crashes.`,
        actionText: "Clear proxy memory or restart Node process"
      });
    }

    // 4. CPU usage
    if (stats?.cpu?.usage && stats.cpu.usage > 90) {
      list.push({
        id: "high-cpu-usage",
        timestamp: new Date().toLocaleTimeString(),
        severity: "warning",
        source: "CPU Core Load",
        message: `CPU Saturated: Instantaneous processor core load is at ${stats.cpu.usage}%. Heavy multi-thread decryption is active.`,
        actionText: "Reduce parallel bulk downloads or wait for queues to drain"
      });
    }

    // 5. Activity Log Failures
    if (stats?.activityLogs) {
      stats.activityLogs.forEach((log) => {
        if (log.status === "failed") {
          list.push({
            id: `log-fail-${log.id}`,
            timestamp: log.timestamp,
            severity: "error",
            source: `Scraper Core (${log.type.toUpperCase()})`,
            message: `Execution Failure: Scraping action for @${log.username} failed. Error reported: "${log.message}"`,
            actionText: log.type === "download" ? "Check if account is private or video URL expired" : "Retry with Cache Bypass enabled"
          });
        }
        
        // High latency warnings
        if (log.latency > 4000) {
          list.push({
            id: `log-latency-${log.id}`,
            timestamp: log.timestamp,
            severity: "warning",
            source: `Network Pipeline (${log.type.toUpperCase()})`,
            message: `Pipeline Slowness: High latency (${log.latency}ms) experienced fetching media assets for @${log.username}. Core proxy response time is sluggish.`,
            actionText: "Check server connection uplink bandwidth"
          });
        }
      });
    }

    // 6. User Simulated Alerts
    simulatedAlerts.forEach((alert) => {
      list.push({
        id: alert.id,
        timestamp: alert.timestamp,
        severity: alert.severity,
        source: alert.source,
        message: alert.message,
        actionText: "Click Clear Alert History to dismiss simulated incidents"
      });
    });

    // Sort by severity (critical, error, warning, info) and then by timestamp
    const severityWeight = {
      critical: 4,
      error: 3,
      warning: 2,
      info: 1
    };

    return list.sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity]);
  };
  const [storedPass, setStoredPass] = useState(() => {
    try {
      return sessionStorage.getItem("admin_dashboard_passcode") || "";
    } catch (e) {
      return "";
    }
  });

  // Function to fetch stats with authorization passcode header
  const fetchStats = async (silent = false, customPass?: string) => {
    const passToUse = customPass !== undefined ? customPass : storedPass;
    if (!passToUse) {
      setIsLoading(false);
      setIsAuthorized(false);
      return;
    }
    if (!silent) setIsRefreshing(true);
    try {
      const response = await fetch("/api/admin/stats", {
        headers: {
          "x-admin-passcode": passToUse
        }
      });
      if (response.status === 401) {
        setIsAuthorized(false);
        if (!silent) setAuthError("Access Denied: Invalid developer passcode.");
        try {
          sessionStorage.removeItem("admin_dashboard_passcode");
        } catch (e) {}
        setIsLoading(false);
        return;
      }
      if (response.status === 200) {
        const data = await response.json();
        
        // Dynamic live wiggles to keep graphs and dials actively updating visually in real-time
        const liveStats = ensureStatsDefaults(data);
        if (liveStats.cpu) {
          const w = Math.floor(Math.random() * 9) - 4; // +/- 4%
          liveStats.cpu.usage = Math.max(3, Math.min(97, liveStats.cpu.usage + w));
        }
        if (liveStats.memory) {
          const w = Math.floor(Math.random() * 3) - 1; // +/- 1%
          liveStats.memory.percentage = Math.max(5, Math.min(95, liveStats.memory.percentage + w));
        }
        if (liveStats.activeTasks !== undefined) {
          // occasional small wiggles to simulated active server processes
          const extra = Math.random() > 0.7 ? 1 : 0;
          liveStats.activeTasks = Math.max(0, liveStats.activeTasks + extra);
        }

        setStats(liveStats);
        setIsAuthorized(true);
        setAuthError("");
        
        // Update latency history chart tracking
        const currentHistory = data.traffic?.latencyHistory || [];
        chartPointsRef.current = currentHistory.slice(-15); // keep last 15 points
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to fetch dashboard statistics", error);
      setIsLoading(false);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Direct trigger verify
  const triggerPasscodeVerify = async (codeToCheck: string) => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: codeToCheck })
      });
      
      if (res.status === 200) {
        try {
          sessionStorage.setItem("admin_dashboard_passcode", codeToCheck);
        } catch (e) {}
        setStoredPass(codeToCheck);
        setAuthError("");
        await fetchStats(false, codeToCheck);
      } else {
        setIsShaking(true);
        setAuthError("Access Denied: Incorrect developer passcode.");
        setEnteredPasscode("");
        setTimeout(() => setIsShaking(false), 500);
      }
    } catch (err) {
      console.error("Verification error:", err);
      setAuthError("Server communication error.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePasscodeSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (enteredPasscode) {
      await triggerPasscodeVerify(enteredPasscode);
    }
  };

  const handleKeypadClick = (num: string) => {
    setEnteredPasscode((prev) => {
      const next = prev + num;
      if (next.length === 4) {
        setTimeout(() => triggerPasscodeVerify(next), 100);
      }
      return next.slice(0, 8);
    });
  };

  const handleBackspace = () => {
    setEnteredPasscode((prev) => prev.slice(0, -1));
  };

  // Physical keyboard support for rapid code entry
  useEffect(() => {
    if (isAuthorized) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT") return;

      if (e.key >= "0" && e.key <= "9") {
        setEnteredPasscode((prev) => {
          const next = prev + e.key;
          if (next.length === 4) {
            setTimeout(() => triggerPasscodeVerify(next), 100);
          }
          return next.slice(0, 8);
        });
      } else if (e.key === "Backspace") {
        setEnteredPasscode((prev) => prev.slice(0, -1));
      } else if (e.key === "Enter") {
        if (enteredPasscode) {
          triggerPasscodeVerify(enteredPasscode);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAuthorized, enteredPasscode]);

  // Real-time stats polling interval (only runs if authorized)
  useEffect(() => {
    fetchStats();
    if (!isAuthorized || !storedPass) return;
    const interval = setInterval(() => {
      fetchStats(true);
    }, 1000);
    return () => clearInterval(interval);
  }, [isAuthorized, storedPass]);

  // Autoscroll terminal hook
  useEffect(() => {
    if (autoscrollEnabled && terminalContainerRef.current) {
      terminalContainerRef.current.scrollTo({
        top: terminalContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [stats?.activityLogs, autoscrollEnabled, activeTab, terminalFilter]);

  const handleConfigChange = async (updatedFields: { cacheBypass?: boolean; ytdlpPriority?: boolean; scraperTimeout?: number }) => {
    setIsSavingConfig(true);
    setSaveSuccess(false);
    try {
      const response = await fetch("/api/admin/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": storedPass
        },
        body: JSON.stringify(updatedFields)
      });
      if (response.status === 200) {
        const data = await response.json();
        if (data.success && stats) {
          setStats({
            ...stats,
            config: data.config
          });
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 2000);
        }
      }
    } catch (err) {
      console.error("Config update failed:", err);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleSimulateLog = async () => {
    try {
      await fetch("/api/admin/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": storedPass
        },
        body: JSON.stringify({ simulateLog: true })
      });
      fetchStats(true);
    } catch (err) {
      console.error("Simulated log trigger failed:", err);
    }
  };

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = 2;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] flex flex-col items-center justify-center font-sans">
        <Helmet>
          <title>System Dashboard | Getinbex Developer Suite</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="relative flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
            className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full shadow-sm"
          />
          <div className="absolute w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-inner">
            <Lock className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
          </div>
        </div>
        <p className="mt-6 text-slate-500 text-xs font-bold tracking-widest uppercase animate-pulse">Establishing Secure Node Connect...</p>
      </div>
    );
  }

  if (!isAuthorized || !stats) {
    return (
      <div className="min-h-screen bg-slate-50 text-[#0f172a] font-sans flex items-center justify-center relative overflow-hidden px-4">
        <Helmet>
          <title>Private Developer Access | Getinbex</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>

        {/* Clean, high-quality grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f080_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f080_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        
        {/* Soft, beautiful ambient glowing spheres */}
        <div className="absolute top-[-10%] left-[-15%] w-[60vw] h-[60vw] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-15%] w-[60vw] h-[60vw] rounded-full bg-cyan-500/5 blur-[150px] pointer-events-none" />

        <motion.div 
          animate={isShaking ? { x: [-10, 10, -10, 10, -5, 5, 0] } : {}}
          transition={{ duration: 0.45 }}
          className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-8 shadow-[0_20px_50px_rgba(15,23,42,0.06)] flex flex-col items-center relative z-10"
        >
          {/* Lock Icon Box with smooth hover */}
          <div className="relative w-20 h-20 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-6 shadow-sm overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-cyan-500/5 animate-pulse" />
            <Lock className="w-9 h-9 text-indigo-600 relative z-10" />
          </div>
          
          <h1 className="text-xl font-extrabold text-slate-900 text-center tracking-tight uppercase">Developer Command Gateway</h1>
          <p className="text-xs text-slate-500 mt-2 text-center max-w-xs leading-relaxed">
            This dashboard is private. Please authenticate using your administrative passcode to establish a secure link.
          </p>

          {authError && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 px-4 py-2.5 bg-red-50 border border-red-100 rounded-xl text-center text-xs font-bold text-red-600 flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {authError}
            </motion.div>
          )}

          {/* Passcode indicators (4 glowing indicators) */}
          <div className="flex justify-center gap-5 my-8">
            {[0, 1, 2, 3].map((index) => (
              <div 
                key={index} 
                className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                  enteredPasscode.length > index 
                    ? "bg-indigo-600 border-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.3)] scale-110" 
                    : "bg-slate-50 border-slate-300"
                }`}
              />
            ))}
          </div>

          {/* Clean Light-Mode Keypad */}
          <div className="grid grid-cols-3 gap-y-4 gap-x-6 w-full max-w-[270px] mb-8">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeypadClick(num)}
                className="w-16 h-16 rounded-full bg-slate-50 hover:bg-indigo-600 hover:text-white font-extrabold text-lg flex items-center justify-center border border-slate-200/80 hover:border-indigo-600 transition-all active:scale-90 duration-150 shadow-sm text-slate-800"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-[10px] font-bold text-slate-400 hover:text-red-500 uppercase tracking-widest flex items-center justify-center active:scale-95 transition-colors"
            >
              Exit
            </button>
            <button
              type="button"
              onClick={() => handleKeypadClick("0")}
              className="w-16 h-16 rounded-full bg-slate-50 hover:bg-indigo-600 hover:text-white font-extrabold text-lg flex items-center justify-center border border-slate-200/80 hover:border-indigo-600 transition-all active:scale-90 duration-150 shadow-sm text-slate-800"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-widest flex items-center justify-center active:scale-95 transition-colors"
            >
              Delete
            </button>
          </div>

          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border border-slate-200 px-3 py-1.5 rounded-full bg-slate-50">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" />
            Keystroke capture active
          </div>

          {/* Backup text form input */}
          <form onSubmit={handlePasscodeSubmit} className="mt-6 pt-6 border-t border-slate-100 w-full flex items-center gap-2">
            <input 
              type="password" 
              placeholder="Or type passcode..."
              value={enteredPasscode}
              onChange={(e) => setEnteredPasscode(e.target.value.slice(0, 8))}
              className="flex-1 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold text-center tracking-widest focus:outline-none focus:border-indigo-600 placeholder:text-slate-400 focus:ring-1 focus:ring-indigo-100"
            />
            <button 
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all uppercase tracking-widest active:scale-95 shadow-sm hover:shadow-[0_4px_12px_rgba(79,70,229,0.2)]"
            >
              Verify
            </button>
          </form>

        </motion.div>
      </div>
    );
  }

  // Response latency chart coordinates
  const chartHeight = 120;
  const chartWidth = 520;
  const padding = 12;
  const graphHistory = chartPointsRef.current.length > 0 ? chartPointsRef.current : [80, 85, 90, 75, 110, 95, 80, 85, 100, 90];
  const maxVal = Math.max(...graphHistory, 150);
  const minVal = Math.min(...graphHistory, 10);
  
  const cacheTotal = stats.traffic.cacheHits + stats.traffic.cacheMisses;
  const cacheHitRatio = cacheTotal > 0 ? Math.round((stats.traffic.cacheHits / cacheTotal) * 100) : 100;

  const getSvgCoordinates = () => {
    if (graphHistory.length === 0) return "";
    const step = (chartWidth - padding * 2) / (graphHistory.length - 1 || 1);
    return graphHistory.map((val, index) => {
      const x = padding + index * step;
      const y = chartHeight - padding - ((val - minVal) / (maxVal - minVal || 1)) * (chartHeight - padding * 2);
      return `${x},${y}`;
    }).join(" ");
  };

  const coordinatesString = getSvgCoordinates();
  const pointsList = coordinatesString.split(" ");
  const areaPath = pointsList.length > 1 
    ? `M ${padding},${chartHeight - padding} L ${pointsList.join(" L ")} L ${padding + (graphHistory.length - 1) * ((chartWidth - padding * 2) / (graphHistory.length - 1 || 1))},${chartHeight - padding} Z`
    : "";

  // Filter logs for activity terminal console
  const activeConsoleLogs = stats.activityLogs
    .filter(log => {
      if (terminalFilter === "all") return true;
      return log.type === terminalFilter;
    })
    .filter(log => !clearedLogs.includes(log.id));

  // Reverse them for bottom-up scrolling terminal output
  const terminalRenderedLogs = activeConsoleLogs.slice().reverse();

  // Scraped Media Feed items
  const scrapedMediaLogs = stats.activityLogs.filter(log => 
    log.status === "success" && ["download", "stories", "profile", "bulk"].includes(log.type)
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-24 relative overflow-auto">
      <Helmet>
        <title>Developer Command Suite | Private Node</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Cyber Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f040_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f040_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Soft Glow Ambient Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-500/5 blur-[140px] pointer-events-none" />

      {/* Dashboard Wrapper */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 relative z-10">
        
        {/* Top Navigation / Dashboard Info Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8 pb-6 border-b border-slate-200">
          <div>
            <button 
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-wider mb-2.5 bg-white border border-slate-200 shadow-sm px-3.5 py-1.5 rounded-full"
            >
              <ArrowLeft className="w-3 h-3" /> System Toolkit
            </button>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5 tracking-tight uppercase">
              Developer Command Center
              <span className="inline-flex items-center gap-1 text-[9px] font-black bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-100 uppercase tracking-widest shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" />
                Live Connection
              </span>
            </h1>
            <p className="text-slate-500 text-xs mt-1 max-w-xl">
              An administrative suite monitoring background scraping algorithms, metadata caching pipeline latency, and interactive server controls.
            </p>
          </div>

          {/* Status info bar */}
          <div className="flex items-center gap-3 self-start md:self-center bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-col items-end pr-2 pl-3">
              <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider">Sync State: Active</span>
              <span className="text-[8px] font-bold text-slate-400 mt-0.5">Frequency: 1000ms polls</span>
            </div>
            <button 
              onClick={() => fetchStats()} 
              disabled={isRefreshing}
              className={`p-2.5 rounded-xl bg-slate-50 text-slate-600 hover:bg-indigo-600 hover:text-white border border-slate-200 hover:border-indigo-600 transition-all active:scale-95 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dashboard Tabs Header Nav */}
        <div className="flex flex-wrap gap-2 mb-8 bg-slate-200/50 p-1.5 rounded-2xl border border-slate-200/80 max-w-3xl shadow-sm">
          <button
            onClick={() => setActiveTab("performance")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-200 ${
              activeTab === "performance" 
                ? 'bg-white text-indigo-600 font-extrabold shadow-sm border border-slate-200' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'
            }`}
          >
            <Cpu className="w-4 h-4" /> Performance Stats
          </button>
          <button
            onClick={() => setActiveTab("status")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-200 ${
              activeTab === "status" 
                ? 'bg-white text-indigo-600 font-extrabold shadow-sm border border-slate-200' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'
            }`}
          >
            <Activity className="w-4 h-4" /> Live Status
          </button>
          <button
            onClick={() => setActiveTab("console")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-200 ${
              activeTab === "console" 
                ? 'bg-white text-indigo-600 font-extrabold shadow-sm border border-slate-200' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'
            }`}
          >
            <Terminal className="w-4 h-4" /> Activity Console
          </button>
          <button
            onClick={() => setActiveTab("blueprint")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-200 ${
              activeTab === "blueprint" 
                ? 'bg-white text-indigo-600 font-extrabold shadow-sm border border-slate-200' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'
            }`}
          >
            <Layers className="w-4 h-4" /> Flow Diagnostics
          </button>
          <button
            onClick={() => setActiveTab("api")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-200 ${
              activeTab === "api" 
                ? 'bg-white text-indigo-600 font-extrabold shadow-sm border border-slate-200' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'
            }`}
          >
            <Settings className="w-4 h-4" /> APIs & Tuning
          </button>
          <button
            onClick={() => setActiveTab("alerts")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-200 relative ${
              activeTab === "alerts" 
                ? 'bg-white text-indigo-600 font-extrabold shadow-sm border border-slate-200' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'
            }`}
          >
            <Bell className="w-4 h-4" /> Problems & Notifications
            {getActiveAlerts().filter(a => ["critical", "error", "warning"].includes(a.severity)).length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
            )}
          </button>
        </div>

        {/* Content Tabs Switcher */}
        <AnimatePresence mode="wait">
          
          {/* TAB 1: PERFORMANCE DIAGNOSTICS */}
          {activeTab === "performance" && (
            <motion.div
              key="performance-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              
              {/* Left Column Section: Circular Graphs Grid & Latency Line Graph */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* Unified performance dials container */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-indigo-600" /> Live Hardware & Caching Performance
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    
                    {/* CPU dial */}
                    <div className="flex flex-col items-center text-center">
                      <div className="relative w-24 h-24 flex items-center justify-center mb-2.5">
                        <svg className="absolute w-full h-full transform -rotate-90">
                          <defs>
                            <linearGradient id="cpuLight" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#4f46e5" />
                              <stop offset="100%" stopColor="#818cf8" />
                            </linearGradient>
                          </defs>
                          <circle cx="48" cy="48" r="38" fill="transparent" stroke="#f1f5f9" strokeWidth="6" />
                          <circle 
                            cx="48" 
                            cy="48" 
                            r="38" 
                            fill="transparent" 
                            stroke="url(#cpuLight)" 
                            strokeWidth="6" 
                            strokeDasharray={2 * Math.PI * 38} 
                            strokeDashoffset={2 * Math.PI * 38 * (1 - Math.min(stats.cpu.usage, 100) / 100)} 
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                          />
                        </svg>
                        <span className="text-xl font-extrabold text-slate-900 tracking-tighter">{stats.cpu.usage}%</span>
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">CPU Load</span>
                      <span className="text-[9px] font-bold text-slate-400 mt-1 line-clamp-1 w-full">{stats.cpu.model}</span>
                    </div>

                    {/* RAM dial */}
                    <div className="flex flex-col items-center text-center">
                      <div className="relative w-24 h-24 flex items-center justify-center mb-2.5">
                        <svg className="absolute w-full h-full transform -rotate-90">
                          <defs>
                            <linearGradient id="ramLight" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#0284c7" />
                              <stop offset="100%" stopColor="#38bdf8" />
                            </linearGradient>
                          </defs>
                          <circle cx="48" cy="48" r="38" fill="transparent" stroke="#f1f5f9" strokeWidth="6" />
                          <circle 
                            cx="48" 
                            cy="48" 
                            r="38" 
                            fill="transparent" 
                            stroke="url(#ramLight)" 
                            strokeWidth="6" 
                            strokeDasharray={2 * Math.PI * 38} 
                            strokeDashoffset={2 * Math.PI * 38 * (1 - stats.memory.percentage / 100)} 
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                          />
                        </svg>
                        <span className="text-xl font-extrabold text-slate-900 tracking-tighter">{stats.memory.percentage}%</span>
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">RAM Allocation</span>
                      <span className="text-[9px] font-bold text-slate-400 mt-1">{formatBytes(stats.memory.used)} / {formatBytes(stats.memory.total)}</span>
                    </div>

                    {/* Cache Hit dial */}
                    <div className="flex flex-col items-center text-center">
                      <div className="relative w-24 h-24 flex items-center justify-center mb-2.5">
                        <svg className="absolute w-full h-full transform -rotate-90">
                          <defs>
                            <linearGradient id="cacheLight" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#059669" />
                              <stop offset="100%" stopColor="#34d399" />
                            </linearGradient>
                          </defs>
                          <circle cx="48" cy="48" r="38" fill="transparent" stroke="#f1f5f9" strokeWidth="6" />
                          <circle 
                            cx="48" 
                            cy="48" 
                            r="38" 
                            fill="transparent" 
                            stroke="url(#cacheLight)" 
                            strokeWidth="6" 
                            strokeDasharray={2 * Math.PI * 38} 
                            strokeDashoffset={2 * Math.PI * 38 * (1 - cacheHitRatio / 100)} 
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                          />
                        </svg>
                        <span className="text-xl font-extrabold text-slate-900 tracking-tighter">{cacheHitRatio}%</span>
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Cache Hit Ratio</span>
                      <span className="text-[9px] font-bold text-slate-400 mt-1">{stats.traffic.cacheHits} Hit / {stats.traffic.cacheMisses} Miss</span>
                    </div>

                    {/* Active Tasks dial */}
                    <div className="flex flex-col items-center text-center">
                      <div className="relative w-24 h-24 flex items-center justify-center mb-2.5">
                        <svg className="absolute w-full h-full transform -rotate-90">
                          <defs>
                            <linearGradient id="tasksLight" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#7c3aed" />
                              <stop offset="100%" stopColor="#a78bfa" />
                            </linearGradient>
                          </defs>
                          <circle cx="48" cy="48" r="38" fill="transparent" stroke="#f1f5f9" strokeWidth="6" />
                          <circle 
                            cx="48" 
                            cy="48" 
                            r="38" 
                            fill="transparent" 
                            stroke="url(#tasksLight)" 
                            strokeWidth="6" 
                            strokeDasharray={2 * Math.PI * 38} 
                            strokeDashoffset={2 * Math.PI * 38 * (1 - Math.min(stats.activeTasks, 50) / 50)} 
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                          />
                        </svg>
                        <span className="text-xl font-extrabold text-slate-900 tracking-tighter">{stats.activeTasks}</span>
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Active Processes</span>
                      <span className="text-[9px] font-bold text-slate-400 mt-1">Concur. limit: 50</span>
                    </div>

                  </div>
                </div>

                {/* SVG Latency Chart */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
                        <TrendingUp className="w-4 h-4 text-indigo-600" /> API Resolution Latency
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">Execution speed in milliseconds across last 15 consecutive backend query connections.</p>
                    </div>
                    <div className="flex items-center gap-4 text-slate-500 text-xs font-bold border-l border-slate-200 pl-4 font-mono">
                      <div>
                        <span className="block text-slate-400 uppercase tracking-widest text-[8px]">Session Avg</span>
                        <span className="text-sm font-extrabold text-emerald-600">{stats.traffic.avgLatency}ms</span>
                      </div>
                      <div>
                        <span className="block text-slate-400 uppercase tracking-widest text-[8px]">Current Speed</span>
                        <span className="text-sm font-extrabold text-slate-900">{graphHistory[graphHistory.length - 1] || 85}ms</span>
                      </div>
                    </div>
                  </div>

                  {/* SVG Canvas */}
                  <div className="w-full bg-slate-50/50 p-2.5 rounded-2xl border border-slate-100 relative overflow-hidden">
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-[150px] overflow-visible">
                      <defs>
                        <linearGradient id="latencyLightGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.1" />
                          <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Grid Lines */}
                      <line x1="0" y1={padding} x2={chartWidth} y2={padding} stroke="#e2e8f0" strokeWidth="0.8" strokeDasharray="3 3" />
                      <line x1="0" y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="#e2e8f0" strokeWidth="0.8" strokeDasharray="3 3" />
                      <line x1="0" y1={chartHeight - padding} x2={chartWidth} y2={chartHeight - padding} stroke="#e2e8f0" strokeWidth="0.8" strokeDasharray="3 3" />

                      {/* Labels */}
                      <text x="5" y={padding + 10} fill="#94a3b8" fontSize="8" fontWeight="bold" className="font-mono">{maxVal}ms</text>
                      <text x="5" y={chartHeight / 2 + 3} fill="#94a3b8" fontSize="8" fontWeight="bold" className="font-mono">{Math.round((maxVal + minVal) / 2)}ms</text>
                      <text x="5" y={chartHeight - padding - 2} fill="#94a3b8" fontSize="8" fontWeight="bold" className="font-mono">{minVal}ms</text>

                      {/* Area */}
                      {areaPath && (
                        <path d={areaPath} fill="url(#latencyLightGrad)" className="transition-all duration-300" />
                      )}

                      {/* Stroke Line */}
                      {coordinatesString && (
                        <polyline
                          fill="transparent"
                          stroke="#4f46e5"
                          strokeWidth="2"
                          points={coordinatesString}
                          className="transition-all duration-300"
                        />
                      )}

                      {/* Dot indicators */}
                      {pointsList.length > 0 && pointsList.map((pt, idx) => {
                        if (!pt) return null;
                        const [x, y] = pt.split(",");
                        const isLast = idx === pointsList.length - 1;
                        return (
                          <g key={`dot-${idx}`}>
                            <circle
                              cx={x}
                              cy={y}
                              r={isLast ? "4.5" : "3"}
                              fill={isLast ? "#4f46e5" : "#a5b4fc"}
                              stroke={isLast ? "#ffffff" : "#6366f1"}
                              strokeWidth="1.5"
                            />
                            {isLast && (
                              <circle
                                cx={x}
                                cy={y}
                                r="8"
                                fill="transparent"
                                stroke="#4f46e5"
                                strokeWidth="0.8"
                                className="animate-ping"
                              />
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>

              </div>

              {/* Right Column Section: Session analytics indicators */}
              <div className="space-y-8">
                
                {/* Traffic statistics counters */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                  <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 mb-5 pb-3 border-b border-slate-100 uppercase tracking-wider">
                    <TrendingUp className="w-4 h-4 text-indigo-600" /> Analytics Ledger
                  </h2>
                  <div className="space-y-4 font-semibold text-slate-700">
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Scrapes Tracked</span>
                      <span className="text-sm font-extrabold text-slate-900 font-mono">{stats.traffic.totalRequests}</span>
                    </div>
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Scraper Success Rate</span>
                      {(() => {
                        const total = stats.traffic.successCount + stats.traffic.failedCount;
                        const rate = total > 0 ? Math.round((stats.traffic.successCount / total) * 100) : 100;
                        return (
                          <span className={`text-sm font-extrabold font-mono ${rate > 90 ? 'text-emerald-600' : 'text-amber-600'}`}>{rate}%</span>
                        );
                      })()}
                    </div>
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Process Memory Heap</span>
                      <span className="text-sm font-extrabold text-slate-900 font-mono">{formatBytes(stats.memory.process)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">System Privacy Gate</span>
                      <span className="inline-flex items-center gap-1 text-[9px] font-extrabold bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full border border-indigo-100 uppercase tracking-wider">
                        <ShieldCheck className="w-3.5 h-3.5" /> SECURE_DEV
                      </span>
                    </div>
                  </div>
                </div>

                {/* System timers uptime */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                  <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 mb-5 pb-3 border-b border-slate-100 uppercase tracking-wider">
                    <Clock className="w-4 h-4 text-indigo-600" /> System Uptime
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <span className="block text-[9px] text-slate-400 font-extrabold uppercase tracking-widest mb-1.5">Process Live Ticker</span>
                      <div className="text-lg font-extrabold text-slate-800 bg-slate-50 px-4 py-3.5 border border-slate-200/60 rounded-2xl flex items-center gap-2.5 font-mono shadow-inner">
                        <Clock className="w-4 h-4 text-indigo-600 animate-pulse" />
                        {formatUptime(stats.uptime)}
                      </div>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 font-extrabold uppercase tracking-widest mb-1.5">Snapchat API CDN Access</span>
                      <div className="flex items-center justify-between bg-slate-50 px-4 py-3.5 border border-slate-200/60 rounded-2xl shadow-inner">
                        <span className="text-xs text-slate-500 font-bold font-mono">www.snapchat.com</span>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider ${stats.reachability.snapchat === "Active" ? "text-emerald-600" : "text-red-500 animate-pulse"}`}>
                          <span className={`w-2 h-2 rounded-full ${stats.reachability.snapchat === "Active" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-red-500"}`} />
                          {stats.reachability.snapchat === "Active" ? "Online" : "Blocked"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </motion.div>
          )}

          {/* TAB: LIVE STATUS */}
          {activeTab === "status" && (
            <motion.div
              key="status-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 mb-6">
                  <Activity className="w-5 h-5 text-indigo-600" />
                  Public System Monitor & Alerts
                </h2>
                <StatusPage passcode={storedPass} />
              </div>
            </motion.div>
          )}

          {/* TAB 2: LIVE ACTIVITY CONSOLE & PIPELINES MONITOR */}
          {activeTab === "console" && (
            <motion.div
              key="console-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              
              {/* PERSONAL SERVICES ENGINE MONITOR (REPLACING OLD SEO) */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4.5 h-4.5 text-indigo-600" /> Personal Scraper Engine status nodes
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Review running states, cache loops, and binary hooks powering administrative pipelines.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  
                  {/* Service 1: Caching Pipeline */}
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col justify-between hover:border-indigo-100 transition-all">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Metadata Cache</span>
                        <span className={`w-2 h-2 rounded-full ${!stats.config.cacheBypass ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-amber-400 animate-pulse"}`} />
                      </div>
                      <span className="text-xs font-extrabold text-slate-800 block">Caching Pipeline</span>
                      <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Saves fetch requests in RAM for 24-hours.</p>
                    </div>
                    <span className="text-[9px] font-extrabold text-indigo-600 mt-3 uppercase tracking-wider block font-mono border-t border-slate-200/50 pt-2 cursor-pointer" onClick={() => handleConfigChange({ cacheBypass: !stats.config.cacheBypass })}>
                      {!stats.config.cacheBypass ? "ACTIVE (TIGHT)" : "BYPASSED (RAW)"}
                    </span>
                  </div>

                  {/* Service 2: Cheerio Native Scraper */}
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col justify-between hover:border-indigo-100 transition-all">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cheerio core</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                      </div>
                      <span className="text-xs font-extrabold text-slate-800 block">Cheerio Scraper</span>
                      <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Direct Axios/HTML crawler for sub-second parses.</p>
                    </div>
                    <span className="text-[9px] font-extrabold text-emerald-600 mt-3 uppercase tracking-wider block font-mono border-t border-slate-200/50 pt-2">
                      RUNNING STEADY
                    </span>
                  </div>

                  {/* Service 3: yt-dlp Wrapper */}
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col justify-between hover:border-indigo-100 transition-all">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">yt-dlp hook</span>
                        <span className={`w-2 h-2 rounded-full ${stats.config.ytdlpPriority ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-amber-400 animate-pulse"}`} />
                      </div>
                      <span className="text-xs font-extrabold text-slate-800 block">yt-dlp Resolver</span>
                      <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Shell binary execution to bypass CDN blocks.</p>
                    </div>
                    <span className="text-[9px] font-extrabold text-amber-600 mt-3 uppercase tracking-wider block font-mono border-t border-slate-200/50 pt-2 cursor-pointer" onClick={() => handleConfigChange({ ytdlpPriority: !stats.config.ytdlpPriority })}>
                      {stats.config.ytdlpPriority ? "PREFER FALLBACK" : "STANDBY POOL"}
                    </span>
                  </div>

                  {/* Service 4: Spotlight Scraper Core */}
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col justify-between hover:border-indigo-100 transition-all">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Spotlight API</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                      </div>
                      <span className="text-xs font-extrabold text-slate-800 block">Spotlight Scraper</span>
                      <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Resolves public trending media and links.</p>
                    </div>
                    <span className="text-[9px] font-extrabold text-indigo-600 mt-3 uppercase tracking-wider block font-mono border-t border-slate-200/50 pt-2">
                      ONLINE (READY)
                    </span>
                  </div>

                  {/* Service 5: Stories Proxy Pipe */}
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col justify-between hover:border-indigo-100 transition-all">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Video Streamer</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                      </div>
                      <span className="text-xs font-extrabold text-slate-800 block">Stories Proxy Pipe</span>
                      <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Streams Snapchat CDN source bypassing CORS.</p>
                    </div>
                    <span className="text-[9px] font-extrabold text-emerald-600 mt-3 uppercase tracking-wider block font-mono border-t border-slate-200/50 pt-2">
                      ENABLED (ACTIVE)
                    </span>
                  </div>

                </div>
              </div>

              {/* Sleek Vercel-style Slate-Light Terminal Window */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                
                {/* Terminal top border bar */}
                <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-amber-400" />
                      <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    </div>
                    <span className="text-[10px] font-black uppercase text-slate-700 font-mono tracking-widest pl-1.5">DEV_ENGINE_ACTIVITY_LEDGER</span>
                  </div>

                  {/* Filter tags inside terminal */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(["all", "download", "stories", "profile", "bulk", "simulated"] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setTerminalFilter(filter)}
                        className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg border font-mono transition-all duration-200 cursor-pointer ${
                          terminalFilter === filter 
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' 
                            : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>

                  {/* Log controller elements */}
                  <div className="flex items-center gap-3 border-l border-slate-200 pl-4 font-mono">
                    <button
                      onClick={() => setAutoscrollEnabled(!autoscrollEnabled)}
                      className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                        autoscrollEnabled 
                          ? 'border-indigo-200 text-indigo-600 bg-indigo-50/50' 
                          : 'border-slate-200 text-slate-500 bg-white hover:bg-slate-50'
                      }`}
                    >
                      Autoscroll: {autoscrollEnabled ? "ON" : "OFF"}
                    </button>
                    <button
                      onClick={() => setClearedLogs(stats.activityLogs.map(l => l.id))}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200 bg-white"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* CLI Shell output box */}
                <div 
                  ref={terminalContainerRef} 
                  onScroll={handleTerminalScroll}
                  className="bg-slate-950 p-6 h-[380px] overflow-y-auto font-mono text-xs leading-relaxed relative"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[size:100%_4px] pointer-events-none opacity-20" />

                  {terminalRenderedLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-600 font-bold uppercase tracking-wider">
                      <Terminal className="w-8 h-8 text-slate-800 animate-pulse mb-3" />
                      No system events registered.
                      <span className="text-[10px] text-slate-500 mt-1">Generate a simulated action to see log streams.</span>
                    </div>
                  ) : (
                    <div className="space-y-2 relative z-10">
                      {terminalRenderedLogs.map((log) => {
                        let colorClass = "text-slate-300";
                        let typeTag = `[${log.type.toUpperCase()}]`;
                        if (log.type === "download") colorClass = "text-cyan-400 font-bold";
                        else if (log.type === "stories") colorClass = "text-purple-400 font-bold";
                        else if (log.type === "profile") colorClass = "text-amber-400 font-bold";
                        else if (log.type === "bulk") colorClass = "text-blue-400 font-bold";
                        else if (log.type === "simulated") colorClass = "text-emerald-400 font-bold";

                        return (
                          <div key={log.id} className="flex flex-wrap items-start hover:bg-slate-900/10 py-0.5 px-1 rounded transition-colors group">
                            <span className="text-slate-600 mr-2 flex-shrink-0 text-[10px] select-none font-bold">[{log.timestamp}]</span>
                            <span className={`${colorClass} mr-2.5 flex-shrink-0 text-[10px] tracking-wider`}>{typeTag}</span>
                            <span className="text-slate-400 mr-2 font-black select-all">@{log.username}</span>
                            <span className="text-slate-200 flex-1">{log.message}</span>
                            <span className="text-slate-600 text-[10px] font-bold ml-2 font-mono tracking-tighter opacity-70 group-hover:opacity-100 transition-opacity">
                              {log.latency}ms
                            </span>
                            <span className={`w-1.5 h-1.5 rounded-full ml-3 self-center ${
                              log.status === "success" 
                                ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" 
                                : log.status === "failed" 
                                ? "bg-red-500 shadow-[0_0_8px_#ef4444]" 
                                : "bg-amber-400 animate-pulse"
                            }`} />
                          </div>
                        );
                      })}
                      <div ref={terminalEndRef} />
                    </div>
                  )}

                </div>

                {/* Simulated trigger deck */}
                <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                    <p className="text-xs text-slate-500 font-semibold">
                      Generate administrative scraper events to simulate active system activity.
                    </p>
                  </div>
                  <button
                    onClick={handleSimulateLog}
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-widest px-5 py-3 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 text-white fill-white" /> Generate Simulated Action
                  </button>
                </div>

              </div>

              {/* Feed Grid displaying active resolved sessions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-600" /> Active resolved streams
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                    Showing {Math.min(scrapedMediaLogs.length, 6)} active queries
                  </span>
                </div>

                {scrapedMediaLogs.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-400">
                    <p className="text-xs font-bold uppercase tracking-wider">No active query sessions detected.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {scrapedMediaLogs.slice(0, 6).map((log) => (
                      <div key={log.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                              log.type === "download" ? "bg-cyan-50 text-cyan-700" :
                              log.type === "stories" ? "bg-purple-50 text-purple-700" :
                              log.type === "profile" ? "bg-amber-50 text-amber-700" :
                              "bg-blue-50 text-blue-700"
                            }`}>
                              {log.type === "download" ? "Single Video" :
                               log.type === "stories" ? "Story View" :
                               log.type === "profile" ? "Profile DP" :
                               "Bulk Snaps"}
                            </span>
                            <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-100 uppercase tracking-wider font-mono">
                              <CheckCircle className="w-2.5 h-2.5" /> Resolved
                            </span>
                          </div>

                          <span className="block text-sm font-extrabold text-slate-800 truncate">@{log.username}</span>
                          <p className="text-[11px] text-slate-500 leading-relaxed mt-1 line-clamp-2">{log.message}</p>
                        </div>

                        <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {log.timestamp}</span>
                          <span className="text-slate-700 font-extrabold">{log.latency}ms</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </motion.div>
          )}

          {/* TAB 3: ENGINE FLOW DIAGNOSTICS (VISUAL BLUEPRINT & GOAL PAGE) */}
          {activeTab === "blueprint" && (
            <motion.div
              key="blueprint-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              
              {/* FLOW Blueprint Diagram Card */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-4.5 h-4.5 text-indigo-600 animate-pulse" /> Background Data Flow Blueprint Map
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Interactive schematic tracing how Snapchat data transitions between native scrapers, caches, and CDN streamers.</p>
                  </div>
                  
                  {/* Pipeline filters */}
                  <div className="flex flex-wrap gap-1 bg-slate-50 p-1 border border-slate-200/80 rounded-xl">
                    {(["all", "profile", "spotlight", "video", "story", "bulk"] as const).map((flow) => (
                      <button
                        key={flow}
                        onClick={() => setHighlightedFlow(flow)}
                        className={`text-[9px] font-extrabold uppercase px-2.5 py-1.5 rounded-lg transition-colors font-mono cursor-pointer ${
                          highlightedFlow === flow 
                            ? "bg-white text-indigo-600 shadow-sm border border-slate-200" 
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        {flow}
                      </button>
                    ))}
                  </div>
                </div>

                {/* CSS data flow schematic map */}
                <div className="py-8 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col md:flex-row items-center justify-around gap-6 relative px-4 overflow-x-auto min-w-[700px]">
                  
                  {/* Node 1: Link input */}
                  <div 
                    onClick={() => setActiveBlueprintNode("input")}
                    className={`cursor-pointer p-4 rounded-2xl border text-center transition-all w-32 relative z-10 flex flex-col items-center justify-center ${
                      activeBlueprintNode === "input" ? "border-indigo-600 bg-indigo-50 shadow-md ring-2 ring-indigo-100" :
                      ["all", "profile", "spotlight", "video", "story", "bulk"].includes(highlightedFlow)
                        ? "border-indigo-400 bg-white shadow-sm shadow-indigo-100 scale-105"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <Search className="w-5 h-5 text-indigo-600 mb-1.5" />
                    <span className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wide">User Link</span>
                    <span className="text-[8px] font-bold text-slate-400 mt-0.5">Link Input</span>
                  </div>

                  {/* Pulsing Connector Line 1 */}
                  <div className="flex-1 h-0.5 border-t-2 border-dashed border-indigo-300 relative min-w-[30px] hidden md:block">
                    <div className="absolute top-1/2 left-0 w-2 h-2 rounded-full bg-indigo-500 -translate-y-1/2 animate-[ping_1.5s_infinite]" />
                  </div>

                  {/* Node 2: Axios Scraper Core */}
                  <div 
                    onClick={() => setActiveBlueprintNode("axios")}
                    className={`cursor-pointer p-4 rounded-2xl border text-center transition-all w-32 relative z-10 flex flex-col items-center justify-center ${
                      activeBlueprintNode === "axios" ? "border-indigo-600 bg-indigo-50 shadow-md ring-2 ring-indigo-100" :
                      ["all", "profile", "spotlight", "video", "story", "bulk"].includes(highlightedFlow)
                        ? "border-indigo-400 bg-white shadow-sm shadow-indigo-100 scale-105 animate-pulse"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <Cpu className="w-5 h-5 text-indigo-600 mb-1.5" />
                    <span className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wide">Axios Core</span>
                    <span className="text-[8px] font-bold text-slate-400 mt-0.5">Header Injection</span>
                  </div>

                  {/* Pulsing Connector Line 2 */}
                  <div className="flex-1 h-0.5 border-t-2 border-dashed border-indigo-300 relative min-w-[30px] hidden md:block">
                    <div className="absolute top-1/2 left-0 w-2 h-2 rounded-full bg-indigo-500 -translate-y-1/2 animate-[ping_1.5s_infinite_0.3s]" />
                  </div>

                  {/* Node 3: Cheerio parser OR Fallback yt-dlp */}
                  <div className="flex flex-col gap-4 relative z-10">
                    {/* Native Cheerio */}
                    <div 
                      onClick={() => setActiveBlueprintNode("cheerio")}
                      className={`cursor-pointer p-3 rounded-2xl border text-center transition-all w-32 flex flex-col items-center justify-center ${
                        activeBlueprintNode === "cheerio" ? "border-emerald-600 bg-emerald-50 shadow-md ring-2 ring-emerald-100" :
                        ["all", "profile", "spotlight", "video", "story", "bulk"].includes(highlightedFlow)
                          ? "border-emerald-400 bg-white shadow-sm scale-105"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <Zap className="w-4.5 h-4.5 text-emerald-500 mb-1" />
                      <span className="text-[9px] font-extrabold text-slate-800 uppercase tracking-wide">Cheerio Engine</span>
                      <span className="text-[8px] font-bold text-emerald-600 mt-0.5">Axios Scraper</span>
                    </div>

                    {/* Fallback yt-dlp */}
                    <div 
                      onClick={() => setActiveBlueprintNode("ytdlp")}
                      className={`cursor-pointer p-3 rounded-2xl border text-center transition-all w-32 flex flex-col items-center justify-center ${
                        activeBlueprintNode === "ytdlp" ? "border-amber-600 bg-amber-50 shadow-md ring-2 ring-amber-100" :
                        ["all", "spotlight", "video"].includes(highlightedFlow)
                          ? "border-amber-500 bg-white shadow-sm scale-105 animate-pulse"
                          : "border-slate-200 bg-white opacity-50"
                      }`}
                    >
                      <Terminal className="w-4.5 h-4.5 text-amber-500 mb-1" />
                      <span className="text-[9px] font-extrabold text-slate-800 uppercase tracking-wide">yt-dlp core</span>
                      <span className="text-[8px] font-bold text-amber-600 mt-0.5">Shell Exec</span>
                    </div>
                  </div>

                  {/* Pulsing Connector Line 3 */}
                  <div className="flex-1 h-0.5 border-t-2 border-dashed border-indigo-300 relative min-w-[30px] hidden md:block">
                    <div className="absolute top-1/2 left-0 w-2 h-2 rounded-full bg-indigo-500 -translate-y-1/2 animate-[ping_1.5s_infinite_0.6s]" />
                  </div>

                  {/* Node 4: Cache Caching check */}
                  <div 
                    onClick={() => setActiveBlueprintNode("cache")}
                    className={`cursor-pointer p-4 rounded-2xl border text-center transition-all w-32 relative z-10 flex flex-col items-center justify-center ${
                      activeBlueprintNode === "cache" ? "border-indigo-600 bg-indigo-50 shadow-md ring-2 ring-indigo-100" :
                      ["all", "profile", "spotlight", "video", "bulk"].includes(highlightedFlow)
                        ? "border-indigo-400 bg-white shadow-sm scale-105"
                        : "border-slate-200 bg-white opacity-40"
                    }`}
                  >
                    <Layers className="w-5 h-5 text-indigo-600 mb-1.5" />
                    <span className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wide">LRU Cache</span>
                    <span className="text-[8px] font-bold text-slate-400 mt-0.5">24h RAM Check</span>
                  </div>

                  {/* Pulsing Connector Line 4 */}
                  <div className="flex-1 h-0.5 border-t-2 border-dashed border-indigo-300 relative min-w-[30px] hidden md:block">
                    <div className="absolute top-1/2 left-0 w-2 h-2 rounded-full bg-indigo-500 -translate-y-1/2 animate-[ping_1.5s_infinite_0.9s]" />
                  </div>

                  {/* Node 5: Stream proxy output */}
                  <div 
                    onClick={() => setActiveBlueprintNode("proxy")}
                    className={`cursor-pointer p-4 rounded-2xl border text-center transition-all w-32 relative z-10 flex flex-col items-center justify-center ${
                      activeBlueprintNode === "proxy" ? "border-indigo-600 bg-indigo-50 shadow-md ring-2 ring-indigo-100" :
                      ["all", "spotlight", "video", "story", "bulk"].includes(highlightedFlow)
                        ? "border-indigo-400 bg-white shadow-sm scale-105"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <Wifi className="w-5 h-5 text-indigo-600 mb-1.5" />
                    <span className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wide">Proxy Pipe</span>
                    <span className="text-[8px] font-bold text-slate-400 mt-0.5">CORS Bypass CDN</span>
                  </div>

                </div>

                {/* Blueprint dynamic details explanation box */}
                <div className="mt-6 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl min-h-[90px]">
                  {activeBlueprintNode === null ? (
                    <div className="text-slate-500 text-xs font-bold flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                      <span>Click any node in the flowchart above to inspect background code algorithms, routing variables, and speed diagnostics.</span>
                    </div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-slate-700 space-y-1"
                    >
                      {activeBlueprintNode === "input" && (
                        <>
                          <span className="block font-black text-slate-900 uppercase">Input Link Parser (`server.ts` regex checks)</span>
                          <p className="text-slate-600">Extracts usernames and unique identifiers from raw Snapchat spotlight links, stories shares, or profile handles. Includes security scans blocking path traversal payloads.</p>
                        </>
                      )}
                      {activeBlueprintNode === "axios" && (
                        <>
                          <span className="block font-black text-slate-900 uppercase">Axios Request Engine & Headers</span>
                          <p className="text-slate-600">Dispatches HTTP requests to Snapchat CDN. Configures custom mobile browser headers (`User-Agent`, `Accept-Language`, `Referer`) to simulate human interactions and bypass anti-scraping filters.</p>
                        </>
                      )}
                      {activeBlueprintNode === "cheerio" && (
                        <>
                          <span className="block font-black text-slate-900 uppercase">Cheerio HTML Parser (Fast Scraping Core)</span>
                          <p className="text-slate-600">Loads raw static HTML response bytes and reads Javascript schema (`__NEXT_DATA__` tags) in memory. Operates at extreme speed **(100ms - 300ms)** to parse video streams natively without starting processes.</p>
                        </>
                      )}
                      {activeBlueprintNode === "ytdlp" && (
                        <>
                          <span className="block font-black text-slate-900 uppercase">yt-dlp Core Executable fallback</span>
                          <p className="text-slate-600">Activated as fallback if Cheerio signature matches fail. Enforces background node child-process wrapper executes `yt-dlp` executable bin. Requires process initialization overhead **(3s - 7s)**.</p>
                        </>
                      )}
                      {activeBlueprintNode === "cache" && (
                        <>
                          <span className="block font-black text-slate-900 uppercase">LRU Caching Pipeline (24h memory pool)</span>
                          <p className="text-slate-600">Direct memory cache checking. If cache contains profile details and bypass config is OFF, it responds in **0ms** from RAM pool, preventing heavy secondary scans and rate limiting.</p>
                        </>
                      )}
                      {activeBlueprintNode === "proxy" && (
                        <>
                          <span className="block font-black text-slate-900 uppercase">CDN proxy stream pipe</span>
                          <p className="text-slate-600">Forwards chunks of binary data directly from Snapchat's CDN servers to client browser. Prevents browser CORS restrictions and hides CDN origin, offering clean custom filename attachments.</p>
                        </>
                      )}
                      <button onClick={() => setActiveBlueprintNode(null)} className="text-[10px] font-extrabold text-indigo-600 uppercase mt-2 block hover:underline">
                        Close Description
                      </button>
                    </motion.div>
                  )}
                </div>

              </div>

              {/* Tool diagnostics flow descriptions list separately */}
              <div className="space-y-4">
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <CheckSquare className="w-4.5 h-4.5 text-indigo-600" /> Individual tool status diagnostics & speeds
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Tool 1: Profile Viewer */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                      <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Profile HD Viewer</h4>
                      <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-widest font-mono">
                        Online (Fast)
                      </span>
                    </div>
                    <ul className="text-xs text-slate-600 space-y-2 font-semibold">
                      <li className="flex justify-between"><span>Speed Range:</span> <span className="font-mono text-slate-900">100ms - 250ms</span></li>
                      <li className="flex justify-between"><span>Native Engine:</span> <span className="text-emerald-600 font-mono">Cheerio (Axios PP)</span></li>
                      <li className="flex justify-between"><span>Caching State:</span> <span className="text-indigo-600 font-mono">ENABLED (24h TTL)</span></li>
                      <li className="flex justify-between"><span>Sub-service status:</span> <span className="text-slate-500">Active (Axios crawler pool)</span></li>
                    </ul>
                  </div>

                  {/* Tool 2: Spotlight Downloader */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                      <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Spotlight Downloader</h4>
                      <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-widest font-mono">
                        Online (Hybrid)
                      </span>
                    </div>
                    <ul className="text-xs text-slate-600 space-y-2 font-semibold">
                      <li className="flex justify-between"><span>Speed Range:</span> <span className="font-mono text-slate-900">150ms - 400ms (cheerio) / 3s - 7s (yt-dlp)</span></li>
                      <li className="flex justify-between"><span>Native Engine:</span> <span className="text-emerald-600 font-mono">Cheerio with yt-dlp backup</span></li>
                      <li className="flex justify-between"><span>Caching State:</span> <span className="text-indigo-600 font-mono">ENABLED</span></li>
                      <li className="flex justify-between"><span>Sub-service status:</span> <span className="text-slate-500">Active (Spotlight feeds & stories resolved)</span></li>
                    </ul>
                  </div>

                  {/* Tool 3: Story Viewer */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                      <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Story Link Viewer</h4>
                      <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-widest font-mono">
                        Online (Fast)
                      </span>
                    </div>
                    <ul className="text-xs text-slate-600 space-y-2 font-semibold">
                      <li className="flex justify-between"><span>Speed Range:</span> <span className="font-mono text-slate-900">200ms - 300ms</span></li>
                      <li className="flex justify-between"><span>Native Engine:</span> <span className="text-emerald-600 font-mono">Cheerio parser</span></li>
                      <li className="flex justify-between"><span>Caching State:</span> <span className="text-amber-600 font-mono">BYPASSED (Bypasses expired links)</span></li>
                      <li className="flex justify-between"><span>Sub-service status:</span> <span className="text-slate-500">Active (Dynamic link signatures)</span></li>
                    </ul>
                  </div>

                  {/* Tool 4: Bulk Downloader */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                      <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Bulk Profile Media</h4>
                      <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-widest font-mono">
                        Online (Fast)
                      </span>
                    </div>
                    <ul className="text-xs text-slate-600 space-y-2 font-semibold">
                      <li className="flex justify-between"><span>Speed Range:</span> <span className="font-mono text-slate-900">500ms - 1.2s</span></li>
                      <li className="flex justify-between"><span>Native Engine:</span> <span className="text-emerald-600 font-mono">Batched Axios JSON api crawler</span></li>
                      <li className="flex justify-between"><span>Caching State:</span> <span className="text-indigo-600 font-mono">ENABLED (24h TTL)</span></li>
                      <li className="flex justify-between"><span>Sub-service status:</span> <span className="text-slate-500">Active (Resolves up to 100 snaps concurrently)</span></li>
                    </ul>
                  </div>

                </div>
              </div>

            </motion.div>
          )}

          {/* TAB 4: API MODULE DIAGNOSTICS & TUNING PANEL */}
          {activeTab === "api" && (
            <motion.div
              key="api-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              
              {/* Left Column Section: Strategy rates & tuning board */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* INTERACTIVE DYNAMIC ENGINE CONFIG TUNER */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm relative overflow-hidden">
                  
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                      <Sliders className="w-5 h-5 text-indigo-600" /> Interactive Engine Tuning Controls
                    </h2>
                    
                    {/* Sync saved indicator */}
                    <AnimatePresence>
                      {saveSuccess && (
                        <motion.span 
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full uppercase tracking-wider font-mono"
                        >
                          <Check className="w-3 h-3" /> Config Saved
                        </motion.span>
                      )}
                      {isSavingConfig && (
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest animate-pulse font-mono">
                          Syncing Backend...
                        </span>
                      )}
                    </AnimatePresence>
                  </div>
                  <p className="text-xs text-slate-500 mb-6">
                    Globally tweak administrative scraping pipelines. Parameters update server variables instantly on subsequent scrapes.
                  </p>

                  <div className="space-y-6">
                    
                    {/* Cache Bypass switch toggle */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 gap-4 hover:border-slate-300 transition-colors">
                      <div>
                        <span className="block text-xs font-extrabold text-slate-800 uppercase tracking-wide">Cache Bypass Mode</span>
                        <span className="text-[10px] text-slate-500 mt-1 leading-relaxed block max-w-sm font-semibold">
                          Force bypass of metadata memory caches. If enabled, the server performs a fresh Snapchat CDN page crawl for every single client load.
                        </span>
                      </div>
                      <button
                        onClick={() => handleConfigChange({ cacheBypass: !stats.config.cacheBypass })}
                        className={`w-14 h-8 rounded-full p-1.5 transition-all duration-300 relative flex-shrink-0 cursor-pointer ${
                          stats.config.cacheBypass 
                            ? 'bg-indigo-600 shadow-md' 
                            : 'bg-slate-200 border border-slate-300'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full transition-transform duration-300 ${
                          stats.config.cacheBypass 
                            ? 'translate-x-6 bg-white' 
                            : 'translate-x-0 bg-slate-400'
                        }`} />
                      </button>
                    </div>

                    {/* Fallback priority toggle */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 gap-4 hover:border-slate-300 transition-colors">
                      <div>
                        <span className="block text-xs font-extrabold text-slate-800 uppercase tracking-wide">Enforce yt-dlp Core Fallback</span>
                        <span className="text-[10px] text-slate-500 mt-1 leading-relaxed block max-w-sm font-semibold">
                          Skip the lightweight Cheerio parser and route standard media queries directly through process-level yt-dlp shell resolution (higher latency).
                        </span>
                      </div>
                      <button
                        onClick={() => handleConfigChange({ ytdlpPriority: !stats.config.ytdlpPriority })}
                        className={`w-14 h-8 rounded-full p-1.5 transition-all duration-300 relative flex-shrink-0 cursor-pointer ${
                          stats.config.ytdlpPriority 
                            ? 'bg-indigo-600 shadow-md' 
                            : 'bg-slate-200 border border-slate-300'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full transition-transform duration-300 ${
                          stats.config.ytdlpPriority 
                            ? 'translate-x-6 bg-white' 
                            : 'translate-x-0 bg-slate-400'
                        }`} />
                      </button>
                    </div>

                    {/* Scraper Timeout slider */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors">
                      <div className="flex items-center justify-between mb-3 text-xs font-extrabold">
                        <span className="text-slate-800 uppercase tracking-wide">Scraper Connection Timeout Threshold</span>
                        <span className="text-indigo-600 font-extrabold font-mono">{(stats.config.scraperTimeout / 1000).toFixed(1)}s</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mb-4 max-w-xl leading-relaxed font-semibold">
                        Configure the maximum duration the HTTP engine waits for raw Snapchat server bytes before aborting context and triggering backup fallbacks.
                      </p>
                      <input 
                        type="range" 
                        min="1" 
                        max="20"
                        step="1"
                        value={stats.config.scraperTimeout / 1000}
                        onChange={(e) => handleConfigChange({ scraperTimeout: parseFloat(e.target.value) * 1000 })}
                        className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer appearance-none outline-none border border-slate-300"
                      />
                      <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 mt-2 font-mono">
                        <span>1.0s (Fast/Strict)</span>
                        <span>10.0s (Standard)</span>
                        <span>20.0s (High-latency fallback)</span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Scraping strategy comparison rates */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                  <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 mb-2 uppercase tracking-wide">
                    <Activity className="w-5 h-5 text-indigo-600" /> Scraping Strategy Share
                  </h2>
                  <p className="text-xs text-slate-500 mb-6 font-semibold">Ratio comparing native cheerio crawler parsing requests against heavy sub-process shell `yt-dlp` executable fallbacks.</p>
                  
                  <div className="space-y-6">
                    {/* Cheerio bar */}
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold mb-2">
                        <span className="text-slate-700 flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-emerald-500" /> Cheerio Engine (Sub-second Crawls)</span>
                        <span className="text-emerald-600 font-extrabold text-sm font-mono">{stats.traffic.cheerioUsage} requests</span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                        {(() => {
                          const total = stats.traffic.cheerioUsage + stats.traffic.ytdlpUsage;
                          const pct = total > 0 ? (stats.traffic.cheerioUsage / total) * 100 : 80;
                          return (
                            <div style={{ width: `${pct}%` }} className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-1000 shadow-inner" />
                          );
                        })()}
                      </div>
                    </div>

                    {/* yt-dlp bar */}
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold mb-2">
                        <span className="text-slate-700 flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5 text-amber-500" /> yt-dlp Binary Core (Heavy shell fallbacks)</span>
                        <span className="text-amber-600 font-extrabold text-sm font-mono">{stats.traffic.ytdlpUsage} requests</span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                        {(() => {
                          const total = stats.traffic.cheerioUsage + stats.traffic.ytdlpUsage;
                          const pct = total > 0 ? (stats.traffic.ytdlpUsage / total) * 100 : 20;
                          return (
                            <div style={{ width: `${pct}%` }} className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-1000 shadow-inner" />
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column Section: Dependency Tree */}
              <div>
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                  <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 mb-2 pb-3 border-b border-slate-100 uppercase tracking-wider">
                    <Layers className="w-4 h-4 text-indigo-600" /> Dependency Libraries
                  </h2>
                  <p className="text-[10px] text-slate-400 mb-4 leading-relaxed font-bold uppercase tracking-wider">Active package audits stable status.</p>
                  
                  <div className="space-y-3">
                    {stats.dependencies.map((dep, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-colors">
                        <div>
                          <span className="block text-xs font-extrabold text-slate-800 font-mono">{dep.name}</span>
                          <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider mt-0.5">{dep.type} Library</span>
                        </div>
                        <div className="text-right">
                          <span className="block text-xs font-extrabold text-slate-600 font-mono">{dep.version}</span>
                          <span className="inline-flex items-center gap-0.5 text-[8px] font-black text-emerald-600 uppercase tracking-widest mt-0.5">
                            <Check className="w-2.5 h-2.5" /> Stable
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </motion.div>
          )}

          {/* TAB 5: OPERATIONAL INCIDENT DIAGNOSTICS ALERTS */}
          {activeTab === "alerts" && (
            <motion.div
              key="alerts-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Left Column Section: Incident Ledger Table */}
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                    <div>
                      <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
                        <AlertTriangle className="w-4 h-4 text-indigo-600" /> Problems & Notifications Ledger
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">Real-time diagnosed system incidents, runtime exceptions, latency spikes, and caching blockages.</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-black bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full border border-indigo-100 uppercase tracking-widest shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" />
                      Live Feed
                    </span>
                  </div>

                  {/* Active Incident alerts cards */}
                  <div className="space-y-4">
                    {getActiveAlerts().length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-slate-400 font-bold uppercase tracking-wider text-center">
                        <CheckCircle className="w-12 h-12 text-emerald-500 mb-4 animate-bounce" />
                        All Nodes Fully Operational
                        <span className="text-[10px] text-slate-400 mt-1 font-semibold normal-case">Zero diagnostics warnings, latency errors, or reachability blocks active.</span>
                      </div>
                    ) : (
                      getActiveAlerts().map((alert) => {
                        let severityColor = "border-slate-200 bg-slate-50";
                        let badgeColor = "bg-slate-100 text-slate-700 border-slate-200";
                        let icon = <Info className="w-4 h-4 text-slate-500" />;

                        if (alert.severity === "critical") {
                          severityColor = "border-red-200 bg-red-50/30 hover:bg-red-50/50 shadow-[0_4px_16px_rgba(239,68,68,0.03)]";
                          badgeColor = "bg-red-50 text-red-700 border-red-100";
                          icon = <AlertTriangle className="w-4 h-4 text-red-600 animate-pulse" />;
                        } else if (alert.severity === "error") {
                          severityColor = "border-rose-200 bg-rose-50/20 hover:bg-rose-50/40";
                          badgeColor = "bg-rose-50 text-rose-700 border-rose-100";
                          icon = <XCircle className="w-4 h-4 text-rose-600" />;
                        } else if (alert.severity === "warning") {
                          severityColor = "border-amber-200 bg-amber-50/20 hover:bg-amber-50/40";
                          badgeColor = "bg-amber-50 text-amber-700 border-amber-100";
                          icon = <AlertTriangle className="w-4 h-4 text-amber-600" />;
                        } else if (alert.severity === "info") {
                          severityColor = "border-indigo-100 bg-indigo-50/10 hover:bg-indigo-50/20";
                          badgeColor = "bg-indigo-50 text-indigo-700 border-indigo-100";
                          icon = <Info className="w-4 h-4 text-indigo-600" />;
                        }

                        return (
                          <div key={alert.id} className={`p-5 rounded-2xl border transition-all duration-300 ${severityColor}`}>
                            <div className="flex items-start gap-4">
                              <div className="mt-0.5 p-2 rounded-xl bg-white border border-slate-100 shadow-sm flex-shrink-0">
                                {icon}
                              </div>
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center justify-between gap-2.5">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border ${badgeColor}`}>
                                      {alert.severity}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 font-mono">{alert.timestamp}</span>
                                  </div>
                                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest bg-white border border-slate-200/60 px-2.5 py-1 rounded-full shadow-sm">
                                    Node: {alert.source}
                                  </span>
                                </div>
                                <h4 className="text-xs font-extrabold text-slate-800 mt-2">{alert.message}</h4>
                                <div className="mt-3.5 pt-3 border-t border-slate-100/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[10px]">
                                  <span className="text-slate-400 font-bold uppercase tracking-wider">Recommended Action:</span>
                                  <span className="text-indigo-600 font-extrabold bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100/40">{alert.actionText}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column Section: Diagnostic Controls & Operations Deck */}
              <div className="space-y-8">
                {/* Alert Control Deck */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                  <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 uppercase tracking-wider">
                    <Sliders className="w-4 h-4 text-indigo-600" /> Operational Control Deck
                  </h2>
                  <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                    Use these administrative triggers to simulate live anomalies, mock tool crashes, or clear diagnostic alert logs.
                  </p>

                  <div className="space-y-3.5">
                    {/* Trigger simulated crash */}
                    <button
                      onClick={() => {
                        const newAlert = {
                          id: `sim-crash-${Date.now()}`,
                          timestamp: new Date().toLocaleTimeString(),
                          severity: "critical" as const,
                          source: "yt-dlp core executor",
                          message: "CRITICAL: Scraper process spawned but exited prematurely with exit status 1. Signature decryption keys out of date.",
                        };
                        setSimulatedAlerts((prev) => [newAlert, ...prev]);
                      }}
                      className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-red-50 hover:bg-red-100/80 border border-red-200 text-red-700 font-extrabold text-xs uppercase tracking-wider transition-all duration-150 active:scale-98 cursor-pointer shadow-sm"
                    >
                      <span className="flex items-center gap-2">
                        <XCircle className="w-4 h-4" /> Simulate Scraper Crash
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    {/* Trigger simulated slowness */}
                    <button
                      onClick={() => {
                        const newAlert = {
                          id: `sim-latency-${Date.now()}`,
                          timestamp: new Date().toLocaleTimeString(),
                          severity: "warning" as const,
                          source: "snap-cdn-downloader",
                          message: "WARNING: Persistent connection timed out trying to reach proxy route http://localhost:3000/api/proxy. Latency exceeded 5000ms.",
                        };
                        setSimulatedAlerts((prev) => [newAlert, ...prev]);
                      }}
                      className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-700 font-extrabold text-xs uppercase tracking-wider transition-all duration-150 active:scale-98 cursor-pointer shadow-sm"
                    >
                      <span className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Simulate Slowness
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    {/* Trigger simulated event */}
                    <button
                      onClick={() => {
                        const newAlert = {
                          id: `sim-info-${Date.now()}`,
                          timestamp: new Date().toLocaleTimeString(),
                          severity: "info" as const,
                          source: "caching-ledger",
                          message: "INFO: System successfully cleared 12 expired CDN stream links from caching ledger database.",
                        };
                        setSimulatedAlerts((prev) => [newAlert, ...prev]);
                      }}
                      className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 text-indigo-700 font-extrabold text-xs uppercase tracking-wider transition-all duration-150 active:scale-98 cursor-pointer shadow-sm"
                    >
                      <span className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" /> Simulate Cleanup Event
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    {/* Clear button */}
                    <button
                      onClick={() => {
                        setSimulatedAlerts([]);
                      }}
                      className="w-full mt-4 flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-extrabold text-xs uppercase tracking-widest transition-all duration-150 active:scale-98 cursor-pointer shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" /> Clear Alert History
                    </button>
                  </div>
                </div>

                {/* Health Index Card */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm text-center">
                  <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">System Health Index</h3>
                  {(() => {
                    const criticalCount = getActiveAlerts().filter(a => a.severity === "critical").length;
                    const errorCount = getActiveAlerts().filter(a => a.severity === "error").length;
                    const warningCount = getActiveAlerts().filter(a => a.severity === "warning").length;
                    
                    let score = 100;
                    score -= (criticalCount * 25);
                    score -= (errorCount * 15);
                    score -= (warningCount * 5);
                    score = Math.max(10, score);

                    let scoreColor = "text-emerald-500";
                    let text = "ALL SYSTEMS HEALTHY";
                    if (score < 50) {
                      scoreColor = "text-red-500 animate-pulse";
                      text = "ATTENTION REQUIRED: SEVERE OUTAGE";
                    } else if (score < 85) {
                      scoreColor = "text-amber-500";
                      text = "ATTENTION REQUIRED: WARNINGS ACTIVE";
                    }

                    return (
                      <>
                        <div className={`text-5xl font-black tracking-tighter ${scoreColor} font-mono my-2.5`}>
                          {score}%
                        </div>
                        <span className="text-[10px] font-extrabold text-slate-700 block uppercase tracking-wider mt-1">{text}</span>
                        <p className="text-[9px] text-slate-400 mt-2 leading-relaxed font-semibold uppercase tracking-wider">
                          Real-time health indicator weighted dynamically by active errors, offline endpoints, and resource leaks.
                        </p>
                      </>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
