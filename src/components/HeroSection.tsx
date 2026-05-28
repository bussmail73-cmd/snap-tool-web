import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { CheckCircle2, ClipboardPaste, AlertCircle, Check, Zap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { validateToolInput, extractUrlFromText } from "../lib/validation";
import { useNavigate } from "react-router-dom";
import { TOOLS } from "../constants";

interface HeroSectionProps {
  toolId: string;
  title: string;
  description: string;
  placeholder: string;
  buttonText: string;
  highlightedWord: string;
  examples: string[];
}

export default function HeroSection({ toolId, title, description, placeholder, buttonText, highlightedWord, examples }: HeroSectionProps) {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [suggestedToolId, setSuggestedToolId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMounted = useRef(true);

  // Set isMounted ref status
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Reset state when switching tools
  useEffect(() => {
    setInputValue("");
    setIsLoading(false);
    setHasError(false);
    setErrorMsg("");
    setSuggestedToolId(null);
  }, [toolId]);

  const handleAction = useCallback(async () => {
    const cleanedInput = extractUrlFromText(inputValue);
    if (cleanedInput !== inputValue) {
      setInputValue(cleanedInput);
    }

    const result = validateToolInput(toolId, cleanedInput);
    
    if (!result.isValid) {
      setHasError(true);
      setErrorMsg(result.error || "Invalid input");
      setSuggestedToolId(result.suggestedTool || null);
      if (inputRef.current) inputRef.current.focus();
      return;
    }
    
    setIsLoading(true);
    setHasError(false);
    setErrorMsg("");
    setSuggestedToolId(null);

    try {
      let endpoint = '/api/download';
      let body: any = { url: cleanedInput, toolId };

      // Clean URLs - remove query params and hash
      if ((toolId === "spotlight-downloader" || toolId === "video-downloader") && cleanedInput.includes("?")) {
        body.url = cleanedInput.split("?")[0].split("#")[0];
      }

      if (toolId === "profile-dp-downloader") {
        endpoint = '/api/dp';
        body = { username: cleanedInput };
      } else if (toolId === "profile-viewer") {
        endpoint = '/api/profile-viewer';
        body = { username: cleanedInput };
      } else if (toolId === "story-viewer") {
        endpoint = '/api/story-viewer';
        body = { username: cleanedInput };
      } else if (toolId === "story-downloader") {
        endpoint = '/api/story-downloader';
        body = { username: cleanedInput };
      } else if (toolId === "video-downloader") {
        endpoint = '/api/bulk-videos';
        body = { username: cleanedInput };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!isMounted.current) return;

      if (!response.ok) {
        throw new Error(data.error || "Failed to process link");
      }

      navigate("/result", { state: { result: data, toolId } });
    } catch (err: any) {
      if (!isMounted.current) return;
      setHasError(true);
      setErrorMsg(err.message || "An error occurred");
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [toolId, inputValue, navigate]);

  const handleGoToSuggestedTool = useCallback(() => {
    if (suggestedToolId) {
      const tool = TOOLS.find((t) => t.id === suggestedToolId);
      if (tool) {
        navigate(tool.path);
        setHasError(false);
        setErrorMsg("");
        setSuggestedToolId(null);
      }
    }
  }, [suggestedToolId, navigate]);

  const handlePaste = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Always focus the input first so the user can paste manually if API fails
    if (inputRef.current) {
      inputRef.current.focus();
    }

    // Check if Clipboard API is available (requires HTTPS or localhost)
    if (!navigator.clipboard || !navigator.clipboard.readText) {
      setHasError(true);
      setErrorMsg("⚠️ Paste blocked: your browser requires a secure HTTPS connection for clipboard access. Please paste manually using Ctrl+V (keyboard shortcut).");
      return;
    }

    try {
      // Check clipboard read permission first if available
      if (navigator.permissions) {
        try {
          const permResult = await navigator.permissions.query({ name: 'clipboard-read' as PermissionName });
          if (permResult.state === 'denied') {
            setHasError(true);
            setErrorMsg("Clipboard permission denied by browser. Please paste manually using Ctrl+V.");
            return;
          }
        } catch {
          // permissions.query may not support clipboard-read in some browsers, continue
        }
      }

      const text = await navigator.clipboard.readText();
      if (!isMounted.current) return;
      if (text && text.trim()) {
        setInputValue(text.trim());
        setHasError(false);
        setErrorMsg("");
      } else {
        setHasError(true);
        setErrorMsg("Clipboard appears to be empty. Please copy a Snapchat link first, then click Paste.");
      }
    } catch (err: any) {
      if (!isMounted.current) return;
      if (err?.name === 'NotAllowedError') {
        setHasError(true);
        setErrorMsg("Clipboard access was denied. Please click 'Allow' when your browser asks for clipboard permission, or paste manually using Ctrl+V.");
      } else {
        setHasError(true);
        setErrorMsg("Could not read clipboard. Please paste manually using Ctrl+V.");
      }
    }
  }, []);

  const renderTitle = useMemo(() => {
    if (!highlightedWord) return title;
    
    const parts = title.split(highlightedWord);
    return (
      <>
        {parts[0]}
        <span className="scribble-container">
          {highlightedWord}
          <svg viewBox="0 0 200 60" className="scribble-svg" preserveAspectRatio="none">
            <path 
              d="M10,40 Q50,30 90,45 T190,35 M15,50 Q60,40 110,55 T185,45" 
              className="scribble-path"
            />
          </svg>
        </span>
        {parts[1]}
      </>
    );
  }, [highlightedWord, title]);

  return (
    <div className="py-12 md:py-20 px-4 max-w-5xl mx-auto text-center">
      <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4 tracking-tight leading-tight">
        {renderTitle}
      </h1>

      <p className="text-sm md:text-md text-gray-600 mb-8 font-semibold min-h-[40px] md:min-h-[24px]">
        <span className="text-snap-brand font-black mr-1">100% FREE:</span>
        {description}
      </p>

      {/* Input Group */}
      <motion.div 
        animate={hasError ? { x: [-5, 5, -5, 5, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="max-w-4xl mx-auto mb-10"
      >
        <div className="flex flex-col md:flex-row gap-2">
          <div className="flex-1 relative group">
            <div className={`absolute inset-0 bg-white rounded-lg shadow-sm border transition-all duration-300 ${hasError ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-100 group-focus-within:border-snap-brand group-focus-within:ring-4 group-focus-within:ring-snap-brand/10'}`} />
            <div className="relative flex items-center h-14 md:h-14 px-5">
              <input 
                ref={inputRef}
                type="text" 
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  if (hasError) setHasError(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAction();
                  }
                }}
                placeholder={placeholder}
                className="flex-1 bg-transparent border-none outline-none text-gray-700 font-medium placeholder:text-gray-500 text-sm md:text-base text-left"
              />
              <button 
                onClick={handlePaste}
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-snap-brand/10 hover:bg-snap-brand/20 text-snap-brand rounded-md transition-colors ml-2 group shrink-0"
                title="Paste from clipboard"
              >
                <ClipboardPaste className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider hidden sm:inline">Paste</span>
              </button>
            </div>
          </div>
          <button 
            onClick={handleAction}
            disabled={isLoading}
            className="premium-action-btn active:scale-95 whitespace-nowrap gap-2 disabled:opacity-80 disabled:cursor-not-allowed group relative cursor-pointer"
          >
            {isLoading ? (
              <span className="flex items-center gap-1">
                Processing
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
                {buttonText} <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {hasError && errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center gap-3 mb-6"
          >
            <div className="flex items-center gap-2 text-red-500 font-bold text-sm">
              <AlertCircle className="w-4 h-4" />
              {errorMsg}
            </div>
            
            {suggestedToolId && (
              <button
                onClick={handleGoToSuggestedTool}
                className="flex items-center gap-2 px-4 py-2 bg-snap-brand/10 hover:bg-snap-brand/20 text-snap-brand rounded-full text-xs font-black uppercase tracking-widest transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                Go to {TOOLS.find(t => t.id === suggestedToolId)?.title || "Correct Tool"}
                <Check className="w-3 h-3" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Banner / Examples */}
      <div 
        className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 mb-10 inline-block w-full max-w-4xl text-[12px] md:text-[13px] font-bold text-gray-600 shadow-sm text-center"
      >
        Try searching with: {examples.map((ex, idx) => (
          <React.Fragment key={idx}>
            <span 
              onClick={() => setInputValue(ex)}
              className="text-snap-brand underline cursor-pointer hover:text-snap-brand-dark transition-colors"
            >
              {ex}
            </span>
            {idx < examples.length - 1 ? ", or " : ""}
          </React.Fragment>
        ))}
      </div>

      {/* Features Grid */}
      <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 opacity-80">
        {[
          { icon: CheckCircle2, text: "Ghost Mode Active" },
          { icon: CheckCircle2, text: "No Account Required" },
          { icon: CheckCircle2, text: "Unlimited Free Use" },
          { icon: CheckCircle2, text: "Data-Safe Browsing" }
        ].map((feature, i) => (
          <div 
            key={i}
            className="flex items-center gap-1.5"
          >
            <feature.icon className="w-4 h-4 text-snap-brand stroke-[3]" />
            <span className="text-[12px] md:text-[14px] font-bold text-gray-600 tracking-tight">
              {feature.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
