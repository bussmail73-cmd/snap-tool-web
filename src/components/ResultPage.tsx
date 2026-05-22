import React, { useState, useRef, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  Download, Play, Pause, Volume2, VolumeX, 
  RotateCcw, RotateCw, ChevronDown, Check, 
  ArrowLeft, User, ShieldCheck, CheckCircle2,
  Video, ExternalLink, Lock, Users, Grid3x3, Star, BarChart3, Search, TrendingUp, FileJson, File
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Helmet } from "react-helmet-async";
import ToolsGrid from "./ToolsGrid";
import { TOOLS } from "../constants";

interface VideoData {
  success: boolean;
  videoUrl?: string;
  downloadUrl?: string;
  title: string;
  thumbnail: string;
  profilePicture?: string;
  duration?: string;
  uploader: string;
  username?: string;
  displayName?: string;
  stories?: any[];
  profileUrl?: string;
  stats?: {
    subscribers?: number;
    stories?: number;
    highlights?: number;
    spotlights?: number;
    consistency?: number;
    engagement?: number;
    contentMix?: number;
    growthRate?: number;
  };
  score?: number;
}

const getProxiedUrl = (url: string | undefined, username: string = "snap"): string => {
  if (!url) return "";
  if (url.startsWith("/")) return url;
  if (url.includes("sc-cdn.net") || url.includes("snapchat.com")) {
    if (!url.includes("deeplink/snapcode")) {
      return `/api/dp-proxy?url=${encodeURIComponent(url)}&username=${username}`;
    }
  }
  return url;
};

