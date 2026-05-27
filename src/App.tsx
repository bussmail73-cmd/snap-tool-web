/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy, useState } from "react";
import { Link, BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { HelmetProvider, Helmet } from "react-helmet-async";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import ToolsGrid from "./components/ToolsGrid";
import HowToWork from "./components/HowToWork";
import Home from "./components/Home";
import ScrollToTop from "./components/ScrollToTop";
import ErrorBoundary from "./components/ErrorBoundary";
import { LOGO_BASE64 } from "./components/logo";
import { TOOLS, Tool } from "./constants";
import { Mail } from "lucide-react";

const ResultPage = lazy(() => import("./components/ResultPage"));

// FAQ data for FAQ page
const FAQsData = [
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

// Legal and Info Pages
const About = () => (
  <div className="min-h-screen bg-white">
    <h1 className="sr-only">About Getinbex</h1>
    <Helmet>
      <title>About Getinbex | Private Snapchat Tools & Resources</title>
      <meta name="description" content="Learn about Getinbex, the premier destination for anonymous Snapchat tools. We prioritize privacy, security, and accessibility for all users worldwide." />
      <link rel="canonical" href="https://getinbex.com/about" />
      <meta property="og:title" content="About Getinbex | Private Snapchat Tools" />
      <meta property="og:description" content="Learn about Getinbex, the premier destination for anonymous Snapchat tools. We prioritize privacy, security, and accessibility." />
      <meta property="og:url" content="https://getinbex.com/about" />
      <meta name="robots" content="index, follow" />
      <script type="application/ld+json">
      {JSON.stringify({
        "@context": "https://schema.org",
        "@type": "AboutPage",
        "name": "About Getinbex",
        "description": "Information about Getinbex anonymous Snapchat tools and mission",
        "url": "https://getinbex.com/about",
        "mainEntity": {
          "@type": "Organization",
          "name": "Getinbex",
          "url": "https://getinbex.com",
          "logo": "https://getinbex.com/Logo.png",
          "description": "Ultimate anonymous Snapchat toolset for viewing stories, downloading spotlights, and exploring profiles with 100% privacy",
          "areaServed": "Worldwide",
          "priceRange": "Free"
        }
      })}
      </script>
    </Helmet>

    {/* ABOUT GETINBEX SECTION - Same as Home Page */}
    <section className="home-section" style={{ paddingTop: "80px" }}>
      <div className="home-section-header">
        <h2>About Getinbex</h2>
        <p>Getinbex is a premium online tool suite built to make social media content effortlessly accessible. Right now, it specializes in Snapchat — letting you view and download profile pictures, stories, spotlight clips, videos, and more without ever needing to sign in.</p>
        <p className="mt-6">Everything is delivered in original quality up to crisp 4K resolution, with no watermarks, no ads, and no tracking. Just paste a link and save what you need — fast, anonymous, and 100% free for everyone.</p>
      </div>
    </section>

    {/* COMPARISON SECTION - Same as Home Page */}
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
  </div>
);

const Contact = () => (
  <div className="max-w-4xl mx-auto py-24 px-4">
    <Helmet>
      <title>Contact Getinbex | Technical Support & Feedback</title>
      <meta name="description" content="Get in touch with the Getinbex team for technical support, feedback, or any questions about our free Snapchat tools. Email us at support@getinbex.com." />
      <link rel="canonical" href="https://getinbex.com/contact" />
      <meta property="og:title" content="Contact Us | Getinbex Support" />
      <meta property="og:description" content="Get in touch with the Getinbex team for technical support, feedback, or any questions about our free Snapchat tools." />
      <meta property="og:url" content="https://getinbex.com/contact" />
      <meta name="robots" content="index, follow" />
      <script type="application/ld+json">
      {JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ContactPage",
        "name": "Contact Getinbex",
        "description": "Contact information for Getinbex support team",
        "url": "https://getinbex.com/contact",
        "mainEntity": {
          "@type": "Organization",
          "name": "Getinbex",
          "url": "https://getinbex.com",
          "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "Customer Support",
            "email": "support@getinbex.com",
            "availableLanguage": "en",
            "areaServed": "Worldwide"
          }
        }
      })}
      </script>
    </Helmet>
    <h1 className="text-4xl font-black mb-8 text-gray-900">Contact Us</h1>
    <div className="space-y-6 text-gray-700 leading-relaxed font-medium">
      <p>Have questions, technical issues, or feedback? We'd love to hear from you. Our team is constantly working to improve Getinbex tools.</p>
      <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100 mt-8">
        <p className="font-bold text-gray-900 mb-2">Email Support:</p>
        <a href="mailto:support@getinbex.com" className="text-snap-brand hover:underline text-lg font-black">support@getinbex.com</a>
      </div>
      <p className="text-sm text-gray-400 mt-12 italic">We typically respond to all inquiries within 24-48 business hours.</p>
    </div>
  </div>
);

