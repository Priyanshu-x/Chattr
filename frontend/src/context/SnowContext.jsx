import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Howl } from 'howler';
import violinSound from '../assets/lovely.mp3';

const SnowContext = createContext();

export const useSnow = () => useContext(SnowContext);

// Local Violin Track (Imported via Vite)
const VIOLIN_AUDIO_URL = violinSound;

export const SnowProvider = ({ children }) => {
    const [isSnowing, setIsSnowing] = useState(false);
    const soundRef = useRef(null);

    useEffect(() => {
        console.log('SnowContext: Initializing Howler with URL:', VIOLIN_AUDIO_URL);

        soundRef.current = new Howl({
            src: [VIOLIN_AUDIO_URL],
            html5: true, // Force HTML5 Audio to stream large files (good for music)
            loop: true,
            volume: 0.5,
            onload: () => console.log('SnowContext: Howler loaded audio successfully'),
            onloaderror: (id, err) => console.error('SnowContext: Howler load error', err),
            onplayerror: (id, err) => {
                console.error('SnowContext: Howler play error', err);
                soundRef.current.once('unlock', () => {
                    soundRef.current.play();
                });
            }
        });

        return () => {
            if (soundRef.current) {
                soundRef.current.unload();
            }
        };
    }, []);

    const toggleSnow = () => {
        console.log('SnowContext: Toggling snow. Current state:', isSnowing);

        if (isSnowing) {
            setIsSnowing(false);
            if (soundRef.current) {
                console.log('SnowContext: Pausing audio');
                soundRef.current.pause();
            }
        } else {
            setIsSnowing(true);
            if (soundRef.current) {
                console.log('SnowContext: Playing audio');
                soundRef.current.play();
            }
        }
    };

    return (
        <SnowContext.Provider value={{ isSnowing, toggleSnow }}>
            {children}
        </SnowContext.Provider>
    );
};
