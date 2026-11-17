// frontend/src/components/ui/VideoLoadingScreen.jsx
import React, { useState, useEffect, useRef } from 'react';

const VideoLoadingScreen = ({ connected }) => {
  const [isVisible, setIsVisible] = useState(!connected);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  const videoRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (connected) {
      setIsFadingOut(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(true);
      setIsFadingOut(false);
    }
  }, [connected]);

  // Ensure instant, continuous, butter-smooth video playback
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 1.0;
      videoRef.current.play().catch(() => {});
    }
  }, [isVisible, isDesktop]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-end bg-black text-white select-none overflow-hidden transition-opacity duration-500 ease-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Full-Screen Video Background: Native 16:9 on PC and 9:16 on Phone */}
      <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden bg-black">
        <video
          ref={videoRef}
          key={isDesktop ? 'desktop-video' : 'mobile-video'}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster={
            isDesktop
              ? '/videos/loading_desktop_poster.png'
              : '/videos/loading_fullscreen_poster.png'
          }
          className="w-full h-full object-cover pointer-events-none select-none"
        >
          {isDesktop ? (
            <>
              <source src="/videos/loading_desktop.webm" type="video/webm" />
              <source src="/videos/loading_desktop.mp4" type="video/mp4" />
            </>
          ) : (
            <>
              <source src="/videos/loading_fullscreen.webm" type="video/webm" />
              <source src="/videos/loading_fullscreen.mp4" type="video/mp4" />
            </>
          )}
        </video>

        {/* Cinematic Vignette Overlay to maintain contrast for Footer */}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/85 via-transparent to-black/60 pointer-events-none" />
      </div>

      {/* Real Chinese Dragon Connection Console */}
      <footer className="relative z-20 w-full max-w-2xl px-3 sm:px-4 pb-4 sm:pb-6 flex flex-col items-center">
        {/* The Coiled Chinese Dragon Real 3D Frame */}
        <div className="relative w-full aspect-[1376/768] max-h-[220px] sm:max-h-[260px] flex items-center justify-center">
          {/* Photorealistic 3D Chinese Dragon Frame */}
          <img
            src="/images/real_chinese_dragon_frame.webp"
            alt="Real Chinese Dragon"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none z-0 filter drop-shadow-[0_0_25px_rgba(16,185,129,0.35)]"
          />

          {/* Foreground Content Nested Seamlessly Inside Dragon's Framed Card */}
          <div
            className="absolute flex flex-col justify-between z-10 px-2.5 py-1 sm:px-4 sm:py-2"
            style={{
              left: '20%',
              top: '32%',
              width: '61%',
              height: '38%',
            }}
          >
            {/* Top Row: Flaming Dragon Pearl Indicator + Text */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-2.5 min-w-0">
                {/* The Legendary Flaming Dragon Pearl (Indicator) */}
                <div className="relative flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                  <span className="absolute w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-dashed border-teal-300 animate-[spin_4s_linear_infinite]" />
                  <span className="relative flex items-center justify-center w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-300 to-white shadow-[0_0_8px_rgba(52,211,153,1)]">
                    <span className="w-1 h-1 rounded-full bg-white shadow-sm" />
                  </span>
                </div>

                <h3 className="text-[11px] sm:text-xs md:text-sm font-semibold tracking-wide text-neutral-100 flex items-center truncate">
                  Connecting to chat server
                  <span className="inline-flex tracking-tighter text-emerald-400 ml-0.5">
                    <span className="animate-pulse">.</span>
                    <span className="animate-pulse delay-150">.</span>
                    <span className="animate-pulse delay-300">.</span>
                  </span>
                </h3>
              </div>

              {/* Right: Dragon Seal Tag */}
              <div className="hidden xs:flex sm:flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-[9px] font-mono text-emerald-300 shadow-sm shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold tracking-wider">TLS 1.3</span>
              </div>
            </div>

            {/* Middle Row: Dragon Qi Energy Progress Track */}
            <div className="w-full my-0.5 sm:my-1">
              <div className="w-full h-1 sm:h-1.5 bg-black/80 rounded-full border border-emerald-500/30 overflow-hidden relative shadow-inner p-[0.5px]">
                <div className="h-full bg-gradient-to-r from-emerald-500 via-teal-200 to-emerald-400 animate-modern-loading-bar rounded-full shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
              </div>
            </div>

            {/* Bottom Row: Exact Status Text */}
            <div className="flex items-center justify-between text-[8px] sm:text-[10px] md:text-xs font-mono text-neutral-400 leading-none">
              <span className="text-neutral-300 truncate">
                Establishing connection
              </span>
              <span className="text-emerald-400 font-medium tracking-wide shrink-0 ml-1.5">
                Please wait...
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default VideoLoadingScreen;