const PrivacyPolicy = () => (
  <div className="max-w-4xl mx-auto py-24 px-4">
    <Helmet>
      <title>Privacy Policy | Getinbex - 100% Anonymous</title>
      <meta name="description" content="Read our privacy policy to understand how Getinbex protects your data and ensures 100% anonymous browsing of Snapchat content with zero tracking." />
      <link rel="canonical" href="https://getinbex.com/privacy" />
      <meta name="robots" content="index, follow" />
      <script type="application/ld+json">
      {JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Privacy Policy",
        "description": "Getinbex privacy policy and data protection information",
        "url": "https://getinbex.com/privacy",
        "isPartOf": {
          "@type": "WebSite",
          "name": "Getinbex"
        },
        "mainEntity": {
          "@type": "Organization",
          "name": "Getinbex",
          "url": "https://getinbex.com"
        }
      })}
      </script>
    </Helmet>
    <h1 className="text-4xl font-black mb-8 text-gray-900">Privacy Policy</h1>
    <div className="space-y-8 text-gray-700 leading-relaxed font-medium">
      <section>
        <h2 className="text-2xl font-bold mb-4 text-gray-900">1. Commitment to Privacy</h2>
        <p>At Getinbex, we take your privacy seriously. We do not collect, store, or track personal information from our visitors. Our service is designed to be completely anonymous.</p>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4 text-gray-900">2. No Data Logging</h2>
        <p>We do not store or log your search history, URL submissions, or the content you view. Every session is ephemeral and disappears as soon as you close the tab.</p>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4 text-gray-900">3. Third-Party Services</h2>
        <p>We do not share any usage data with third parties. All requests are processed through our secure servers to shield your identity from the platform's original source.</p>
      </section>
    </div>
  </div>
);

