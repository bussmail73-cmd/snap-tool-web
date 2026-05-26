import React from "react";
import { Monitor, Sparkles } from "lucide-react";
import { Tool } from "../constants";

interface HowToWorkProps {
  tool: Tool;
}

interface StepDetail {
  title: string;
  desc: string;
}

export default function HowToWork({ tool }: HowToWorkProps) {
  // Get full SEO-optimized heading for each tool
  const getMainHeading = (id: string): string => {
    switch (id) {
      case "story-viewer":
        return "How To Work Snapchat Story Viewer Tool";
      case "profile-viewer":
        return "How To Work Snapchat Profile Viewer Tool";
      case "story-downloader":
        return "How To Work Snapchat Story Downloader Tool";
      case "spotlight-downloader":
        return "How To Work Snapchat Video Downloader Tool";
      case "video-downloader":
        return "How To Work Snapchat Bulk Video Downloader Tool";
      case "profile-dp-downloader":
        return "How To Work Snapchat Profile DP Downloader Tool";
      default:
        return "How To Work Snapchat Tool";
    }
  };

  // Step data based on tool ID
  const getSteps = (id: string): StepDetail[] => {
    switch (id) {
      case "story-viewer":
        return [
          {
            title: "Go to Snapchat Story Viewer",
            desc: "Open your web browser, visit Getinbex, and navigate to the Snapchat Story Viewer tool page.",
          },
          {
            title: "Paste Username or Profile Link",
            desc: "Copy the public Snapchat username or profile link, and paste it into the search box at the top of the page.",
          },
          {
            title: "Press the 'View Story' Button",
            desc: "Click the action button and wait 2 to 3 seconds for our tool to safely process and extract the stories.",
          },
          {
            title: "Watch Stories Anonymously",
            desc: "The results page opens instantly, displaying all active stories in full HD, ready to view in complete ghost mode.",
          },
        ];
      case "profile-viewer":
        return [
          {
            title: "Go to Snapchat Profile Viewer",
            desc: "Open Getinbex and head over to the Snapchat Profile Viewer tool page.",
          },
          {
            title: "Paste Username or Profile Link",
            desc: "Copy the Snapchat username or profile URL of the public account, and paste it into the search input.",
          },
          {
            title: "Press the 'View Profile' Button",
            desc: "Click the action button and wait 2 to 3 seconds for the tool to securely scan the public profile metrics.",
          },
          {
            title: "Explore Profile Details",
            desc: "The results page will load, showing the display name, subscriber count, public highlights, and snapcode.",
          },
        ];
      case "story-downloader":
        return [
          {
            title: "Go to Snapchat Story Downloader",
            desc: "Navigate to the Snapchat Story Downloader page on the Getinbex website.",
          },
          {
            title: "Paste Story Link or Username",
            desc: "Copy the public story link or username from Snapchat and paste it into the search field.",
          },
          {
            title: "Press the 'Download Now' Button",
            desc: "Click the download button and wait 2 to 3 seconds while the system processes the media files.",
          },
          {
            title: "Save HD Story to Your Device",
            desc: "The results page will display the story, allowing you to download the MP4 video directly to your storage.",
          },
        ];
      case "spotlight-downloader":
        return [
          {
            title: "Go to Snapchat Video Downloader",
            desc: "Visit the Snapchat Video Downloader page on the Getinbex website.",
          },
          {
            title: "Paste the Video Link",
            desc: "Copy the public video URL from Snapchat and paste it into the input container.",
          },
          {
            title: "Press the 'Get Video' Button",
            desc: "Click the button and wait 2 to 3 seconds while our system extracts the clean video stream.",
          },
          {
            title: "Download Video Without Watermark",
            desc: "The results page will open, displaying the original video in high quality, ready to download as a clean MP4 file.",
          },
        ];
      case "video-downloader":
        return [
          {
            title: "Go to Bulk Video Downloader",
            desc: "Navigate to the Snapchat Bulk Video Downloader tool page on Getinbex.",
          },
          {
            title: "Paste Link or Snapchat Username",
            desc: "Paste the public video URL or the username of the account containing the files you wish to download.",
          },
          {
            title: "Press the 'Download Videos' Button",
            desc: "Click the button and wait 2 to 3 seconds for the tool to scan and gather the media playlist.",
          },
          {
            title: "Bulk Save All Videos to Device",
            desc: "The results page will list all compiled videos, letting you save them in original high-definition MP4 format.",
          },
        ];
      case "profile-dp-downloader":
        return [
          {
            title: "Go to Snapchat DP Downloader",
            desc: "Open the Snapchat Profile DP Downloader tool on Getinbex in your browser.",
          },
          {
            title: "Paste Username or Profile Link",
            desc: "Copy the username or the profile link of the Snapchat user and paste it into the search bar.",
          },
          {
            title: "Press the 'Download DP' Button",
            desc: "Click the action button and wait 2 to 3 seconds while the server processes the high-res profile picture.",
          },
          {
            title: "Save High-Resolution Profile Photo",
            desc: "The results page will open, displaying the high-definition JPG/PNG avatar, ready for you to download instantly.",
          },
        ];
      default:
        return [
          {
            title: "Go to Website",
            desc: "Visit the Getinbex website and navigate to the selected tool page.",
          },
          {
            title: "Paste URL or Username",
            desc: "Enter or paste the public Snapchat link or username in the input box.",
          },
          {
            title: "Click Button & Wait",
            desc: "Click the action button and wait 2 to 3 seconds for the parser to extract the data.",
          },
          {
            title: "Get Your Media",
            desc: "The result page will open, displaying the requested files, ready to view or download.",
          },
        ];
    }
  };

  const steps = getSteps(tool.id);

  // Generate descriptions matching the specific tool page
  const getDescription = (id: string): string => {
    switch (id) {
      case "story-viewer":
        return "Learn how to watch public Snapchat stories anonymously. Follow these four quick and simple steps to browse public stories in complete ghost mode without leaving any traces.";
      case "profile-viewer":
        return "Check out how our free profile viewer works. Learn the quick process to inspect public Snapchat accounts, display names, and sub counts securely without signing in.";
      case "story-downloader":
        return "Get high-definition public Snapchat stories saved to your gallery in seconds. Here is the easy, step-by-step guide to downloading stories without any daily limits.";
      case "spotlight-downloader":
        return "Save clean Spotlight clips in original high-resolution without watermark overlays. Follow this simple guide to download original-quality videos in seconds.";
      case "video-downloader":
        return "Download multiple public Snapchat video files, spotlights, and highlights simultaneously. Read our quick instructions to save your favorite snap compilations in bulk.";
      case "profile-dp-downloader":
        return "Grab full-size Snapchat profile pictures in crisp HD resolution. Learn how to extract and download high-quality avatar images from any public account instantly.";
      default:
        return "Get started with our free Snapchat tools in seconds. Follow our simple step-by-step tutorial to view, save, and download public Snapchat media effortlessly.";
    }
  };

  return (
    <section className="home-section mt-12 pb-24 border-t border-gray-100 pt-16" id="how-to-work">
      <div className="home-section-header mb-16">
        <h2>{getMainHeading(tool.id)}</h2>
        <p>{getDescription(tool.id)}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Numbered Steps */}
        <div className="lg:col-span-7 space-y-8">
          {steps.map((step, index) => (
            <div key={index} className="flex gap-4 items-start text-left">
              {/* Step Number */}
              <div className="flex-shrink-0 text-3xl font-black text-snap-brand select-none pt-0.5 w-10">
                {String(index + 1).padStart(2, "0")}
              </div>

              {/* Step Content */}
              <div className="space-y-1 pt-1.5">
                <h3 className="text-base font-bold text-slate-800 leading-snug">
                  {step.title}
                </h3>
                <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-xl">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Beautiful Graphic Showcase */}
        <div className="lg:col-span-5 flex items-center justify-center w-full h-full min-h-[520px]">
          {tool.id === "spotlight-downloader" ? (
            /* Super-Premium 3D Isometric CSS/SVG Mockup - 4K Resolution & High-Fidelity Vector Graphic */
            <div className="w-full h-full min-h-[520px] relative rounded-[2.5rem] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8 shadow-[0_30px_100px_rgba(0,0,0,0.8)] border border-slate-800/80 overflow-hidden flex flex-col items-center justify-center select-none group perspective-[1000px]">
              {/* Background glowing lights */}
              <div className="absolute top-10 left-10 w-48 h-44 rounded-full bg-yellow-400/10 blur-[100px] pointer-events-none" />
              <div className="absolute bottom-10 right-10 w-48 h-44 rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />
              <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-slate-950/80 pointer-events-none" />

              {/* Glowing grid backdrop */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,black_70%,transparent_100%)] pointer-events-none" />

              {/* Tilted 3D Graphic Layout Container */}
              <div className="relative w-full h-full flex flex-col items-center justify-center transform rotate-x-[15deg] rotate-y-[-15deg] rotate-z-[2deg] scale-100 group-hover:scale-[1.03] group-hover:rotate-x-[12deg] group-hover:rotate-y-[-12deg] transition-all duration-700 ease-out py-6">
                
                {/* 3D Glassmorphic Video Player Card */}
                <div className="relative w-11/12 max-w-[360px] bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/10 p-5 shadow-[25px_30px_60px_rgba(0,0,0,0.6)] flex flex-col gap-4 transform translate-y-[-20px] transition-transform duration-500">
                  
                  {/* Top Bar inside Card */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <div className="flex items-center gap-2 flex-row text-left">
                      <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg shadow-yellow-400/20">
                        <svg className="w-4 h-4 text-black fill-black" viewBox="0 0 24 24">
                          <path d="M12 2c2-1 6-1 8 3 2 4 0 8-2 10-2 2-6 2-8-3-2-4 0-8 2-10z" />
                        </svg>
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-[11px] font-black text-white leading-none tracking-wide uppercase">Snapchat Spotlight</span>
                        <span className="text-[9px] font-bold text-slate-400 mt-1 leading-none">HD Quality Stream</span>
                      </div>
                    </div>
                    {/* Glowing 4K HD badge */}
                    <span className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-400/30 text-emerald-400 font-extrabold text-[9px] px-2.5 py-1 rounded-full shadow-inner tracking-wider uppercase">
                      4K Ultra
                    </span>
                  </div>

                  {/* Mock Video Container */}
                  <div className="relative aspect-[16/9] w-full bg-slate-950/80 rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center shadow-inner group/video">
                    {/* Simulated video poster thumbnail - glowing Snapchat logo in dark 3D grid */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-slate-950 to-slate-900 opacity-90 flex items-center justify-center">
                      {/* Beautiful abstract geometric graphics */}
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(253,224,71,0.06)_0%,transparent_70%)]" />
                    </div>

                    {/* Glowing golden Play Button */}
                    <div className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-yellow-300 to-yellow-400 text-black flex items-center justify-center shadow-[0_8px_30px_rgba(234,179,8,0.4)] transform hover:scale-110 active:scale-95 duration-300">
                      <svg className="w-6 h-6 fill-black translate-x-0.5" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>

                    {/* Progress slider bar at bottom */}
                    <div className="absolute bottom-3 left-4 right-4 flex items-center gap-2">
                      <span className="text-[8px] font-black text-white leading-none">0:12</span>
                      <div className="flex-1 h-1 rounded-full bg-white/20 relative">
                        <div className="absolute left-0 top-0 bottom-0 w-[60%] bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full" />
                        <div className="absolute left-[60%] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-md border-2 border-yellow-400" />
                      </div>
                      <span className="text-[8px] font-black text-slate-400 leading-none">0:24</span>
                    </div>
                  </div>

                  {/* Watermark Free badge */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="text-[10px] font-black text-emerald-300 tracking-wide text-left">
                      100% Watermark Removed
                    </span>
                  </div>
                </div>

                {/* Overlapping 3D Floating Downloader Bar */}
                <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 border border-white/10 rounded-2xl p-3 shadow-[0_15px_40px_rgba(0,0,0,0.5)] flex items-center justify-between gap-3 transform translate-z-20 translate-y-[15deg] group-hover:translate-y-[-5px] transition-all duration-500 delay-75">
                  <div className="flex-1 flex items-center gap-2.5 px-3 py-2 bg-black/40 rounded-xl border border-white/5 text-left">
                    <svg className="w-4 h-4 text-yellow-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span className="text-[10px] font-bold text-slate-300 truncate max-w-[140px]">
                      snapchat.com/spotlight/v82...
                    </span>
                  </div>
                  
                  {/* Glowing 3D Download Button */}
                  <button className="h-9 px-4 bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-black text-[10px] uppercase rounded-xl shadow-[0_4px_15px_rgba(234,179,8,0.3)] hover:shadow-[0_4px_25px_rgba(234,179,8,0.5)] transform active:scale-95 duration-300 flex items-center gap-1.5 cursor-pointer border-none outline-none">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </button>
                </div>

                {/* Floating Decorative 3D Stars / Sparkles */}
                <div className="absolute top-1/4 right-[5%] animate-pulse text-yellow-400">
                  <svg className="w-6 h-6 fill-yellow-400" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                </div>
                <div className="absolute bottom-1/3 left-[2%] animate-bounce text-yellow-400/80">
                  <svg className="w-5 h-5 fill-yellow-400/80" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                </div>
                
              </div>
            </div>
          ) : (
            <div className="border border-slate-150 rounded-3xl bg-slate-50/40 p-6 shadow-xs overflow-hidden relative w-full h-full flex flex-col justify-between min-h-[360px]">
              {/* Top Browser dots */}
              <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-6 shrink-0">
                <div className="w-3 h-3 rounded-full bg-red-400/20 border border-red-400/30"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400/20 border border-yellow-400/30"></div>
                <div className="w-3 h-3 rounded-full bg-green-400/20 border border-green-400/30"></div>
                <div className="ml-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Visual Tutorial Guide
                </div>
              </div>

              {/* Central Graphic Placeholders */}
              <div className="flex-1 flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-slate-200/80 bg-white/65 text-center shadow-inner relative">
                <div className="absolute inset-0 bg-radial from-transparent to-slate-50/30 pointer-events-none rounded-2xl" />
                
                <div className="w-16 h-16 rounded-2xl bg-snap-brand/5 border border-snap-brand/10 flex items-center justify-center text-snap-brand mb-4 shadow-sm">
                  <Monitor className="w-8 h-8 stroke-[1.5]" />
                </div>

                <h4 className="text-sm font-bold text-slate-700 mb-1">
                  Visual Guide Placeholder
                </h4>
                
                <p className="text-[12px] font-medium text-slate-400 max-w-[240px] leading-relaxed">
                  Step-by-step graphic showcase of {tool.name} in action will be displayed here.
                </p>

                {/* Sparkle decorative effect */}
                <div className="absolute top-4 right-4 text-snap-brand/30">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
