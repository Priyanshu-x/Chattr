import React, { useState, useEffect, useRef } from 'react';
import { Howl } from 'howler';
import bubbleAlert from '../../assets/sounds/bubble_alert.wav';
import connectionSound from '../../assets/sounds/connection.mp3';
import crazySound from '../../assets/sounds/crazy.mp3';
import { useSocket } from '../../hooks/useSocket';

const GlobalAnimations = () => {
    const { socket } = useSocket();
    const [activeEffect, setActiveEffect] = useState(null);
    const [scanLogs, setScanLogs] = useState([]);
    const [isLockdown, setIsLockdown] = useState(false);
    const canvasRef = useRef(null);
    const flakesRef = useRef([]);
    const logEndRef = useRef(null);

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

    // Scan Terminal Feed Loop
    useEffect(() => {
        if (activeEffect !== 'scan') {
            setScanLogs([]);
            return;
        }

        const actualOS = navigator.userAgent.split(')')[0].split('(')[1] || 'Unknown OS';
        const cpuCores = navigator.hardwareConcurrency || '4';
        const screenRes = `${window.screen.width}x${window.screen.height}`;
        const userLang = navigator.language || 'en-US';

        const rawLogs = [
            `[SYSTEM] Initializing low-level system diagnostic scan...`,
            `[OS] Detected host environment: ${actualOS}`,
            `[CPU] Hardware concurrency cores: ${cpuCores} logical threads`,
            `[RESOLV] Display configuration: ${screenRes} (${userLang})`,
            `[SECURITY] Bypassing browser sandbox boundaries... SUCCESS`,
            `[FS] Scanning local directory: C:\\Users\\Administrator\\Documents\\`,
            `[FS] Scanning local directory: C:\\Users\\Administrator\\AppData\\Local\\`,
            `[FS] Searching configuration keys (.env, config.json, database.yml)...`,
            `[FS] Accessing credentials.json... 100% Match`,
            `[SYS] Establishing bridge to hardware controllers...`,
            `[MEDIA] Accessing built-in microphone & camera arrays... ONLINE (stealth mode)`,
            `[MEM] Hijacking socket thread at memory address 0x7FFF9B3C2A...`,
            `[SYS] Injecting payload delivery system daemon...`,
            `[NET] Binding dynamic proxy port to loopback address...`,
            `[PAYLOAD] Deploying root beacon service... ACTIVE (PID: 10398)`,
            `[PACK] Archiving system environment parameters (env_variables.tar.gz)...`,
            `[NET] Exfiltrating session tokens & authentication hashes...`,
            `[NET] Sending package to remote listener node at 8.8.8.8:443... DONE`,
            `[CLEAN] Purging security audit trail (EventLog/Security ID: 1102)...`,
            `[STATUS] System diagnostic scan completed. Stealth daemon running.`
        ];

        let index = 0;
        setScanLogs([rawLogs[0]]);

        const interval = setInterval(() => {
            index++;
            if (index < rawLogs.length) {
                setScanLogs(prev => [...prev, rawLogs[index]]);
            } else {
                clearInterval(interval);
            }
        }, 450); // 20 logs * 450ms = 9.0s (scan duration is 10s)

        return () => clearInterval(interval);
    }, [activeEffect]);

    // Auto-scroll Scan terminal logs
    useEffect(() => {
        if (logEndRef.current) {
            logEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [scanLogs]);

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
                    background: 'rgba(0, 5, 0, 0.96)',
                    color: '#00ff41',
                    fontFamily: '"Courier New", monospace',
                    padding: '2.5rem',
                    boxSizing: 'border-box',
                    pointerEvents: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    alignItems: 'flex-start',
                    textTransform: 'uppercase',
                    overflow: 'hidden'
                }}>
                    <div className="terminal-scan-line" style={{
                        position: 'absolute',
                        top: 0,
                        width: '100%',
                        height: '3px',
                        background: 'rgba(0, 255, 65, 0.4)',
                        boxShadow: '0 0 15px #00ff65',
                        animation: 'scan-move 3s linear infinite'
                    }} />
                    
                    <div style={{ 
                        width: '100%', 
                        borderBottom: '2px solid #00ff41', 
                        paddingBottom: '1rem', 
                        marginBottom: '1.5rem', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        flexShrink: 0
                    }}>
                        <h1 style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold', letterSpacing: '2px', textShadow: '0 0 8px #00ff41' }}>
                            [ SECURITY BREACH / SYSTEM DIAGNOSTIC ]
                        </h1>
                        <span style={{ fontSize: '1.2rem', animation: 'pulse 1s infinite', color: '#ff3333', fontWeight: 'bold' }}>
                            ● LIVE TARGET SCAN
                        </span>
                    </div>

                    <div style={{
                        width: '100%',
                        flexGrow: 1,
                        fontSize: '1.2rem',
                        lineHeight: '1.8',
                        textAlign: 'left',
                        fontFamily: '"Lucida Console", Monaco, monospace',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                        overflowY: 'auto',
                        paddingRight: '1rem'
                    }}>
                        {scanLogs.map((log, idx) => {
                            const isSuccess = log.includes('SUCCESS') || log.includes('ACTIVE') || log.includes('ONLINE') || log.includes('Match') || log.includes('DONE');
                            const isSecurity = log.includes('SECURITY') || log.includes('Bypassing') || log.includes('Hijacking') || log.includes('Exfiltrating') || log.includes('Injecting');
                            let color = '#00ff41';
                            if (isSuccess) color = '#00ff88';
                            if (isSecurity) color = '#ff3333';
                            return (
                                <div key={idx} style={{ color, marginBottom: '0.4rem' }}>
                                    &gt; {log}
                                </div>
                            );
                        })}
                        <div ref={logEndRef} />
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
                @keyframes pulse {
                  0%, 100% { opacity: 1; }
                  50% { opacity: 0.3; }
                }
            `}</style>
        </>
    );
};

export default GlobalAnimations;
