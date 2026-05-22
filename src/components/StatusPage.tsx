import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Server,
  Zap,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ToolStatus {
  id: string;
  name: string;
  status: "operational" | "slow" | "offline";
  avgLatency: number;
}

interface SystemAlert {
  id: string;
  timestamp: string;      
  timestampDate: string;  
  type: "info" | "warning" | "error";
  tool: string;           
  message: string;
}

interface StatusData {
  success: boolean;
  systemStatus: "operational" | "degraded" | "outage";
  snapchatReachable: boolean;
  uptime: number;
  tools: ToolStatus[];
  alerts: SystemAlert[];
}

export default function StatusPage({ passcode }: { passcode: string }) {
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const response = await fetch("/api/admin/status", {
        headers: { "x-admin-passcode": passcode }
      });
      if (!response.ok) throw new Error("Failed to fetch status");
      const data = await response.json();
      setStatusData(data);
      setLastRefreshed(new Date());
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const getSystemStatusConfig = (status?: string) => {
    switch (status) {
      case "operational":
        return { label: "All Systems Operational", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", icon: <ShieldCheck className="w-8 h-8 text-emerald-500" /> };
      case "degraded":
        return { label: "Degraded Performance", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", icon: <AlertTriangle className="w-8 h-8 text-amber-500" /> };
      case "outage":
        return { label: "System Outage", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200", icon: <XCircle className="w-8 h-8 text-rose-500" /> };
      default:
        return { label: "Checking Status...", color: "text-gray-500", bg: "bg-gray-50", border: "border-gray-200", icon: <Activity className="w-8 h-8 text-gray-400" /> };
    }
  };

  const getToolStatusConfig = (status: string) => {
    switch (status) {
      case "operational":
        return { color: "text-emerald-600", dot: "bg-emerald-500", icon: <CheckCircle className="w-5 h-5 text-emerald-500" /> };
      case "slow":
        return { color: "text-amber-600", dot: "bg-amber-500", icon: <Clock className="w-5 h-5 text-amber-500" /> };
      case "offline":
        return { color: "text-rose-600", dot: "bg-rose-500", icon: <XCircle className="w-5 h-5 text-rose-500" /> };
      default:
        return { color: "text-gray-400", dot: "bg-gray-400", icon: <Activity className="w-5 h-5 text-gray-400" /> };
    }
  };

  const systemConfig = getSystemStatusConfig(statusData?.systemStatus);

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600*24));
    const h = Math.floor(seconds % (3600*24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    return `${d > 0 ? d + 'd ' : ''}${h}h ${m}m`;
  };

  return (
    <div className="py-6">

      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header & Pulse Indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">System Status</h1>
            <p className="text-gray-500 mt-1">Real-time diagnostics and performance monitoring</p>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-sm font-semibold text-gray-600 tracking-wide uppercase">Live Syncing</span>
          </div>
        </div>

        {loading && !statusData ? (
          <div className="flex justify-center items-center py-24">
            <Activity className="w-8 h-8 text-snap-brand animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-rose-700">Unable to load status</h3>
            <p className="text-rose-600 mt-1">{error}</p>
          </div>
        ) : statusData && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Global Banner */}
            <div className={`${systemConfig.bg} ${systemConfig.border} border-2 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-6 transition-colors duration-500 shadow-sm`}>
              <div className="bg-white p-4 rounded-full shadow-sm">
                {systemConfig.icon}
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className={`text-3xl font-black ${systemConfig.color} mb-1`}>
                  {systemConfig.label}
                </h2>
                <p className="text-gray-600 font-medium">
                  {statusData.systemStatus === 'operational' 
                    ? "All tools are running smoothly. No issues reported."
                    : statusData.systemStatus === 'degraded'
                    ? "Some tools are experiencing slower than usual performance or isolated issues."
                    : "We are currently experiencing a system-wide outage. Our team is investigating."}
                </p>
              </div>
              <div className="bg-white px-5 py-3 rounded-xl border border-gray-200 text-center md:text-right flex-shrink-0 shadow-sm">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Server Uptime</p>
                <p className="text-lg font-black text-gray-900">{formatUptime(statusData.uptime)}</p>
              </div>
            </div>

            {/* Tools Grid */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Server className="w-5 h-5 text-gray-400" />
                Service Health
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {statusData.tools.map((tool) => {
                  const tConfig = getToolStatusConfig(tool.status);
                  return (
                    <motion.div 
                      key={tool.id} 
                      layout
                      className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className="font-bold text-gray-900 text-lg">{tool.name}</span>
                        {tConfig.icon}
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Status</p>
                          <span className={`font-bold capitalize ${tConfig.color}`}>
                            {tool.status}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Avg Latency</p>
                          <span className="font-mono font-bold text-gray-900 flex items-center gap-1">
                            <Zap className="w-3.5 h-3.5 text-yellow-500" />
                            {tool.avgLatency}ms
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Incident Log Timeline */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-gray-400" />
                Recent Incidents & System Logs
              </h3>
              
              <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
                {statusData.alerts.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No recent incidents. System is completely healthy.</p>
                  </div>
                ) : (
                  <div className="relative border-l-2 border-gray-100 ml-4 md:ml-6 space-y-8 pb-4">
                    <AnimatePresence>
                      {statusData.alerts.map((alert) => (
                        <motion.div 
                          key={alert.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="relative pl-6 md:pl-8"
                        >
                          <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 border-white ${
                            alert.type === 'error' ? 'bg-rose-500' :
                            alert.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                          }`} />
                          
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                                alert.type === 'error' ? 'bg-rose-100 text-rose-700' :
                                alert.type === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {alert.tool}
                              </span>
                            </div>
                            <span className="text-sm font-mono text-gray-400 font-semibold bg-gray-50 px-2 py-1 rounded">
                              {alert.timestampDate} • {alert.timestamp}
                            </span>
                          </div>
                          <p className="text-gray-700 font-medium leading-relaxed">
                            {alert.message}
                          </p>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>

            <p className="text-center text-sm text-gray-400 font-medium pt-8">
              Last updated: {lastRefreshed.toLocaleTimeString()}
            </p>

          </motion.div>
        )}
      </div>
    </div>
  );
}
