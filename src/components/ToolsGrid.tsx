import React from "react";
import { Link } from "react-router-dom";
import { TOOLS } from "../constants";
import { SNAPCHAT_BASE64 } from "./logo";

interface ToolsGridProps {
  heading?: string;
  description?: string;
}

function ToolsGrid({
  heading = "Our Tools",
  description = "Explore our professional suite of Snapchat utility tools designed for a seamless and private experience."
}: ToolsGridProps) {
  return (
    <section className="home-section" id="tools">
      <div className="home-section-header">
        <h2>{heading}</h2>
        <p>{description}</p>
        <div className="home-tools-branding">
          <img src={SNAPCHAT_BASE64} alt="Snapchat official social media logo - the original platform for all these tools" className="home-tools-branding-image" />
          <span className="home-tools-branding-text">Snapchat</span>
        </div>
      </div>
      <div className="home-tools-grid grid-cols-1 md:grid-cols-3">
        {TOOLS.map((tool) => {
          const IconComponent = tool.icon;
          return (
            <Link 
              key={tool.id} 
              to={tool.path}
              className="home-tool-card group block no-underline text-inherit hover:text-inherit"
              title={`${tool.name} - ${tool.description}`}
            >
              {/* Soft Colorful Moving Gradient Shine Overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-yellow-300/10 via-pink-400/10 to-purple-400/15 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out rounded-xl animate-gradient-shine pointer-events-none" />

              <div className="home-tool-card-inner relative z-10">
                <div className="home-tool-icon" aria-label={tool.name}>
                  <IconComponent className="w-6 h-6" aria-hidden="true" />
                </div>
                <div className="home-tool-content">
                  <h3>{tool.name}</h3>
                  <p>{tool.id === "spotlight-downloader" ? tool.description : `${tool.description.split('.')[0]}.`}</p>
                </div>
              </div>

              {/* Elegant Animated Corner Arrow with "Click" Text */}
              <div className="absolute bottom-3 right-4 flex items-center gap-1 text-slate-400 group-hover:text-purple-600 transition-colors duration-300 pointer-events-none select-none z-10">
                <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-out">
                  Click
                </span>
                <svg 
                  className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300 ease-out" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor" 
                  strokeWidth="3"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default React.memo(ToolsGrid);