const FAQ = () => {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  return (
    <div className="bg-white">
      <h1 className="sr-only">Frequently Asked Questions</h1>
      <Helmet>
        <title>FAQ | Getinbex - Frequently Asked Questions</title>
        <meta name="description" content="Find answers to frequently asked questions about Getinbex, our Snapchat tools, privacy, safety, and more." />
        <link rel="canonical" href="https://getinbex.com/faq" />
        <meta property="og:title" content="FAQ | Getinbex" />
        <meta property="og:description" content="Frequently asked questions about Getinbex Snapchat tools" />
        <meta property="og:url" content="https://getinbex.com/faq" />
        <meta name="robots" content="index, follow" />
      </Helmet>

      {/* FAQ SECTION - Same as Home Page */}
      <section className="home-section" style={{ paddingTop: "120px" }}>
        <div className="home-section-header">
          <h2>FAQ</h2>
          <p>Everything you need to know about Getinbex — our tools, features, privacy, and more.</p>
        </div>
        
        <div className="home-faq-list">
          {FAQsData.map((faq) => (
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
      </section>
    </div>
  );
};

const TermsOfService = () => (
  <div className="max-w-4xl mx-auto py-24 px-4">
    <Helmet>
      <title>Terms of Service | Getinbex Usage Policy</title>
      <meta name="description" content="Read the terms of service and acceptable use policy for Getinbex free Snapchat downloader and viewer tools. Understand your rights and responsibilities." />
      <link rel="canonical" href="https://getinbex.com/terms" />
      <meta name="robots" content="index, follow" />
      <script type="application/ld+json">
      {JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Terms of Service",
        "description": "Getinbex terms of service and acceptable use policy",
        "url": "https://getinbex.com/terms",
        "isPartOf": {
          "@type": "WebSite",
          "name": "Getinbex"
        },
        "mainEntity": {
          "@type": "Organization",
          "name": "Getinbex",
          "url": "https://getinbex.com"
        }
      })}
      </script>
    </Helmet>
    <h1 className="text-4xl font-black mb-8 text-gray-900">Terms of Service</h1>
    <div className="space-y-8 text-gray-700 leading-relaxed font-medium">
      <section>
        <h2 className="text-2xl font-bold mb-4 text-gray-900">1. Acceptance of Terms</h2>
        <p>By using Getinbex, you agree to use our tools responsibly and for lawful purposes. Our services are intended for viewing and interaction with public content only.</p>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4 text-gray-900">2. Prohibited Use</h2>
        <p>Users must not use Getinbex to harass, stalk, or infringe upon the privacy of others. Any misuse of the service that violates platform policies or local laws is strictly prohibited.</p>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-4 text-gray-900">3. Disclaimer</h2>
        <p>Getinbex is an independent toolset and is not affiliated, associated, authorized, endorsed by, or in any way officially connected with Snap Inc. or Snapchat.</p>
      </section>
    </div>
  </div>
);

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col selection:bg-snap-yellow/30">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      
      {/* Feedback Button */}
      <button className="fixed bottom-6 left-6 z-40 bg-[#25D366] hover:bg-green-600 text-white flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl transition-all transform hover:scale-105 active:scale-95 text-sm font-bold">
        <Mail className="w-5 h-5" />
        Share Feedback
      </button>

      <footer className="py-16 border-t border-gray-100 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <img src={LOGO_BASE64} alt="Getinbex Official Logo - Anonymous Snapchat Tools" className="w-8 h-8 object-contain" />
                <span className="font-bold text-xl">Getinbex</span>
              </div>
              <p className="text-gray-500 text-sm max-w-sm">
                The ultimate anonymous Snapchat toolset. View stories, download spotlights, and explore profiles with 100% privacy and zero trackers.
              </p>
            </div>
            <div className="pl-4">
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-snap-brand">Home</Link></li>
                <li><Link to="/about" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-snap-brand">About Us</Link></li>
                <li><Link to="/contact" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-snap-brand">Contact</Link></li>
              </ul>
            </div>
            <div className="md:border-l md:border-gray-300/80 md:pl-6">
              <h4 className="font-bold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link to="/faq" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-snap-brand">FAQ</Link></li>
                <li><Link to="/privacy" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-snap-brand">Privacy Policy</Link></li>
                <li><Link to="/terms" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-snap-brand">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-200 text-center">
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">
              © 2026 Getinbex Tools. This site is not affiliated with Snapchat or Snap Inc.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <Router>
          <ScrollToTop />
          <Layout>
            <Routes>
              <Route 
                path="/" 
                element={
                  <>
                    <Helmet>
                      <title>Getinbex | 100% Free Anonymous Snapchat Tools - View, Download & Explore</title>
                      <meta name="description" content="Ultimate toolset for Snapchat: View stories anonymously, download spotlight videos, lookup profiles and search usernames without watermark or registration. 100% free, no account needed." />
                      <link rel="canonical" href="https://getinbex.com/" />
                      <meta property="og:title" content="Getinbex | 100% Free Anonymous Snapchat Tools" />
                      <meta property="og:description" content="View stories, download spotlights, lookup profiles & search Snapchat users - all 100% anonymously and for free" />
                      <meta property="og:url" content="https://getinbex.com" />
                      <meta name="twitter:title" content="Getinbex | 100% Free Anonymous Snapchat Tools" />
                      <meta name="twitter:description" content="View stories, download spotlights, lookup profiles & search Snapchat users - all 100% anonymously and for free" />
                      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
                      <script type="application/ld+json">
                      {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebSite",
                        "name": "Getinbex",
                        "url": "https://getinbex.com",
                        "description": "Ultimate toolset for Snapchat: View stories, download spotlights, lookup profiles, search users - all anonymously and for free",
                        "potentialAction": {
                          "@type": "SearchAction",
                          "target": {
                            "@type": "EntryPoint",
                            "urlTemplate": "https://getinbex.com/profile-viewer?search={search_term_string}"
                          },
                          "query-input": "required name=search_term_string"
                        }
                      })}
                      </script>
                      <script type="application/ld+json">
                      {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "BreadcrumbList",
                        "itemListElement": [
                          {
                            "@type": "ListItem",
                            "position": 1,
                            "name": "Home",
                            "item": "https://getinbex.com"
                          }
                        ]
                      })}
                      </script>
                    </Helmet>
                    <Home />
                  </>
                } 
              />
              <Route path="/result" element={<Suspense fallback={null}><ResultPage /></Suspense>} />
              {TOOLS.map((tool) => (
                <Route 
                  // @ts-ignore - RouteProps key issue
                  key={tool.id}
                  path={tool.path} 
                  element={<ToolPageRoute tool={tool} />}
                />
              ))}
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
            </Routes>
          </Layout>
        </Router>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

