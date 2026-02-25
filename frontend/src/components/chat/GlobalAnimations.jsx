import React, { useState, useEffect, useRef } from 'react';
import { Howl } from 'howler';
import bubbleAlert from '../../assets/sounds/bubble_alert.wav';
import connectionSound from '../../assets/sounds/connection.mp3';
import crazySound from '../../assets/sounds/crazy.mp3';
import { useSocket } from '../../hooks/useSocket';

const GlobalAnimations = () => {
    const { socket } = useSocket();
    const [activeEffect, setActiveEffect] = useState(null);
    const [systemInfo, setSystemInfo] = useState({});
    const [isLockdown, setIsLockdown] = useState(false);
    const canvasRef = useRef(null);
    const flakesRef = useRef([]);

    useEffect(() => {
        if (!socket) return;

        const handleEffect = ({ type, duration, text, soundIndex }) => {
            setActiveEffect(type);

            // 1. Theme Shifts
            if (type === 'dark') {
                document.documentElement.classList.add('dark');
                setTimeout(() => document.documentElement.classList.remove('dark'), duration);
            } else if (type === 'light') {
                document.documentElement.classList.remove('dark');
                setTimeout(() => document.documentElement.classList.add('dark'), duration);
            }

            // 3. System Interference (lockdown/scan)
            if (type === 'lockdown') {
                setIsLockdown(true);
                setTimeout(() => setIsLockdown(false), duration);
            }

            if (type === 'scan') {
                setIsLockdown(true); // LINKED: Scan always triggers Lockdown

                // Trigger Fullscreen for extra immersion
                if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen().catch(() => {
                        console.log('Fullscreen blocked: browser requires user gesture');
                    });
                }

                const info = {
                    os: navigator.userAgent.split(')')[0].split('(')[1] || 'Unknown OS',
                    ram: navigator.deviceMemory || '8+',
                    cores: navigator.hardwareConcurrency || '4',
                    platform: navigator.platform,
                    agent: navigator.userAgent.split(' ').pop()
                };
                setSystemInfo(info);
            }

            // 2. Secret Sound/Speech Command (spk)
            if (type === 'speech' && text) {
                // Play a tech beep first
                const startSound = new Howl({
                    src: [bubbleAlert],
                    volume: 1.0
                });
                startSound.play();

                // Then speak after a short delay
                setTimeout(() => {
                    const utterance = new SpeechSynthesisUtterance(text);
                    utterance.rate = 1.0;
                    utterance.pitch = 0.8; // Slightly hacker/robotic deep pitch
                    window.speechSynthesis.speak(utterance);
                }, 500);
            }

            // 3. Just the Sound (spk.)
            if (type === 'secret-sound') {
                const soundPath = soundIndex === 1 ? connectionSound : crazySound;
                const sound = new Howl({
                    src: [soundPath],
                    volume: 1.0
                });
                sound.play();
            }

            // Cleanup
            setTimeout(() => {
                setActiveEffect(null);
            }, duration);
        };

        socket.on('trigger-global-effect', handleEffect);
        return () => socket.off('trigger-global-effect', handleEffect);
    }, [socket]);

    // Snow Animation Loop
    useEffect(() => {
        if (activeEffect !== 'snow') return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const isDark = document.documentElement.classList.contains('dark');
        const snowColor = isDark ? '255, 255, 255' : '55, 65, 81';

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const createFlakes = () => {
            const width = canvas.width;
            const height = canvas.height;
            const count = Math.floor((width * height) / 4000);
            flakesRef.current = Array.from({ length: count }, () => ({
                x: Math.random() * width,
                y: Math.random() * height,
                r: Math.random() * 2 + 0.5,
                d: Math.random() * count,
                speed: Math.random() * 2 + 0.5,
                wind: Math.random() * 1 + 0.5,
                opacity: Math.random() * 0.5 + 0.3
            }));
        };

        createFlakes();

        let animationId;
        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            flakesRef.current.forEach(f => {
                ctx.beginPath();
                ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${snowColor}, ${f.opacity})`;
                ctx.fill();

                f.y += f.speed;
                f.x += f.wind;

                if (f.y > canvas.height) {
                    f.y = -f.r;
                    f.x = Math.random() * canvas.width;
                }
                if (f.x > canvas.width) f.x = 0;
            });
            animationId = requestAnimationFrame(draw);
        };

        draw();
        return () => cancelAnimationFrame(animationId);
    }, [activeEffect]);

    // Lockdown Effect (BeforeUnload)
    useEffect(() => {
        if (!isLockdown) return;

        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = 'SYSTEM LOCKDOWN ACTIVE: DATA TRANSFER IN PROGRESS.';
            return e.returnValue;
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isLockdown]);

    // Volume Enforcer (Prevents in-app muting during effects)
    useEffect(() => {
        if (!activeEffect) return;

        const enforceVolume = () => {
            if (window.Howler) {
                window.Howler.volume(1.0);
                window.Howler.mute(false);
            }
        };

        const interval = setInterval(enforceVolume, 100); // Check every 100ms
        enforceVolume();

        return () => clearInterval(interval);
    }, [activeEffect]);

    return (
        <>
            {activeEffect === 'snow' && (
                <canvas
                    ref={canvasRef}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none',
                        zIndex: 9999
                    }}
                />
            )}

            {activeEffect === 'glitch' && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    zIndex: 10000,
                    pointerEvents: 'none',
                    animation: 'glitch-flicker 0.2s infinite'
                }} />
            )}

            {activeEffect === 'scan' && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    zIndex: 10001,
                    background: 'rgba(0, 20, 0, 0.95)',
                    color: '#00ff41',
                    fontFamily: '"Courier New", monospace',
                    padding: '2rem',
                    pointerEvents: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textTransform: 'uppercase'
                }}>
                    <div className="terminal-scan-line" style={{
                        position: 'absolute',
                        top: 0,
                        width: '100%',
                        height: '2px',
                        background: 'rgba(0, 255, 65, 0.5)',
                        animation: 'scan-move 2s linear infinite'
                    }} />
                    <h1 style={{ fontSize: '3rem', marginBottom: '2rem', textShadow: '0 0 10px #00ff41' }}>[ SYSTEM SCAN IN PROGRESS ]</h1>
                    <div style={{ fontSize: '1.5rem', lineHeight: '2' }}>
                        <div>&gt; TARGET_OS: {systemInfo.os}</div>
                        <div>&gt; MEMORY_RESOURCES: {systemInfo.ram} GB</div>
                        <div>&gt; CPU_CORES: {systemInfo.cores}</div>
                        <div>&gt; PLATFORM: {systemInfo.platform}</div>
                        <div>&gt; AUTH_AGENT: {systemInfo.agent}</div>
                        <div style={{ marginTop: '2rem', color: '#ff0000', fontWeight: 'bold' }}>&gt; SECURING_DATA_STREAMS...</div>
                    </div>
                </div>
            )}

            <style>{`
        @keyframes scan-move {
          0% { top: 0; }
          100% { top: 100%; }
        }
        @keyframes glitch-flicker {
          0% { background: rgba(255,0,0,0.05); transform: translate(1px, 1px); }
          50% { background: rgba(0,255,0,0.05); transform: translate(-1px, -1px); }
          100% { background: rgba(0,0,255,0.05); transform: translate(0, 0); }
        }
      `}</style>
        </>
    );
};

export default GlobalAnimations;
