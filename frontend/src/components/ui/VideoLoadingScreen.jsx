// frontend/src/components/ui/VideoLoadingScreen.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, MessageSquare, Wifi } from 'lucide-react';

const VideoLoadingScreen = ({ connected }) => {
  const [isVisible, setIsVisible] = useState(!connected);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);

  useEffect(() => {
    if (connected) {
      setIsFadingOut(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 550);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(true);
      setIsFadingOut(false);
    }
  }, [connected]);

  // Attempt auto-play when visible
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Browser autoplay restriction, fallback to muted play
        if (videoRef.current) {
          videoRef.current.muted = true;
          setIsMuted(true);
          videoRef.current.play().catch(() => {});
        }
      });
    }
  }, [isVisible]);

  const toggleSound = (e) => {
    e.stopPropagation();
    if (videoRef.current) {
      const nextMuted = !videoRef.current.muted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
      if (!nextMuted) {
        videoRef.current.play().catch(() => {});
      }
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-between bg-black text-white select-none overflow-hidden transition-opacity duration-500 ease-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* 1. Ambient blurred background video for widescreen display */}
      <video
        src="/videos/loading_screen.mp4"
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover filter blur-3xl opacity-35 scale-110 pointer-events-none"
      />

      {/* Dark gradient overlay for deep contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none z-0" />

      {/* Top Header Overlay */}
      <header className="relative z-20 w-full max-w-5xl px-5 py-4 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-2.5 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 shadow-lg">
          <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <MessageSquare className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm tracking-wide text-white">Chattr</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>

        {/* Audio Toggle Button */}
        <button
          onClick={toggleSound}
          type="button"
          aria-label={isMuted ? 'Unmute video audio' : 'Mute video audio'}
          className="flex items-center space-x-2 bg-black/40 hover:bg-black/60 active:scale-95 transition-all backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-xs font-medium text-neutral-200 shadow-lg"
        >
          {isMuted ? (
            <>
              <VolumeX className="w-4 h-4 text-neutral-400" />
              <span className="hidden sm:inline">Unmute Sound</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="hidden sm:inline text-emerald-300">Sound On</span>
            </>
          )}
        </button>
      </header>

      {/* 2. Main Central Video Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center w-full px-0 sm:px-4 py-2">
        <div className="relative w-full h-full sm:h-auto sm:max-w-[440px] sm:max-h-[75vh] flex items-center justify-center">
          <video
            ref={videoRef}
            src="/videos/loading_screen.mp4"
            poster="/videos/loading_poster.jpg"
            autoPlay
            loop
            muted={isMuted}
            playsInline
            className="w-full h-full object-contain sm:object-cover sm:rounded-3xl sm:border sm:border-white/15 sm:shadow-[0_0_50px_rgba(0,0,0,0.85)]"
          />
        </div>
      </main>

      {/* 3. Floating Bottom Connection Status Bar */}
      <footer className="relative z-20 w-full max-w-md px-4 pb-6 sm:pb-8 flex flex-col items-center">
        <div className="w-full bg-black/60 backdrop-blur-xl border border-white/15 rounded-2xl p-4 shadow-2xl text-center space-y-3">
          {/* Status text with live icon */}
          <div className="flex items-center justify-center space-x-2 text-sm font-semibold text-neutral-100">
            <Wifi className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Connecting to chat server...</span>
          </div>

          {/* Glowing Animated Loading Bar */}
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden relative shadow-inner">
            <div className="h-full bg-gradient-to-r from-emerald-500 via-teal-300 to-emerald-500 animate-modern-loading-bar rounded-full"></div>
          </div>

          {/* Subtext info */}
          <div className="flex items-center justify-between text-[11px] text-neutral-400 font-medium px-1">
            <span>Establishing connection</span>
            <span className="text-emerald-400 font-medium animate-pulse">Please wait...</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default VideoLoadingScreen;