function ToolFAQAccordion({ tool }: { tool: Tool }) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: `What is ${tool.name}?`,
      answer: tool.description
    },
    {
      question: "How do I use this tool?",
      answer: "Simply enter the Snapchat username or link you want to search for, and click the button. Our tool will fetch and display the results in seconds."
    },
    {
      question: "Is this tool 100% free?",
      answer: "Yes, all Getinbex tools are completely free to use with no hidden charges, premium features, or ads."
    },
    {
      question: "Do I need to create an account?",
      answer: "No, Getinbex tools work without any account creation, registration, or login. Complete anonymity guaranteed."
    },
    {
      question: "Is my data tracked?",
      answer: "No. We do not track, store, or log any of your data. Your privacy is our absolute priority. All sessions are completely anonymous."
    },
    {
      question: "Is it legal to use this tool?",
      answer: "Our tools only access public content from Snapchat. Using tools to view public content is legal. However, always respect privacy and follow Snapchat's terms of service."
    },
    {
      question: "What devices does this work on?",
      answer: "Getinbex works on all devices with a web browser - desktop, laptop, tablet, and mobile phones. No app installation required."
    },
    {
      question: "Do you store downloaded content?",
      answer: "No. Downloaded content is processed through our servers temporarily and immediately deleted. We do not store any user data or downloaded files."
    }
  ];

  return (
    <div className="home-faq-list text-left">
      {faqs.map((faq, idx) => (
        <div key={idx} className="home-faq-item">
          <div 
            className="home-faq-question-header"
            onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
          >
            <h3>{faq.question}</h3>
            <span className="home-faq-toggle">
              {expandedIndex === idx ? '−' : '+'}
            </span>
          </div>
          {expandedIndex === idx && (
            <div className="home-faq-answer">
              <p>{faq.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ToolPageRoute({ tool }: { tool: Tool }) {
  return (
    <>
      <Helmet>
        <title>{tool.title} | Getinbex Anonymous Tools</title>
        <meta name="description" content={tool.description} />
        <link rel="canonical" href={`https://getinbex.com${tool.path}`} />
        <meta property="og:title" content={`${tool.title} | Getinbex`} />
        <meta property="og:description" content={tool.description} />
        <meta property="og:url" content={`https://getinbex.com${tool.path}`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:title" content={`${tool.title} | Getinbex`} />
        <meta name="twitter:description" content={tool.description} />
        <meta property="og:image" content="https://getinbex.com/Logo.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Getinbex - Anonymous Snapchat Tools" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://getinbex.com/Logo.png" />
        <meta name="robots" content="index, follow" />
        <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://getinbex.com"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": tool.name,
              "item": `https://getinbex.com${tool.path}`
            }
          ]
        })}
        </script>
        <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": tool.name,
          "description": tool.description,
          "url": `https://getinbex.com${tool.path}`,
          "applicationCategory": "UtilityApplication",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          "operatingSystem": "Web",
          "creator": {
            "@type": "Organization",
            "name": "Getinbex"
          }
        })}
        </script>
        <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": `What is ${tool.name}?`,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": tool.description
              }
            },
            {
              "@type": "Question",
              "name": "How do I use this tool?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Simply enter the Snapchat username or link you want to search for, and click the button. Our tool will fetch and display the results in seconds."
              }
            },
            {
              "@type": "Question",
              "name": "Is this tool 100% free?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, all Getinbex tools are completely free to use with no hidden charges, premium features, or ads."
              }
            },
            {
              "@type": "Question",
              "name": "Do I need to create an account?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "No, Getinbex tools work without any account creation, registration, or login. Complete anonymity guaranteed."
              }
            },
            {
              "@type": "Question",
              "name": "Is my data tracked?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "No. We do not track, store, or log any of your data. Your privacy is our absolute priority. All sessions are completely anonymous."
              }
            },
            {
              "@type": "Question",
              "name": "Is it legal to use this tool?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Our tools only access public content from Snapchat. Using tools to view public content is legal. However, always respect privacy and follow Snapchat's terms of service."
              }
            },
            {
              "@type": "Question",
              "name": "What devices does this work on?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Getinbex works on all devices with a web browser - desktop, laptop, tablet, and mobile phones. No app installation required."
              }
            },
            {
              "@type": "Question",
              "name": "Do you store downloaded content?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "No. Downloaded content is processed through our servers temporarily and immediately deleted. We do not store any user data or downloaded files."
              }
            }
          ]
        })}
        </script>
      </Helmet>
      <HeroSection 
        toolId={tool.id}
        title={tool.title}
        description={tool.description}
        placeholder={tool.placeholder}
        buttonText={tool.buttonText}
        highlightedWord={tool.highlightedWord}
        examples={tool.examples}
      />
      <ToolsGrid />
      <HowToWork tool={tool} />

      {/* ABOUT GETINBEX SECTION - Same as Home Page */}
      <section className="home-section pt-16 pb-24">
        <div className="home-section-header">
          <h2>About Getinbex</h2>
          <p>Getinbex is a premium online tool suite built to make social media content effortlessly accessible. Right now, it specializes in Snapchat — letting you view and download profile pictures, stories, spotlight clips, videos, and more without ever needing to sign in.</p>
          <p className="mt-6">Everything is delivered in original quality up to crisp 4K resolution, with no watermarks, no ads, and no tracking. Just paste a link and save what you need — fast, anonymous, and 100% free for everyone.</p>
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

      {/* COMPARISON SECTION - Same as Home Page */}
      <section className="home-section pt-16 pb-24">
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

      {/* TOOL FAQ SECTION */}
      <section className="home-section pt-16 pb-24">
        <div className="home-section-header">
          <h2>Frequently Asked Questions</h2>
          <p>Got questions about using {tool.name}? Here are answers to the most common queries.</p>
        </div>
        <ToolFAQAccordion tool={tool} />
      </section>
    </>
  );
}

