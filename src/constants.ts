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

export interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

export const FAQS: FAQItem[] = [
  {
    id: 1,
    question: "What is Getinbex?",
    answer: "Getinbex is a free online tool for Snapchat. It lets you download Snapchat videos, stories, Spotlight clips, and profile pictures without any app or account. Just paste a public link or username — and your content is ready to save in seconds."
  },
  {
    id: 2,
    question: "Is Getinbex free to use?",
    answer: "Yes, completely free. No subscription, no hidden fee, no daily limit. You can use all tools — story viewer, video downloader, Spotlight downloader, and DP downloader — as many times as you want without paying a single penny."
  },
  {
    id: 3,
    question: "Do I need a Snapchat account to use Getinbex?",
    answer: "No. You do not need any account — not Snapchat, not email, nothing. Just open Getinbex in your browser, paste the public Snapchat link or username, and start downloading right away. Zero sign-up, zero login, zero hassle."
  },
  {
    id: 4,
    question: "Can I view Snapchat stories without the person knowing?",
    answer: "Yes. When you use Getinbex to view a public story, the uploader gets no notification at all. No name, no view count, no trace. Getinbex never logs into Snapchat, so your visit stays 100% anonymous every single time."
  },
  {
    id: 5,
    question: "Will the Snapchat user know if I download their story or video?",
    answer: "No — not at all. Getinbex works without logging into any Snapchat account, so the original user receives zero alerts. No download notice, no screenshot warning, no trace of any kind. Your activity is completely invisible to them."
  },
  {
    id: 6,
    question: "How do I download a Snapchat video for free?",
    answer: "Open the Snap or Spotlight in Snapchat, tap Share, and copy the link. Then go to Getinbex, paste the link in the Video Downloader, and click Download. That is it — original quality, no watermark, no app, completely free."
  },
  {
    id: 7,
    question: "Can I download Snapchat Spotlight videos without a watermark?",
    answer: "Yes. Getinbex downloads any public Spotlight video in its original quality — up to full 4K — as a clean MP4 file. No watermark, no logo, no overlay added. You get the exact video the creator uploaded, ready to use freely."
  },
  {
    id: 8,
    question: "How do I save a Snapchat profile picture in HD?",
    answer: "Go to Getinbex and open the Snapchat DP Downloader. Paste the username or profile URL and click Download. The tool grabs the profile picture in the highest available resolution and saves it as PNG or JPG — free and anonymous."
  },
  {
    id: 9,
    question: "Does Getinbex add a watermark to downloads?",
    answer: "Never. Every file from Getinbex is 100% clean. No logo, no overlay, no brand stamp of any kind. You get the original file exactly as it was uploaded — ready to save, share, or repost without editing anything."
  },
  {
    id: 10,
    question: "Is Getinbex safe to use?",
    answer: "Yes, completely safe. Getinbex only accesses public Snapchat content — nothing private. It runs on HTTPS, collects zero personal data, and never stores your downloads. No malware, no tracking, no risk on any device."
  },
  {
    id: 11,
    question: "Can I view a public Snapchat profile without logging in?",
    answer: "Yes. The Getinbex Profile Viewer lets you open any public Snapchat profile directly in your browser. No Snapchat account, no app, no login needed. View stories, Spotlight videos, and profile details freely and without leaving any trace."
  },
  {
    id: 12,
    question: "Can Getinbex access private Snapchat profiles or stories?",
    answer: "No — and no real tool can. Getinbex only works with public Snapchat content. If a profile is private, the content cannot be accessed. Any website claiming to unlock private accounts is a scam — never trust or use such sites."
  },
  {
    id: 13,
    question: "Why is my Snapchat link not working on Getinbex?",
    answer: "Three main reasons — the account is private, the story already expired after 24 hours, or the link was not copied fully. Check that the profile is public and the URL is complete. After that it works right away, no issues."
  },
  {
    id: 14,
    question: "Does Getinbex work on mobile phones?",
    answer: "Yes, perfectly. Getinbex works on iPhone, Android, iPad, and any tablet. No app download needed. Just open Chrome, Safari, or any browser, go to Getinbex, paste your link, and save the file directly to your phone in seconds."
  },
  {
    id: 15,
    question: "What format does Getinbex use to save downloaded videos?",
    answer: "All Snapchat videos and Spotlight clips save as MP4 files. MP4 plays on every phone, computer, editor, and platform. Profile pictures save as PNG or JPG in original resolution — no conversion needed, ready to use anywhere immediately."
  }
];

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
