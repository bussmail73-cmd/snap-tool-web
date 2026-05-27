import { 
  Ghost, 
  History, 
  Download, 
  Video, 
  UserCircle 
} from "lucide-react";

export interface Tool {
  id: string;
  name: string;
  path: string;
  title: string;
  description: string;
  icon: any; // Lucide icon
  placeholder: string;
  buttonText: string;
  highlightedWord: string;
  examples: string[];
}

export const TOOLS: Tool[] = [
  {
    id: "story-viewer",
    name: "Snapchat Story Viewer",
    path: "/story-viewer",
    title: "Snapchat Story Viewer Anonymous",
    highlightedWord: "Story Viewer",
    description: "The best free Snapchat story viewer to watch stories anonymously. No login required, totally free and ghost mode active.",
    icon: Ghost,
    placeholder: "Enter username or profile link",
    buttonText: "View Story",
    examples: ["wwe", "@wwe", "https://snapchat.com/add/wwe"]
  },
  {
    id: "profile-viewer",
    name: "Snapchat Profile Viewer",
    path: "/profile-viewer",
    title: "Snapchat Profile Viewer",
    highlightedWord: "Profile Viewer",
    description: "View any public Snapchat profile details, bitmojis, and stories anonymously with our 100% free tool.",
    icon: UserCircle,
    placeholder: "Enter Snapchat username",
    buttonText: "View Profile",
    examples: ["therock", "@therock", "https://snapchat.com/add/therock"]
  },
  {
    id: "story-downloader",
    name: "Snapchat Story Downloader",
    path: "/story-downloader",
    title: "Snapchat Story Downloader",
    highlightedWord: "Story",
    description: "Save any public Snapchat stories directly to your device in 4K/HD quality. A totally free and fast downloader.",
    icon: Download,
    placeholder: "Enter story link or username",
    buttonText: "Download Now",
    examples: ["nascar", "@nascar", "https://snapchat.com/add/nascar"]
  },
  {
    id: "spotlight-downloader",
    name: "Snapchat Video Downloader",
    path: "/spotlight-downloader",
    title: "Snapchat Video Downloader",
    highlightedWord: "Video",
    description: "Download any Snapchat video, story, or spotlight to your device in HD without watermarks. Safe, free, no signup required.",
    icon: Video,
    placeholder: "Enter Spotlight video link",
    buttonText: "Get Spotlight",
    examples: ["https://snapchat.com/spotlight/W7_ED928AC", "https://t.snapchat.com/ID12345"]
  },
  {
    id: "video-downloader",
    name: "Snapchat Bulk Video Downloader",
    path: "/video-downloader",
    title: "Snapchat Bulk Video Downloader",
    highlightedWord: "Bulk Video",
    description: "Fast and easy way to download all Snapchat videos, memories, spotlights and highlights in bulk from public links for free and without any limit.",
    icon: History,
    placeholder: "Enter video URL or username",
    buttonText: "Download Videos",
    examples: ["https://snapchat.com/s/video123", "wwe", "@wwe"]
  },
  {
    id: "profile-dp-downloader",
    name: "Snapchat Profile DP Download",
    path: "/profile-dp-download",
    title: "Snapchat Profile DP Downloader",
    highlightedWord: "Profile DP",
    description: "Download profile pictures from any public Snapchat profile in high resolution. 100% anonymous and free.",
    icon: UserCircle,
    placeholder: "Enter Snapchat username",
    buttonText: "Download DP",
    examples: ["wwe", "@therock", "https://snapchat.com/add/nascar"]
  }
];
