// frontend/src/components/chat/KiraAvatarPet.jsx
import React, { useState } from 'react';

/**
 * KiraAvatarPet - Animated anime girl companion for AI Kira's messages
 * 
 * States:
 * - 'idle': Default gentle swaying / breathing loop
 * - 'talking': Mouth-flapping animation while speaking
 * - 'thinking': Head-tilted with question mark while typing/pondering
 * - 'happy': Joyful celebration bounce after finishing message or on click
 */
const STATE_IMAGES = {
  idle: '/stickers/kira_idle.webp',
  talking: '/stickers/kira_talking.webp',
  thinking: '/stickers/kira_thinking.webp',
  happy: '/stickers/kira_happy.webp'
};

const KiraAvatarPet = ({ state = 'idle', onClick, className = '' }) => {
  const [isClicked, setIsClicked] = useState(false);

  const activeState = isClicked ? 'happy' : state;

  const handleClick = (e) => {
    e.stopPropagation();
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 1500);
    if (onClick) onClick(e);
  };

  const stateClassMap = {
    idle: 'kira-pet-idle',
    talking: 'kira-pet-talking',
    thinking: 'kira-pet-thinking',
    happy: 'kira-pet-happy'
  };

  const activeAnimationClass = stateClassMap[activeState] || 'kira-pet-idle';
  const imageSrc = STATE_IMAGES[activeState] || STATE_IMAGES.idle;

  return (
    <div
      onClick={handleClick}
      title={activeState === 'thinking' ? 'Kira is thinking...' : activeState === 'happy' ? 'Kira is happy! (Click to cheer)' : 'Kira AI (Click to pet)'}
      className={`kira-pet-container relative group cursor-pointer select-none ${className}`}
    >
      {/* Reaction badge / speech bubble tooltip on hover */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-30 whitespace-nowrap bg-black/85 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-lg border border-white/10 scale-95 group-hover:scale-100">
        {activeState === 'thinking' && '💭 Thinking...'}
        {activeState === 'talking' && '💬 Kira speaking'}
        {activeState === 'happy' && '✨ Yay!'}
        {activeState === 'idle' && '🌸 Kira'}
      </div>

      {/* Anime Girl Character */}
      <img
        src={imageSrc}
        alt="Kira Pet"
        className={`w-[60px] h-[60px] sm:w-[66px] sm:h-[66px] object-contain drop-shadow-md select-none pointer-events-none transition-transform duration-200 ${activeAnimationClass}`}
      />
    </div>
  );
};

export default KiraAvatarPet;
