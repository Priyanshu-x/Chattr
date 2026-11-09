// frontend/src/components/chat/KiraAvatarPet.jsx
import React, { useState, useEffect, useRef } from 'react';

/**
 * KiraAvatarPet - Animated anime girl companion for AI Kira's messages
 * 
 * Sticker Wardrobe / Moods:
 * - 'idle': Default smiling winking pose with gentle sway
 * - 'cheer': Joyful fist pump cheer 'Yes!' with bouncy celebration
 * - 'singing': Singing with musical notes 🎵
 * - 'talking': Sassy / chatting mouth open 💬
 * - 'thinking': Pondering with question mark ❓
 * - 'surprised': Comical shocked / gasping face ⚡
 */
const MOOD_DATA = {
  idle: {
    src: '/stickers/kira_idle.webp',
    text: '🌸 Kira',
    anim: 'kira-pet-idle'
  },
  cheer: {
    src: '/stickers/kira_cheer.webp',
    text: '✨ Yay!',
    anim: 'kira-pet-happy'
  },
  happy: {
    src: '/stickers/kira_cheer.webp',
    text: '✨ Yay!',
    anim: 'kira-pet-happy'
  },
  singing: {
    src: '/stickers/kira_singing.webp',
    text: '🎶 La la la~',
    anim: 'kira-pet-happy'
  },
  talking: {
    src: '/stickers/kira_talking.webp',
    text: '💬 You called?',
    anim: 'kira-pet-talking'
  },
  thinking: {
    src: '/stickers/kira_thinking.webp',
    text: '💭 Thinking...',
    anim: 'kira-pet-thinking'
  },
  surprised: {
    src: '/stickers/kira_surprised.webp',
    text: '⚡ Whoa!',
    anim: 'kira-pet-surprised'
  }
};

// Mood rotation sequence when user clicks Kira
const CLICK_MOOD_CYCLE = ['cheer', 'singing', 'talking', 'thinking', 'surprised', 'idle'];

const KiraAvatarPet = ({ state = 'idle', onClick, className = '' }) => {
  const [clickMoodIndex, setClickMoodIndex] = useState(-1);
  const resetTimerRef = useRef(null);

  // Determine active mood: user click cycle overrides default state
  const activeMoodKey = clickMoodIndex >= 0 ? CLICK_MOOD_CYCLE[clickMoodIndex] : state;
  const mood = MOOD_DATA[activeMoodKey] || MOOD_DATA.idle;

  const handleClick = (e) => {
    e.stopPropagation();
    // Cycle to next mood on every click
    setClickMoodIndex((prev) => (prev + 1) % CLICK_MOOD_CYCLE.length);

    // Clear existing timer and reset back to idle after 2.5s of inactivity
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => {
      setClickMoodIndex(-1);
    }, 2500);

    if (onClick) onClick(e);
  };

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  const isUserClicked = clickMoodIndex >= 0;

  return (
    <div
      onClick={handleClick}
      title={`${mood.text} (Click to see other expressions!)`}
      className={`kira-pet-container relative group cursor-pointer select-none ${className}`}
    >
      {/* Reaction speech bubble tooltip */}
      <div
        className={`absolute -top-7 left-1/2 -translate-x-1/2 transition-all duration-200 pointer-events-none z-30 whitespace-nowrap bg-black/85 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-lg border border-white/10 ${
          isUserClicked
            ? 'opacity-100 scale-100 -translate-y-1'
            : 'opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100'
        }`}
      >
        {mood.text}
      </div>

      {/* Anime Girl Character */}
      <img
        src={mood.src}
        alt={`Kira - ${mood.text}`}
        className={`w-[60px] h-[60px] sm:w-[66px] sm:h-[66px] object-contain drop-shadow-md select-none pointer-events-none transition-transform duration-200 ${mood.anim}`}
      />
    </div>
  );
};

export default KiraAvatarPet;