export default function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const resultData = location.state?.result as VideoData;
  const toolId = location.state?.toolId as string;

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedQuality, setSelectedQuality] = useState("1080p");
  const [isQualityOpen, setIsQualityOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedExportFormat, setSelectedExportFormat] = useState("PDF");
  const [isExporting, setIsExporting] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [bulkVideoType, setBulkVideoType] = useState<'spotlights' | 'highlights'>('spotlights');
  const [videosPerPage] = useState(6);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleSpotlights, setVisibleSpotlights] = useState(10);
  const [visibleHighlights, setVisibleHighlights] = useState(10);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [downloadingIds, setDownloadingIds] = useState<Record<string, boolean>>({});

  const profileStats = resultData?.stats || {};
  const totalViews = (profileStats as any).totalViews;
  const hashtags = useMemo(() => resultData?.title?.match(/#[a-zA-Z0-9_]+/g) || [], [resultData?.title]);
  const cleanTitle = useMemo(() => resultData?.title?.replace(/#[a-zA-Z0-9_]+/g, "").trim() || "", [resultData?.title]);
  const hasProfileScore = typeof resultData?.score === "number";
  const hasStories = useMemo(() => Array.isArray(resultData?.stories) && resultData.stories.length > 0, [resultData?.stories]);
  const activeStory = useMemo(
    () => selectedStory || (hasStories ? resultData?.stories![0] : null),
    [selectedStory, hasStories, resultData?.stories]
  );
  const previewUrl = useMemo(
    () => (hasStories ? activeStory?.url || activeStory?.thumbnail : resultData?.videoUrl),
    [hasStories, activeStory, resultData?.videoUrl, resultData?.thumbnail]
  );
  const previewIsVideo = useMemo(
    () => (hasStories ? activeStory?.type === "video" : Boolean(resultData?.videoUrl)),
    [hasStories, activeStory, resultData?.videoUrl]
  );
  const previewTitle = useMemo(
    () => (hasStories ? activeStory?.title || `Story ${resultData?.stories?.findIndex((item) => item === activeStory) + 1}` : cleanTitle),
    [hasStories, activeStory, cleanTitle, resultData?.stories]
  );

  useEffect(() => {
    if (!resultData) {
      navigate("/");
      return;
    }

    if (resultData.stories && resultData.stories.length > 0 && !selectedStory) {
      setSelectedStory(resultData.stories[0]);
    }
  }, [resultData, navigate, selectedStory]);

  if (!resultData) return null;

  const handleGoBack = () => {
    navigate(-1);
  };

  const profileHandle = useMemo(() => {
    if (resultData?.username?.trim()) {
      return resultData.username.trim();
    }
    // For spotlight/download results, uploader might be a full name or username
    if (resultData?.uploader?.trim()) {
      const uploader = resultData.uploader.trim();
      // If it looks like a username (short, no spaces, alphanumeric with dots/underscores)
      if (/^[a-zA-Z0-9._]{3,30}$/.test(uploader)) {
        return uploader;
      }
      // Otherwise, extract first word or use as-is if it's not too long
      const firstWord = uploader.split(/[\s@]/)[0].trim();
      if (firstWord && firstWord.length >= 2) {
        return firstWord;
      }
    }
    if (resultData?.profileUrl) {
      const parts = resultData.profileUrl.split("/").filter(Boolean);
      return parts[parts.length - 1] || "";
    }
    return "";
  }, [resultData?.username, resultData?.profileUrl, resultData?.uploader]);

  const profileDisplayName = useMemo(() => {
    const rawDisplayName = resultData?.displayName?.trim() || resultData?.uploader?.trim() || "";
    
    // Ignore generic/corporate placeholders
    const isGeneric = 
      !rawDisplayName || 
      rawDisplayName.toLowerCase() === "snapchat" || 
      rawDisplayName.toLowerCase() === "snapchat user" || 
      rawDisplayName.toLowerCase() === "snapchat spotlight";
      
    if (isGeneric) {
      if (profileHandle && profileHandle.toLowerCase() !== "snapchat") {
        return profileHandle.charAt(0).toUpperCase() + profileHandle.slice(1);
      }
      return "Snapchat User";
    }
    
    return rawDisplayName;
  }, [profileHandle, resultData?.displayName, resultData?.uploader]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(p);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const time = (parseFloat(e.target.value) / 100) * videoRef.current.duration;
      videoRef.current.currentTime = time;
      setProgress(parseFloat(e.target.value));
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const handleExport = (format: string) => {
    setIsExporting(true);
    const timestamp = new Date().toLocaleDateString('ur-PK').replace(/\//g, '-');
    const filename = `${resultData?.uploader || resultData?.displayName || 'profile'}-profile-${timestamp}`;
    
    const exportData = {
      website: 'Getinbex',
      websiteUrl: 'https://getinbex.com',
      profile: profileDisplayName,
      username: profileHandle,
      exportDate: new Date().toLocaleString('ur-PK'),
      stats: {
        subscribers: formatNumber(profileStats?.subscribers),
        stories: formatNumber(profileStats?.stories),
        highlights: formatNumber(profileStats?.highlights),
        spotlights: formatNumber(profileStats?.spotlights),
        totalViews: totalViews !== undefined && totalViews !== null ? formatNumber(totalViews) : 'Not publicly available'
      }
    };

    const createDownloadLink = (href: string, downloadName: string) => {
      const element = document.createElement('a');
      element.href = href;
      element.download = downloadName;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    };

    if (format === 'PNG') {
      if (resultData.thumbnail) {
        createDownloadLink(resultData.thumbnail, `${filename}.png`);
      }
    } else if (format === 'PDF') {
      const pdfContent = `\
╔═══════════════════════════════════════════════════════════════════════╗
║                   GETINBEX PROFILE REPORT                            ║
║                    Snapchat Profile Analysis                         ║
╚═══════════════════════════════════════════════════════════════════════╝

PROFILE INFORMATION
─────────────────────────────────────────────────────────────────────────
Profile Name        @${exportData.profile}
Username            ${exportData.username}
Platform            Snapchat
Account Status      Public Profile ✓

PROFILE STATISTICS
─────────────────────────────────────────────────────────────────────────
Subscribers:        ${exportData.stats.subscribers}
Stories:            ${exportData.stats.stories}
Highlights:         ${exportData.stats.highlights}
Spotlights:         ${exportData.stats.spotlights}
Total Views:        ${exportData.stats.totalViews}

${resultData.score ? `STRATEGY ANALYSIS
─────────────────────────────────────────────────────────────────────────
Overall Score:      ${resultData.score} / 100
Consistency:        ${profileStats?.consistency || 0}%
Engagement:         ${profileStats?.engagement || 0}%
Content Mix:        ${profileStats?.contentMix || 0}%
Growth Rate:        ${profileStats?.growthRate || 0}%

` : ''}EXPORT INFORMATION
─────────────────────────────────────────────────────────────────────────
Exported Date:      ${exportData.exportDate}
Export Tool:        Getinbex Profile Viewer
Export Format:      PDF Document
Website:            ${exportData.websiteUrl}

DISCLAIMER
─────────────────────────────────────────────────────────────────────────
This report contains information obtained from PUBLIC Snapchat profiles.
All data represents publicly available information as of the export date.

This tool is provided for EDUCATIONAL and INFORMATIONAL purposes only.
For inquiries, visit: ${exportData.websiteUrl}

╔═══════════════════════════════════════════════════════════════════════╗
║ © 2026 Getinbex | Not affiliated with Snapchat Inc.                 ║
╚═══════════════════════════════════════════════════════════════╝\
`;
      createDownloadLink('data:text/plain;charset=utf-8,' + encodeURIComponent(pdfContent), `${filename}.pdf`);
    } else if (format === 'JSON') {
      const jsonData = {
        meta: {
          source: 'Getinbex Profile Viewer',
          website: exportData.websiteUrl,
          version: '1.0',
          exportedAt: exportData.exportDate
        },
        profile: {
          name: exportData.profile,
          username: exportData.username,
          platform: 'Snapchat',
          status: 'Public Profile'
        },
        statistics: exportData.stats,
        analysis: resultData.score ? {
          overallScore: resultData.score,
          consistency: profileStats?.consistency,
          engagement: profileStats?.engagement,
          contentMix: profileStats?.contentMix,
          growthRate: profileStats?.growthRate
        } : null,
        disclaimer: 'This data is exported from public Snapchat profiles for educational purposes only. Not affiliated with Snapchat Inc.'
      };
      createDownloadLink('data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(jsonData, null, 2)), `${filename}.json`);
    } else if (format === 'Excel') {
      const csvRows = [
        ['Field', 'Value'],
        ['Profile', exportData.profile],
        ['Username', exportData.username],
        ['Platform', 'Snapchat'],
        ['Subscribers', exportData.stats.subscribers],
        ['Stories', exportData.stats.stories],
        ['Highlights', exportData.stats.highlights],
        ['Spotlights', exportData.stats.spotlights],
        ['Total Views', exportData.stats.totalViews],
        ['Exported At', exportData.exportDate]
      ];
      const csvContent = csvRows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\r\n');
      createDownloadLink('data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent), `${filename}.csv`);
    }

    setIsExporting(false);
  };

  const formatNumber = (value: number | undefined | null) =>
    value !== undefined && value !== null && value !== -1 ? value.toLocaleString() : '—';

  const handleDownload = async (videoId: string, downloadUrl: string, filename: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (downloadingIds[videoId]) return;
    
    // Set loading state to show spinning micro-animation
    setDownloadingIds(prev => ({ ...prev, [videoId]: true }));
    
    // Ultra fast native streaming trigger
    // Instead of downloading the whole blob into JS memory, we instantly redirect the browser to the file stream.
    // This starts the download immediately in the browser's download manager with 0.0 seconds latency!
    try {
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download trigger error:", error);
      window.open(downloadUrl, "_blank");
    }

    // Keep the "Downloading..." micro-animation active for a clean 2 seconds to provide solid interactive confirmation
    setTimeout(() => {
      setDownloadingIds(prev => ({ ...prev, [videoId]: false }));
    }, 2000);
  };

  // Bulk Video Downloader View
  if (toolId === 'video-downloader') {
    const allVideos = resultData.stories && resultData.stories.length > 0 ? resultData.stories : [];
    const spotlightVideos = allVideos.filter((s: any) => s.type === 'spotlight');
    const highlightVideos = allVideos.filter((s: any) => s.type === 'highlight');

    const spotlightDisplay = spotlightVideos.slice(0, visibleSpotlights);
    const highlightDisplay = highlightVideos.slice(0, visibleHighlights);

    const hasMoreSpotlights = visibleSpotlights < spotlightVideos.length;
    const hasMoreHighlights = visibleHighlights < highlightVideos.length;

    return (
      <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8">
        <Helmet>
          <title>{resultData?.uploader || resultData?.displayName || 'Snapchat'} - Snapchat Result | Getinbex</title>
          <meta name="robots" content="noindex" />
        </Helmet>

        <div className="max-w-7xl mx-auto px-4 md:px-8">
          {/* Navigation & Header */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 mb-10"
          >
            <button 
              onClick={handleGoBack}
              className="flex items-center justify-center gap-2 bg-gray-900 text-white hover:bg-gray-800 px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg hover:shadow-xl active:scale-95 group min-w-[140px]"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back
            </button>
            
            <button 
              onClick={handleGoBack}
              className="flex items-center justify-center gap-2 bg-white text-gray-900 border-2 border-gray-900 hover:bg-gray-50 px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-md hover:shadow-lg active:scale-95 min-w-[140px]"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>
          </motion.div>

          {/* Centered Profile Card */}
          <div className="flex flex-col items-center justify-center mb-2 mt-1">
            <div className="text-center flex flex-col items-center gap-3">
              {resultData.thumbnail && (
                <div className="w-20 h-20 rounded-full border-4 border-white bg-white overflow-hidden shadow-md flex items-center justify-center">
                  <img
                    src={getProxiedUrl(resultData.thumbnail, resultData.username || profileHandle)}
                    alt={profileDisplayName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://app.snapchat.com/web/deeplink/snapcode?username=${profileHandle}&type=SVG&bitmoji=enable`;
                    }}
                  />
                </div>
              )}
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                {profileDisplayName}
              </h2>
              {profileHandle && (
                <span className="bg-yellow-100 text-yellow-800 border border-yellow-200 text-sm font-extrabold px-4 py-1.5 rounded-full shadow-sm tracking-wide">
                  @{profileHandle}
                </span>
              )}
            </div>
          </div>

          {/* Dotted Line Divider */}
          <div className="w-full max-w-xl mx-auto my-6 border-b-2 border-dotted border-gray-300" />

          {/* No Videos Found */}
          {allVideos.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-150 shadow-sm mb-12">
              <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-2">No public videos found</p>
              <p className="text-gray-500">This account has <strong>0</strong> public Spotlights or Highlights.</p>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Stats Counters */}
              <div className="text-center font-bold text-gray-500 text-sm md:text-base mb-6">
                {spotlightVideos.length} Spotlight Videos • {highlightVideos.length} Highlight Videos
              </div>

              {/* Tab Selector Buttons */}
              <div className="flex justify-center items-center gap-4 mb-10">
                <button
                  onClick={() => setBulkVideoType('spotlights')}
                  className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-sm cursor-pointer ${
                    bulkVideoType === 'spotlights'
                      ? 'bg-yellow-300 text-black border-2 border-yellow-400 shadow-md font-extrabold'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  Spotlight Videos
                </button>
                <button
                  onClick={() => setBulkVideoType('highlights')}
                  className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-sm cursor-pointer ${
                    bulkVideoType === 'highlights'
                      ? 'bg-yellow-300 text-black border-2 border-yellow-400 shadow-md font-extrabold'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  Highlight Videos
                </button>
              </div>

              {/* Video Grid Section */}
              <div>
                {bulkVideoType === 'spotlights' ? (
                  <div>
                    <div className="flex items-center justify-between mb-8 pb-3 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-3.5 h-7 rounded-full bg-gradient-to-b from-yellow-400 to-amber-500" />
                        <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Spotlight Videos</h2>
                      </div>
                      <span className="bg-gray-100 text-gray-600 font-bold px-3.5 py-1.5 rounded-full text-xs">
                        {spotlightVideos.length} Available
                      </span>
                    </div>

                    {spotlightVideos.length === 0 ? (
                      <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-inner">
                        <Video className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-semibold">No public Spotlights found for this profile</p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6 justify-center">
                          {spotlightDisplay.map((video: any, index: number) => (
                            <div key={`spotlight-${video.id || index}`} className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col group max-w-[300px] mx-auto w-full">
                              {/* Grid portrait preview */}
                              <div className="relative bg-black aspect-[9/16] overflow-hidden rounded-[1.8rem] m-2 shadow-inner">
                                {activeVideoId === video.id ? (
                                  <video
                                    src={video.videoUrl?.startsWith('http') ? `/api/proxy?url=${encodeURIComponent(video.videoUrl)}` : video.videoUrl || video.url}
                                    controls
                                    autoPlay
                                    playsInline
                                    className="w-full h-full object-cover rounded-[1.8rem]"
                                  />
                                ) : (
                                  <div 
                                    onClick={() => setActiveVideoId(video.id)}
                                    className="relative w-full h-full cursor-pointer group"
                                  >
                                    <img
                                      src={getProxiedUrl(video.thumbnail || video.url, resultData.username || profileHandle)}
                                      alt={video.title}
                                      className="w-full h-full object-cover rounded-[1.8rem] group-hover:scale-105 transition-transform duration-500"
                                      referrerPolicy="no-referrer"
                                      loading="lazy"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = `https://via.placeholder.com/200x360?text=${encodeURIComponent(video.title || 'Video')}`;
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-black/35 group-hover:bg-black/45 transition-colors flex items-center justify-center rounded-[1.8rem]">
                                      <div className="w-12 h-12 rounded-full bg-white/95 text-black shadow-2xl flex items-center justify-center transform group-hover:scale-110 active:scale-90 transition-all duration-300">
                                        <Play className="w-6 h-6 fill-black translate-x-0.5" />
                                      </div>
                                    </div>
                                    {video.duration && (
                                      <div className="absolute bottom-3 right-3 bg-black/75 text-white text-[10px] font-bold px-2 py-1 rounded-md tracking-wider">
                                        {video.duration}s
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="p-4 pt-1 flex flex-col justify-between flex-1">
                                <h3 className="font-bold text-gray-800 text-xs mb-3 line-clamp-2 h-8 leading-snug">
                                  {video.title || `Spotlight Video`}
                                </h3>
                                <button
                                  onClick={(e) => handleDownload(
                                    video.id,
                                    video.downloadUrl || `/api/proxy?url=${encodeURIComponent(video.videoUrl)}&filename=${encodeURIComponent(video.title || 'spotlight')}.mp4`,
                                    `${(video.title || `spotlight-${index}`).replace(/[^a-z0-9]/gi, '_')}.mp4`,
                                    e
                                  )}
                                  disabled={downloadingIds[video.id]}
                                  className={`w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all shadow-sm active:scale-[0.98] cursor-pointer hover:shadow-md text-center select-none ${
                                    downloadingIds[video.id]
                                      ? 'bg-amber-200 text-amber-800 cursor-not-allowed'
                                      : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-black'
                                  }`}
                                >
                                  {downloadingIds[video.id] ? (
                                    <>
                                      <svg className="animate-spin h-3.5 w-3.5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                      Downloading...
                                    </>
                                  ) : (
                                    <>
                                      <Download className="w-4 h-4" />
                                      Download Video
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {hasMoreSpotlights && (
                          <div className="flex justify-center mt-10">
                            <button
                              onClick={() => setVisibleSpotlights(prev => prev + 10)}
                              className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm shadow-md hover:shadow-xl active:scale-95 transition-all cursor-pointer"
                            >
                              Show More ({spotlightVideos.length - visibleSpotlights} remaining / {spotlightVideos.length} total)
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-8 pb-3 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-3.5 h-7 rounded-full bg-gradient-to-b from-blue-500 to-indigo-600" />
                        <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Highlight Videos</h2>
                      </div>
                      <span className="bg-gray-100 text-gray-600 font-bold px-3.5 py-1.5 rounded-full text-xs">
                        {highlightVideos.length} Available
                      </span>
                    </div>

                    {highlightVideos.length === 0 ? (
                      <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-inner">
                        <Video className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-semibold">No public Highlights found for this profile</p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6 justify-center">
                          {highlightDisplay.map((video: any, index: number) => (
                            <div key={`highlight-${video.id || index}`} className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col group max-w-[300px] mx-auto w-full">
                              {/* Grid portrait preview */}
                              <div className="relative bg-black aspect-[9/16] overflow-hidden rounded-[1.8rem] m-2 shadow-inner">
                                {activeVideoId === video.id ? (
                                  <video
                                    src={video.videoUrl?.startsWith('http') ? `/api/proxy?url=${encodeURIComponent(video.videoUrl)}` : video.videoUrl || video.url}
                                    controls
                                    autoPlay
                                    playsInline
                                    className="w-full h-full object-cover rounded-[1.8rem]"
                                  />
                                ) : (
                                  <div 
                                    onClick={() => setActiveVideoId(video.id)}
                                    className="relative w-full h-full cursor-pointer group"
                                  >
                                    <img
                                      src={getProxiedUrl(video.thumbnail || video.url, resultData.username || profileHandle)}
                                      alt={video.title}
                                      className="w-full h-full object-cover rounded-[1.8rem] group-hover:scale-105 transition-transform duration-500"
                                      referrerPolicy="no-referrer"
                                      loading="lazy"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = `https://via.placeholder.com/200x360?text=${encodeURIComponent(video.title || 'Video')}`;
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-black/35 group-hover:bg-black/45 transition-colors flex items-center justify-center rounded-[1.8rem]">
                                      <div className="w-12 h-12 rounded-full bg-white/95 text-black shadow-2xl flex items-center justify-center transform group-hover:scale-110 active:scale-90 transition-all duration-300">
                                        <Play className="w-6 h-6 fill-black translate-x-0.5" />
                                      </div>
                                    </div>
                                    {video.duration && (
                                      <div className="absolute bottom-3 right-3 bg-black/75 text-white text-[10px] font-bold px-2 py-1 rounded-md tracking-wider">
                                        {video.duration}s
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="p-4 pt-1 flex flex-col justify-between flex-1">
                                <h3 className="font-bold text-gray-800 text-xs mb-3 line-clamp-2 h-8 leading-snug">
                                  {video.title || `Highlight Video`}
                                </h3>
                                <button
                                  onClick={(e) => handleDownload(
                                    video.id,
                                    video.downloadUrl || `/api/proxy?url=${encodeURIComponent(video.videoUrl)}&filename=${encodeURIComponent(video.title || 'highlight')}.mp4`,
                                    `${(video.title || `highlight-${index}`).replace(/[^a-z0-9]/gi, '_')}.mp4`,
                                    e
                                  )}
                                  disabled={downloadingIds[video.id]}
                                  className={`w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all shadow-sm active:scale-[0.98] cursor-pointer hover:shadow-md text-center select-none ${
                                    downloadingIds[video.id]
                                      ? 'bg-amber-200 text-amber-800 cursor-not-allowed'
                                      : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-black'
                                  }`}
                                >
                                  {downloadingIds[video.id] ? (
                                    <>
                                      <svg className="animate-spin h-3.5 w-3.5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                      Downloading...
                                    </>
                                  ) : (
                                    <>
                                      <Download className="w-4 h-4" />
                                      Download Video
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {hasMoreHighlights && (
                          <div className="flex justify-center mt-10">
                            <button
                              onClick={() => setVisibleHighlights(prev => prev + 10)}
                              className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm shadow-md hover:shadow-xl active:scale-95 transition-all cursor-pointer"
                            >
                              Show More ({highlightVideos.length - visibleHighlights} remaining / {highlightVideos.length} total)
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <ToolsGrid />
      </div>
    );
  }

  if (toolId === 'profile-viewer') {
    return (
      <div className="min-h-screen bg-white">
        <Helmet>
          <title>{profileDisplayName} | Getinbex Profile Viewer</title>
          <meta name="description" content={`View profile details for ${profileDisplayName}. Subscribers, stories, highlights, spotlights on Getinbex.`} />
          <meta name="robots" content="noindex, nofollow" />
          <meta property="og:title" content={`${profileDisplayName} | Getinbex`} />
          <meta property="og:description" content={`Snapchat profile: ${profileDisplayName}. Subscribers: ${formatNumber(resultData.stats?.subscribers)}, Stories: ${formatNumber(resultData.stats?.stories)}`} />
          <meta property="og:type" content="website" />
          <meta name="twitter:card" content="summary" />
          <meta name="twitter:title" content={`${resultData?.uploader || resultData?.displayName || 'Snapchat'} Profile | Getinbex`} />
          <meta name="twitter:description" content={`Profile details for @${profileHandle || profileDisplayName}`} />
          <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            "name": `${profileDisplayName} Profile`,
            "url": resultData.profileUrl || `https://www.snapchat.com/add/${profileHandle}`,
            "mainEntity": {
              "@type": "Person",
              "name": profileDisplayName,
              "alternateName": profileHandle,
              "image": resultData.thumbnail
            }
          })}
          </script>
        </Helmet>

        <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start justify-center">
            {/* Left Side: Back & Try Again Buttons */}
            <div className="w-full lg:w-auto flex flex-col gap-3">
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-3"
              >
                <button 
                  onClick={handleGoBack}
                  className="flex items-center gap-2 bg-gray-900 text-white hover:bg-gray-800 px-5 py-2.5 rounded-lg font-semibold text-xs md:text-sm transition-all shadow-md hover:shadow-lg active:scale-95 group w-full lg:w-auto justify-center"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  Back
                </button>
                
                <button 
                  onClick={handleGoBack}
                  className="flex items-center gap-2 bg-white text-gray-900 border-2 border-gray-900 hover:bg-gray-50 px-5 py-2.5 rounded-lg font-semibold text-xs md:text-sm transition-all shadow-md hover:shadow-lg active:scale-95 w-full lg:w-auto justify-center"
                >
                  <RotateCcw className="w-4 h-4" />
                  Try Again
                </button>
              </motion.div>
            </div>

            {/* Right Side: Profile Card - Wider */}
            <div className="flex-1 w-full">
                {/* Result Card */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm"
                >
            {/* Yellow Header Section */}
            <div className="bg-yellow-300 px-5 py-5.5 flex gap-4 items-start">
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-yellow-100 border-4 border-white overflow-hidden flex items-center justify-center shadow-sm">
                {resultData.thumbnail ? (
                  <img
                    src={getProxiedUrl(resultData.thumbnail, resultData.username || profileHandle)}
                    alt={`${profileDisplayName} profile`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User className="w-9 h-9 text-gray-400 opacity-60" />
                )}
              </div>

              <div className="flex-1 pt-0.5">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-base font-bold text-black">{profileDisplayName}</span>
                  <div className="w-4.5 h-4.5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>
                {profileHandle && (
                  <div className="text-xs text-gray-600 mb-2.5 font-normal">@{profileHandle} · Snapchat</div>
                )}
                <div className="inline-flex items-center gap-1 bg-white border-2 border-yellow-400 rounded-full px-2.5 py-1 text-xs font-semibold text-black">
                  <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Public Profile
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-5 border-b border-gray-100 bg-white">
              {[
                { 
                  label: 'Subscribers', 
                  value: formatNumber(profileStats?.subscribers),
                  icon: <Users className="w-4 h-4" />
                },
                { 
                  label: 'Stories', 
                  value: formatNumber(profileStats?.stories),
                  icon: <Play className="w-4 h-4" />
                },
                { 
                  label: 'Highlights', 
                  value: formatNumber(profileStats?.highlights),
                  icon: <Grid3x3 className="w-4 h-4" />
                },
                { 
                  label: 'Spotlights', 
                  value: formatNumber(profileStats?.spotlights),
                  icon: <Star className="w-4 h-4" />
                },
                { 
                  label: 'Total Views', 
                  value: totalViews !== undefined && totalViews !== null ? formatNumber(totalViews) : '—',
                  icon: <TrendingUp className="w-4 h-4" />
                },
              ].map((stat, idx) => (
                <div 
                  key={stat.label} 
                  className={`flex flex-col items-center justify-center py-3.5 px-2 ${idx !== 4 ? 'border-r border-gray-200' : ''}`}
                >
                  <div className="text-gray-500 mb-1.5 flex items-center justify-center">{stat.icon}</div>
                  <div className="text-base font-bold text-black text-center">{stat.value}</div>
                  <div className="text-xs text-gray-500 font-normal mt-0.5 text-center">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Profile Strategy Score Section */}
            <div className="px-4.5 py-3.5 bg-white">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <BarChart3 className="w-3.5 h-3.5 text-gray-500" />
                  Profile Strategy Score
                </div>
                <div className="bg-yellow-300 border-2 border-yellow-500 rounded-full px-3 py-1 text-sm font-bold text-black">
                  {hasProfileScore ? `${resultData.score} / 100` : 'Pending'}
                </div>
              </div>

              {hasProfileScore && (
                <div className="space-y-2.5">
                  {[
                    { label: 'Consistency', value: profileStats?.consistency ?? 0 },
                    { label: 'Engagement', value: profileStats?.engagement ?? 0 },
                    { label: 'Content mix', value: profileStats?.contentMix ?? 0 },
                    { label: 'Growth rate', value: profileStats?.growthRate ?? 0 },
                  ].map((metric) => (
                    <div key={metric.label} className="grid grid-cols-[90px_1fr_38px] items-center gap-2.5">
                      <div className="text-xs font-medium text-gray-600">{metric.label}</div>
                      <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-yellow-300 transition-all duration-1000" 
                          style={{ width: `${Math.min(100, metric.value)}%` }} 
                        />
                      </div>
                      <div className="text-xs font-semibold text-gray-700 text-right">{metric.value}%</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 px-4.5 py-4.5 bg-white">
              <a
                href={resultData.profileUrl || '#'}
                target="_blank"
                rel="noreferrer"
                className="bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl px-0 py-2.5 text-xs font-semibold text-gray-600 flex items-center justify-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View Profile
              </a>
              <button 
                onClick={handleGoBack}
                className="bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl px-0 py-2.5 text-xs font-semibold text-gray-600 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                Search Again
              </button>
            </div>

            {/* Watermark */}
            <div className="flex items-center justify-end px-4 py-3 bg-white border-t border-gray-100">
              <span className="text-xs text-gray-400 font-medium">Snap Profile Viewer</span>
            </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Explore More Tools Section */}
        <div className="mt-12 bg-white py-16 md:py-20 border-t border-gray-100">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-black text-gray-900 mb-4">Explore More Tools</h2>
              <p className="text-gray-500 max-w-md mx-auto font-medium">Discover more premium tools while maintaining your privacy</p>
            </div>
            <ToolsGrid />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>{resultData.title || 'Download Result'} | Getinbex</title>
        <meta name="description" content={`Download result for ${resultData.title || 'Snapchat content'}. Uploader: ${resultData?.uploader || resultData?.displayName || 'Snapchat User'}`} />
        <meta name="robots" content="noindex, nofollow" />
        <meta property="og:title" content={`${resultData.title || 'Download'} | Getinbex`} />
        <meta property="og:description" content={`Snapchat content from ${resultData?.uploader || resultData?.displayName || 'Snapchat User'}. Downloaded via Getinbex.`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="player" />
        <meta name="twitter:title" content={`${resultData.title} | Getinbex`} />
        <meta name="twitter:description" content={`Snapchat content - ${resultData.title}`} />
        <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          "name": resultData.title || "Snapchat Content",
          "creator": {
            "@type": "Person",
            "name": resultData?.uploader || resultData?.displayName || 'Snapchat User'
          },
          "thumbnail": resultData.thumbnail,
          "duration": resultData.duration || "PT0S"
        })}
        </script>
      </Helmet>
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 ml-8 md:ml-16">
        {/* Navigation Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-4 mb-10"
        >
          <button 
            onClick={handleGoBack}
            className="flex items-center justify-center gap-2 bg-gray-900 text-white hover:bg-gray-800 px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg hover:shadow-xl active:scale-95 group min-w-[140px]"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back
          </button>
          
          <button 
            onClick={handleGoBack}
            className="flex items-center justify-center gap-2 bg-white text-gray-900 border-2 border-gray-900 hover:bg-gray-50 px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-md hover:shadow-lg active:scale-95 min-w-[140px]"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start justify-center">
          {/* Left Side: Video/Media Preview */}
          <div className="w-full lg:w-[320px] shrink-0 mx-auto lg:mx-0">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`relative ${toolId === 'profile-dp-downloader' ? 'aspect-square' : 'aspect-[9/16]'} max-h-[70vh] bg-black rounded-[2rem] overflow-hidden shadow-2xl border border-gray-100 group mx-auto`}
            >
              {previewIsVideo ? (
                <>
                  <video 
                    ref={videoRef}
                    src={previewUrl?.startsWith('http') && !previewUrl.includes('/api/') ? `/api/proxy?url=${encodeURIComponent(previewUrl)}` : previewUrl} 
                    className="w-full h-full object-cover"
                    poster={resultData.thumbnail}
                    playsInline
                    onTimeUpdate={handleTimeUpdate}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onClick={togglePlay}

                    controls={false}
                  />
                  
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="mb-4">
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={progress}
                        onChange={handleSeek}
                        className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-snap-brand"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        <button onClick={togglePlay} className="text-white hover:text-snap-brand transition-colors">
                          {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                        </button>
                        <button onClick={() => skip(-10)} className="text-white hover:text-snap-brand transition-colors">
                          <RotateCcw className="w-5 h-5" />
                        </button>
                        <button onClick={() => skip(10)} className="text-white hover:text-snap-brand transition-colors">
                          <RotateCw className="w-5 h-5" />
                        </button>
                      </div>
                      <button onClick={toggleMute} className="text-white hover:text-snap-brand transition-colors">
                        {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <img 
                    src={getProxiedUrl(previewUrl || resultData.thumbnail, resultData.username || profileHandle)} 
                    alt={`${resultData?.uploader || resultData?.displayName || 'Snapchat'} Result Thumbnail`} 
                    referrerPolicy="no-referrer"
                    className={`w-full h-full ${toolId === 'profile-dp-downloader' ? 'object-contain' : 'object-cover'}`}
                  />
                  <div className="absolute inset-0 bg-black/5" />
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Side: Details & Actions */}
          <div className="flex-1 w-full max-w-lg">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              {/* Account Header */}
              <div className="flex items-center gap-4 mb-4 mt-1">
                <div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-black text-gray-900 leading-tight">
                        {profileDisplayName}
                      </h1>
                      <CheckCircle2 className="w-5 h-5 text-snap-brand fill-current text-white stroke-[2.5]" />
                    </div>
                    {profileHandle && (
                      <p className="text-sm font-semibold text-gray-500">
                        @{profileHandle}
                      </p>
                    )}
                  </div>
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                    Verified Snapchat Account
                  </p>
                </div>
              </div>

              {/* Title / Description */}
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-800 leading-relaxed">
                  {cleanTitle || (toolId === 'profile-dp-downloader' ? 'High-Resolution Profile Picture' : 'Snapchat Spotlight Video')}
                </h2>
                
                {hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {hashtags.map((tag, i) => (
                      <span key={i} className="text-snap-brand font-bold text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Dotted Line requested by user */}
                <div className="mt-6 border-b-2 border-dotted border-gray-200" />
              </div>

              {/* Quality & Download Section */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">
                    Select Preferred Quality
                  </label>
                  <div className="relative">
                    <button 
                      onClick={() => setIsQualityOpen(!isQualityOpen)}
                      className="w-full h-16 bg-white border border-gray-100 rounded-2xl px-6 flex items-center justify-between hover:border-gray-200 transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <Video className="w-5 h-5 text-snap-brand" />
                        <span className="text-base font-bold text-gray-900">
                          {toolId === "profile-dp-downloader" ? "HD Original Quality" : `HD ${selectedQuality} Quality`}
                        </span>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-gray-300 transition-transform ${isQualityOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <AnimatePresence>
                      {isQualityOpen && (
                        <motion.div 
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute z-20 top-full mt-2 left-0 right-0 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden py-1"
                        >
                          {(toolId === "profile-dp-downloader" ? ["Original", "Standard"] : ["1080p", "720p", "360p"]).map((q) => (
                            <button
                              key={q}
                              onClick={() => {
                                setSelectedQuality(q);
                                setIsQualityOpen(false);
                              }}
                              className={`w-full px-6 py-4 text-left text-sm font-bold transition-colors flex items-center justify-between ${selectedQuality === q ? 'bg-sky-50 text-snap-brand' : 'text-gray-700 hover:bg-gray-50'}`}
                            >
                              {q}
                              {selectedQuality === q && <Check className="w-5 h-5" />}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <a 
                  href={hasStories ? selectedStory?.downloadUrl || resultData.downloadUrl || resultData.thumbnail : resultData.downloadUrl || resultData.thumbnail}
                  download={`${(resultData?.uploader || resultData?.displayName || 'snap').toLowerCase()}-snap-${toolId}.${previewIsVideo ? 'mp4' : 'jpg'}`}
                  onClick={() => {
                    setIsDownloading(true);
                    setTimeout(() => setIsDownloading(false), 5000);
                  }}
                  className={`premium-action-btn w-full h-[72px] rounded-2xl gap-3 text-lg shadow-[0_20px_40px_-12px_rgba(14,165,233,0.3)] transition-all active:scale-[0.98] ${isDownloading ? 'opacity-90 pointer-events-none' : ''}`}
                >
                  {isDownloading ? (
                    <span className="flex items-center gap-1">
                      Processing Download
                      <span className="flex gap-1 ml-1">
                        <motion.span 
                          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} 
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                          className="w-1.5 h-1.5 bg-gray-900 rounded-full"
                        />
                        <motion.span 
                          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} 
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }}
                          className="w-1.5 h-1.5 bg-gray-900 rounded-full"
                        />
                        <motion.span 
                          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} 
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }}
                          className="w-1.5 h-1.5 bg-gray-900 rounded-full"
                        />
                      </span>
                    </span>
                  ) : (
                    <>
                      <Download className="w-6 h-6" />
                      <span>Download Now</span>
                    </>
                  )}
                </a>

                {/* Export Button - Only for Profile Viewer */}
                {toolId === 'profile-viewer' && (
                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">
                    Export Profile Data
                  </label>
                  <div className="relative">
                    <button 
                      onClick={() => setIsExportOpen(!isExportOpen)}
                      className="w-full h-16 bg-white border border-gray-100 rounded-2xl px-6 flex items-center justify-between hover:border-gray-200 transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <FileJson className="w-5 h-5 text-snap-brand" />
                        <span className="text-base font-bold text-gray-900">
                          Export as {selectedExportFormat}
                        </span>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-gray-300 transition-transform ${isExportOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <AnimatePresence>
                      {isExportOpen && (
                        <motion.div 
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute z-20 top-full mt-2 left-0 right-0 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden py-1"
                        >
                          {["PNG", "PDF", "Excel"].map((format) => (
                            <button
                              key={format}
                              onClick={() => {
                                setSelectedExportFormat(format);
                                handleExport(format);
                              }}
                              className={`w-full px-6 py-4 text-left text-sm font-bold transition-colors flex items-center justify-between ${selectedExportFormat === format ? 'bg-sky-50 text-snap-brand' : 'text-gray-700 hover:bg-gray-50'}`}
                            >
                              <span className="flex items-center gap-2">
                                {format === 'PNG' && '🖼️'}
                                {format === 'PDF' && '📄'}
                                {format === 'Excel' && '📊'}
                                Export as {format}
                              </span>
                              {selectedExportFormat === format && <Check className="w-5 h-5" />}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                )}
              </div>

              {/* Security Badge */}
              <div className="mt-8 flex items-center justify-center lg:justify-start gap-6 opacity-60">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Virus Free</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-snap-brand" />
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Anonymous Download</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {hasStories && (
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-black text-gray-900 mb-3">Story Viewer & Downloader</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">Browse public Snapchat story items and download each without watermark instantly.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resultData.stories?.map((story) => (
              <div key={story.id || story.url} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md">
                <div className="relative rounded-3xl overflow-hidden bg-gray-100 h-52 mb-4">
                  {story.type === 'video' ? (
                    <video
                      src={story.url}
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                      poster={getProxiedUrl(story.thumbnail || resultData.thumbnail, resultData.username || profileHandle)}
                    />
                  ) : (
                    <img
                      src={getProxiedUrl(story.thumbnail || story.url, resultData.username || profileHandle)}
                      alt={story.title || 'Snapchat Story'}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-[0.18em]">{story.type === 'video' ? 'Video Story' : 'Image Story'}</p>
                    <h3 className="font-bold text-gray-900 mt-2">{story.title || 'Snap Story'}</h3>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedStory(story)}
                      className="flex-1 rounded-2xl border border-gray-200 bg-sky-50 px-4 py-3 text-sm font-bold text-snap-brand transition hover:bg-sky-100"
                    >
                      Preview
                    </button>
                    <a
                      href={story.downloadUrl}
                      download={`${(resultData?.uploader || resultData?.displayName || 'story').toLowerCase().replace(/\s+/g, '-')}-story.${story.type === 'video' ? 'mp4' : 'jpg'}`}
                      className="flex-1 rounded-2xl border border-gray-200 bg-gray-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-gray-800 text-center"
                    >
                      Download
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-12 bg-gray-50/50 py-20 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900 mb-4">Explore More Tools</h2>
            <p className="text-gray-500 max-w-md mx-auto font-medium">Try our other premium tools for free with zero tracking or identity requirements.</p>
          </div>
          <ToolsGrid />
        </div>
      </div>
    </div>
  );
}
