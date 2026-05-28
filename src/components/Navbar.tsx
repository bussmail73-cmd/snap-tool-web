import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  ChevronDown, 
  Menu,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LOGO_BASE64 } from "./logo";
import { TOOLS } from "../constants";

function Navbar() {
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(false);
  const location = useLocation();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const currentToolName = useMemo(() => {
    const tool = TOOLS.find((t) => t.path === location.pathname);
    return tool ? tool.name.split(" ").slice(-2).join(" ") : "Premium Tools";
  }, [location.pathname]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsToolsOpen(false);
    setIsMobileToolsOpen(false);
  }, [location.pathname]);

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-16">
          {/* Logo & Brand */}
          <Link to="/" onClick={scrollToTop} className="flex items-center gap-2 group shrink-0">
            <div className="w-8 h-8 md:w-9 md:h-9 shrink-0">
              <img src={LOGO_BASE64} alt="Getinbex Official Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] md:text-sm font-bold text-gray-900 leading-tight">Getinbex</span>
              <span className="text-[9px] md:text-[10px] text-gray-400 font-bold leading-tight tracking-wider uppercase">
                {currentToolName}
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-6">
            <Link to="/" onClick={scrollToTop} className="text-sm font-bold text-gray-900 hover:text-snap-brand-dark transition-colors">
              Home
            </Link>
            
            <div className="relative" onMouseEnter={() => setIsToolsOpen(true)} onMouseLeave={() => setIsToolsOpen(false)}>
              <button className="flex items-center gap-1 text-sm font-bold text-gray-900 hover:text-snap-brand-dark transition-colors">
                Tools <ChevronDown className={`w-4 h-4 transition-transform ${isToolsOpen ? "rotate-180" : ""}`} />
              </button>
              
              {isToolsOpen && (
                <div className="absolute top-full -left-4 w-64 bg-white shadow-xl rounded-xl border border-gray-50 py-2 mt-0 z-50">
                  {TOOLS.map((tool) => (
                    <Link
                      key={tool.id}
                      to={tool.path}
                      onClick={scrollToTop}
                      className={`flex items-center gap-3 px-4 py-2.5 text-[13px] font-bold hover:bg-gray-50 transition-colors ${location.pathname === tool.path ? "text-snap-brand" : "text-gray-700"}`}
                    >
                      {tool.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link to="/about" onClick={scrollToTop} className="text-sm font-bold text-gray-900 hover:text-snap-brand-dark transition-colors">About</Link>
            <Link to="/blog" onClick={scrollToTop} className="text-sm font-bold text-gray-900 hover:text-snap-brand-dark transition-colors">Blog</Link>
            <Link to="/faq" onClick={scrollToTop} className="text-sm font-bold text-gray-900 hover:text-snap-brand-dark transition-colors">FAQ</Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <button 
              className="lg:hidden w-10 h-10 flex items-center justify-center text-gray-900"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="lg:hidden bg-white border-t border-gray-100"
          >
            <div className="px-4 py-6 space-y-4">
              <Link to="/" onClick={scrollToTop} className="block text-sm font-bold text-gray-900 px-2">Home</Link>
              
              <div className="space-y-1">
                <button 
                  onClick={() => setIsMobileToolsOpen(!isMobileToolsOpen)}
                  className="w-full flex items-center justify-between text-sm font-bold text-gray-900 px-2 py-2"
                >
                  Tools
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isMobileToolsOpen ? "rotate-180" : ""}`} />
                </button>
                
                <AnimatePresence>
                  {isMobileToolsOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-1 gap-1 pl-4 mt-2 border-l-2 border-gray-50">
                        {TOOLS.map((tool) => (
                          <Link
                            key={tool.id}
                            to={tool.path}
                            onClick={scrollToTop}
                            className={`flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-[13px] font-bold ${location.pathname === tool.path ? "text-snap-brand bg-gray-50" : "text-gray-600"}`}
                          >
                            {tool.name}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link to="/about" onClick={scrollToTop} className="block text-sm font-bold text-gray-900 px-2">About</Link>
              <Link to="/blog" onClick={scrollToTop} className="block text-sm font-bold text-gray-900 px-2">Blog</Link>
              <Link to="/faq" onClick={scrollToTop} className="block text-sm font-bold text-gray-900 px-2">FAQ</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default React.memo(Navbar);

