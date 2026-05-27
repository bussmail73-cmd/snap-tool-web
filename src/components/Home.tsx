import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Lock, Server, Users, Download, Globe, Zap, Clipboard, Wifi, Bookmark } from "lucide-react";
import ToolsGrid from "./ToolsGrid";

const FAQs = [
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

export default function Home() {
  const navigate = useNavigate();
  const [showAllFAQs, setShowAllFAQs] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="home-hero">
        <div className="home-hero-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 3l1.88 5.76H20l-4.94 3.59 1.88 5.77L12 14.53l-4.94 3.59 1.88-5.77L4.12 8.76H10.12z"/></svg>
          The Ultimate Snapchat Tool Suite
        </div>

        <h1>Getinbex</h1>

        <p>Your all-in-one anonymous Snapchat toolkit. View stories anonymously, download spotlight videos, and discover public profiles with our powerful, 100% free web tools.</p>

        <div className="home-hero-features">
          <div className="home-feature-pill">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Safe & Secure
          </div>
          <div className="home-feature-pill">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            Lightning Fast
          </div>
          <div className="home-feature-pill">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 2c2-1 6-1 8 3 2 4 0 8-2 10-2 2-6 2-8-3-2-4 0-8 2-10z"/></svg>
            100% Free
          </div>
        </div>
      </section>

      {/* TOOLS GRID */}
      <ToolsGrid />

      {/* ABOUT GETINBEX */}
      <section className="home-section">
        <div className="home-section-header">
          <h2>About Getinbex</h2>
          <p>Getinbex is a premium online tool suite built to make social media content effortlessly accessible. Right now, it specializes in Snapchat — letting you view and download profile pictures, stories, spotlight clips, videos, and more without ever needing to sign in.</p>
          <p className="mt-6">Everything is delivered in original quality up to crisp 4K resolution, with no watermarks, no ads, and no tracking. Just paste a link and save what you need — fast, anonymous, and 100% free for everyone.</p>
        </div>
      </section>

      {/* QUICK DOWNLOAD GUIDE */}
      <section className="home-section home-guide-section">
        <div className="home-section-header">
          <h2>How to download</h2>
          <p>Paste a public Snapchat video or profile link above and click download to save HD media quickly and securely.</p>
        </div>

        <div className="home-guide-steps">
          <div className="home-guide-step">
            <div className="home-guide-icon-wrap">
              <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <rect x="8" y="12" width="26" height="30" rx="3"/>
                <rect x="14" y="6" width="26" height="30" rx="3" fill="white"/>
                <rect x="14" y="6" width="26" height="30" rx="3"/>
              </svg>
            </div>
            <span className="home-guide-step-label">Copy shareable video URL</span>
          </div>

          <div className="home-guide-step">
            <div className="home-guide-icon-wrap">
              <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <rect x="10" y="10" width="28" height="34" rx="3"/>
                <rect x="18" y="6" width="12" height="8" rx="2" fill="white"/>
                <rect x="18" y="6" width="12" height="8" rx="2"/>
                <line x1="16" y1="22" x2="32" y2="22"/>
                <line x1="16" y1="29" x2="28" y2="29"/>
              </svg>
            </div>
            <span className="home-guide-step-label">Paste it into the field above</span>
          </div>

          <div className="home-guide-step">
            <div className="home-guide-icon-wrap">
              <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M 24 8 A 16 16 0 1 1 8 24" />
                <polyline points="24,16 24,32 18,26"/>
                <polyline points="24,32 30,26"/>
              </svg>
            </div>
            <span className="home-guide-step-label">Click to download button</span>
          </div>
        </div>
      </section>

      {/* COMPARISON SECTION */}
      <section className="home-section">
        <div className="home-section-header">
          <h2>Getinbex vs the other</h2>
          <p>See how we stack up against the typical Snapchat tools you'll find elsewhere.</p>
        </div>
        <div className="home-comparison-divider"></div>
        
        <table className="home-comparison-table">
          <thead className="home-comparison-header">
            <tr>
              <th>Feature</th>
              <th>Getinbex</th>
              <th>Others</th>
            </tr>
          </thead>
          <tbody>
            <tr className="home-comparison-row">
              <td>100% anonymous browsing</td>
              <td><span className="home-comparison-check">✓</span></td>
              <td><span className="home-comparison-cross">✗</span></td>
            </tr>
            <tr className="home-comparison-row">
              <td>No sign-up required</td>
              <td><span className="home-comparison-check">✓</span></td>
              <td><span className="home-comparison-cross">✗</span></td>
            </tr>
            <tr className="home-comparison-row">
              <td>Download in 4K / HD quality</td>
              <td><span className="home-comparison-check">✓</span></td>
              <td><span className="home-comparison-cross">✗</span></td>
            </tr>
            <tr className="home-comparison-row">
              <td>Zero watermarks</td>
              <td><span className="home-comparison-check">✓</span></td>
              <td><span className="home-comparison-cross">✗</span></td>
            </tr>
            <tr className="home-comparison-row">
              <td>No daily download limits</td>
              <td><span className="home-comparison-check">✓</span></td>
              <td><span className="home-comparison-cross">✗</span></td>
            </tr>
            <tr className="home-comparison-row">
              <td>Free forever — no premium tier</td>
              <td><span className="home-comparison-check">✓</span></td>
              <td><span className="home-comparison-cross">✗</span></td>
            </tr>
            <tr className="home-comparison-row">
              <td>Ad-free experience</td>
              <td><span className="home-comparison-check">✓</span></td>
              <td><span className="home-comparison-cross">✗</span></td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* SECURITY SECTION */}
      <section className="home-section" id="security">
        <div className="home-section-header">
          <h2>Trust & Security</h2>
          <p>We implement industry-standard protocols to ensure your data and privacy are protected.</p>
        </div>
        <div className="home-security-grid grid-cols-1 md:grid-cols-3">
          <div className="home-security-card">
            <div className="home-security-icon text-slate-600">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3>Privacy First</h3>
            <p className="text-xs">All requests are processed securely. We never store user data or interaction history.</p>
          </div>

          <div className="home-security-card">
            <div className="home-security-icon text-slate-600">
              <Lock className="w-8 h-8" />
            </div>
            <h3>Data Protection</h3>
            <p className="text-xs">We utilize end-to-end encryption to safeguard your browsing experience from potential leaks.</p>
          </div>

          <div className="home-security-card">
            <div className="home-security-icon text-slate-600">
              <Server className="w-8 h-8" />
            </div>
            <h3>Reliable Infrastructure</h3>
            <p className="text-xs">Built on high-performance servers to ensure fast loading times and 99.9% uptime.</p>
          </div>
        </div>
      </section>

      {/* COMMUNITY SECTION */}
      <section className="home-section">
        <div className="home-section-header">
          <h2>Trusted by millions worldwide</h2>
          <p>Join a thriving community that relies on Getinbex for fast, private, and reliable Snapchat tools every day.</p>
        </div>
        <div className="home-stats-grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
          <div className="home-stat-card">
            <div className="home-stat-icon">
              <Users className="w-8 h-8" />
            </div>
            <h3>2.5M+</h3>
            <p>Happy Users</p>
          </div>
          <div className="home-stat-card">
            <div className="home-stat-icon">
              <Download className="w-8 h-8" />
            </div>
            <h3>18M+</h3>
            <p>Downloads Served</p>
          </div>
          <div className="home-stat-card">
            <div className="home-stat-icon">
              <Globe className="w-8 h-8" />
            </div>
            <h3>150+</h3>
            <p>Countries</p>
          </div>
          <div className="home-stat-card">
            <div className="home-stat-icon">
              <Zap className="w-8 h-8" />
            </div>
            <h3>99.9%</h3>
            <p>Uptime</p>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="home-section">
        <div className="home-section-header">
          <h2>FAQ</h2>
          <p>Everything you need to know about Getinbex — our tools, features, privacy, and more.</p>
        </div>
        
        <div className="home-faq-list">
          {FAQs.slice(0, showAllFAQs ? 15 : 7).map((faq) => (
            <div key={faq.id} className="home-faq-item">
              <div 
                className="home-faq-question-header"
                onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
              >
                <h3>{faq.question}</h3>
                <span className="home-faq-toggle">
                  {expandedFAQ === faq.id ? '−' : '+'}
                </span>
              </div>
              {expandedFAQ === faq.id && (
                <div className="home-faq-answer">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="home-faq-button-group">
          {!showAllFAQs ? (
            <button 
              onClick={() => setShowAllFAQs(true)}
              className="home-faq-button"
            >
              Show More
            </button>
          ) : (
            <button 
              onClick={() => setShowAllFAQs(false)}
              className="home-faq-button"
            >
              Show Less
            </button>
          )}
        </div>
      </section>

      {/* PRO TIPS SECTION */}
      <section className="home-section">
        <div className="home-section-header">
          <h2>Pro Tips</h2>
          <p>Small habits that make every download faster, cleaner, and more reliable.</p>
        </div>
        <div className="home-pro-tips-grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <div className="home-pro-tips-card">
            <div className="home-pro-tips-icon">
              <Clipboard strokeWidth={1.5} className="w-10 h-10" />
            </div>
            <div className="home-pro-tips-content">
              <h3>Use public links only</h3>
              <p>Getinbex works with publicly shared Snapchat URLs. Private content stays private — as it should.</p>
            </div>
          </div>
          <div className="home-pro-tips-card">
            <div className="home-pro-tips-icon">
              <Wifi strokeWidth={1.5} className="w-10 h-10" />
            </div>
            <div className="home-pro-tips-content">
              <h3>Stable connection helps</h3>
              <p>For 4K downloads, a stable Wi-Fi connection gives you the fastest, cleanest result.</p>
            </div>
          </div>
          <div className="home-pro-tips-card">
            <div className="home-pro-tips-icon">
              <Download strokeWidth={1.5} className="w-10 h-10" />
            </div>
            <div className="home-pro-tips-content">
              <h3>Organize your downloads</h3>
              <p>Create a dedicated folder so your saved stories and spotlights are easy to find later.</p>
            </div>
          </div>
          <div className="home-pro-tips-card">
            <div className="home-pro-tips-icon">
              <Bookmark strokeWidth={1.5} className="w-10 h-10" />
            </div>
            <div className="home-pro-tips-content">
              <h3>Bookmark the homepage</h3>
              <p>Keep Getinbex one click away so you never lose a moment when something cool drops.</p>
            </div>
          </div>
        </div>
      </section>

      {/* DOWNLOAD VIDEOS EASILY WITH GETINBEX */}
      <section className="home-section mt-12 pt-16">
        <div className="home-section-header">
          <h2>Download Videos Easily with Getinbex</h2>
          <p className="text-slate-700 font-semibold max-w-2xl mx-auto text-lg leading-relaxed">
            Your ultimate high-speed platform to download Snapchat spotlights, stories, and public highlights in crystal-clear HD quality with a single click, completely free and anonymous.
          </p>
        </div>
        
        <div className="max-w-5xl mx-auto px-4 mt-8 space-y-6">
          <p className="text-left text-slate-800 text-[1.1rem] leading-relaxed font-medium">
            Getinbex serves as your reliable, high-performance solution for downloading your favorite online videos, stories, and social media content. This trusted Snapchat media suite has helped millions of users worldwide, providing a simple and 100% anonymous method to save media from popular platforms without requiring any complex software or app installation. Our web-based tool operates smoothly on both desktop computers and mobile devices, featuring an intuitive, modern interface that streamlines the entire download process.
          </p>
          
          <p className="text-left text-slate-800 text-[1.1rem] leading-relaxed font-medium">
            Whether you want Snapchat Spotlight videos, public stories, entertainment highlights, or sports shows, Getinbex provides dependable, lightning-fast results. Simply copy your desired video URL or public username, paste it into our secure download field, and watch the system fetch direct high-quality MP4 media files without adding any watermarks or overlays.
          </p>
          
          <h3 className="text-2xl font-bold text-gray-900 text-center pt-8 tracking-tight">Download High-Quality MP4 Videos</h3>
          <div className="w-15 h-1 bg-linear-to-r from-pink-500 to-purple-500 rounded-sm mx-auto mt-2 mb-6"></div>
          
          <p className="text-left text-slate-800 text-[1.1rem] leading-relaxed font-medium">
            Offline video access gives you greater control over your entertainment experience compared to streaming alone. Getinbex's video downloader maintains original quality standards, providing crystal-clear MP4 downloads that preserve their source resolution, frame rate, and audio clarity. Create your personal media collection with absolute confidence, knowing each download maintains its original high-definition visual excellence.
          </p>
          
          <p className="text-left text-slate-800 text-[1.1rem] leading-relaxed font-medium">
            Our advanced parsing technology guarantees your saved MP4 files display the same visual excellence as their online versions. Ideal for travel situations, areas with limited internet connectivity, or users who prefer having instant offline access to their favorite content library, Getinbex offers reliable downloading capabilities you can depend on every single day.
          </p>
        </div>
      </section>
    </div>
  );
}
