import React from "react";

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
        return "How to Use Snapchat Story Viewer Tool";
      case "profile-viewer":
        return "How to Use Snapchat Profile Viewer Tool";
      case "story-downloader":
        return "How to Use Snapchat Story Downloader Tool";
      case "spotlight-downloader":
        return "How to Use Snapchat Video Downloader Tool";
      case "video-downloader":
        return "How to Use Snapchat Bulk Video Downloader Tool";
      case "profile-dp-downloader":
        return "How to Use Snapchat Profile DP Downloader Tool";
      default:
        return "How to Use Snapchat Tool";
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
        <div className="lg:col-span-5 flex items-center justify-center w-full">
          <div className="w-full max-w-[480px] aspect-[4/3] rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(234,179,8,0.2)] border-2 border-yellow-400/20 group">
            <img
              src="/tool-pic.png?v=20260527"
              alt={`${tool.name} Tutorial Guide`}
              width={1024}
              height={680}
              className="w-full h-full object-cover object-center select-none transform group-hover:scale-105 transition-transform duration-700 ease-out"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
