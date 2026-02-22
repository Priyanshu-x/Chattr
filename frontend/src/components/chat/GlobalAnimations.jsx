import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../hooks/useSocket';

const GlobalAnimations = () => {
    const { socket } = useSocket();
    const [activeEffect, setActiveEffect] = useState(null);
    const canvasRef = useRef(null);
    const flakesRef = useRef([]);

    useEffect(() => {
        if (!socket) return;

        const handleEffect = ({ type, duration }) => {
            setActiveEffect(type);

            // Temporary theme shifts
            if (type === 'dark') {
                document.documentElement.classList.add('dark');
                setTimeout(() => document.documentElement.classList.remove('dark'), duration);
            } else if (type === 'light') {
                document.documentElement.classList.remove('dark');
                setTimeout(() => document.documentElement.classList.add('dark'), duration);
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

            <style>{`
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
