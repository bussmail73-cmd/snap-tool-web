import React from "react";
import { Link } from "react-router-dom";
import { TOOLS } from "../constants";
import { SNAPCHAT_BASE64 } from "./logo";

function ToolsGrid() {
  return (
    <section className="home-section" id="tools">
      <div className="home-section-header">
        <h2>Our Tools</h2>
        <p>Explore our professional suite of Snapchat utility tools designed for a seamless and private experience.</p>
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
              className="home-tool-card block no-underline text-inherit hover:text-inherit"
              title={`${tool.name} - ${tool.description}`}
            >
              <div className="home-tool-card-inner">
                <div className="home-tool-icon" aria-label={tool.name}>
                  <IconComponent className="w-6 h-6" aria-hidden="true" />
                </div>
                <div className="home-tool-content">
                  <h3>{tool.name}</h3>
                  <p>{tool.id === "spotlight-downloader" ? tool.description : `${tool.description.split('.')[0]}.`}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default React.memo(ToolsGrid);
