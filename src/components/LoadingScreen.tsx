import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface LoadingScreenProps {
  onComplete: () => void;
  speedMultiplier?: number;
}

export default function LoadingScreen({ onComplete, speedMultiplier = 1 }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let currentVal = 0;
    // Fast loading to complete in exactly ~900 milliseconds
    const intervalTime = 12 / speedMultiplier;
    
    const timer = setInterval(() => {
      currentVal += 2;
      if (currentVal >= 100) {
        currentVal = 100;
        setProgress(100);
        clearInterval(timer);
        // Clean swift dismissal automatically after 100ms - no click requested!
        const exitTimer = setTimeout(() => {
          onComplete();
        }, 150);
        return () => clearTimeout(exitTimer);
      } else {
        setProgress(currentVal);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [speedMultiplier, onComplete]);

  return (
    <div className="fixed inset-0 z-[100] bg-[#ffffff] overflow-hidden flex flex-col items-center justify-center font-sans select-none text-neutral-800">
      
      {/* Dynamic Emitsphere Custom Loading Spinner */}
      <div className="w-full max-w-sm px-6 flex flex-col items-center justify-center space-y-8 p-4">
        
        {/* Spinner Coordinates using brand orange (#FF5E2A) */}
        <div className="relative w-36 h-36 flex items-center justify-center">
          {/* External Spinning Orbit */}
          <div className="absolute inset-0 border-2 border-dashed border-[#FF5E2A]/30 rounded-full animate-spin [animation-duration:4s]"></div>
          
          {/* Inner Counter Spinning Core */}
          <div className="absolute inset-2 border border-dotted border-[#FF5E2A]/20 rounded-full animate-spin [animation-duration:6s] [animation-direction:reverse]"></div>
          
          {/* Glowing brand circle */}
          <div className="absolute inset-5 rounded-full bg-gradient-to-tr from-[#E04B1A]/10 to-[#FF5E2A]/10 border border-[#FF5E2A]/25 flex items-center justify-center">
            <div className="w-16 h-16 bg-[#FF5E2A] rounded-full flex items-center justify-center relative shadow-[0_8px_20px_rgba(242,131,22,0.3)]">
              {/* Pulse effects */}
              <div className="absolute inset-0 bg-[#FF5E2A] rounded-full opacity-30 animate-ping [animation-duration:1.5s]"></div>
              
              <span className="z-10 font-sans font-black text-white text-sm tracking-widest">90'S</span>
            </div>
          </div>

          {/* Orbital glowing nodes */}
          <div className="absolute top-1/2 left-0 w-3 h-3 rounded-full bg-[#FF5E2A] shadow-[0_0_8px_rgba(242,131,22,0.6)] -translate-y-1/2 animate-spin origin-[72px_12px]"></div>
          <div className="absolute top-0 left-1/2 w-2.5 h-2.5 rounded-full bg-[#FF5E2A] -translate-x-1/2 animate-spin origin-[12px_72px] [animation-direction:reverse]"></div>
        </div>

        {/* Brand Header */}
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-[#E04B1A]">
            90's.emitsphere
          </h1>
          <p className="text-xs font-bold text-[#FF5E2A] uppercase tracking-widest">
            Fast Delicious Food
          </p>
        </div>

        {/* Clean Simplified Progress Gauge */}
        <div className="w-full space-y-2.5 pt-2">
          <div className="flex justify-between text-xs font-extrabold tracking-wider text-[#E04B1A] uppercase">
            <span className="opacity-75">Starting App...</span>
            <span className="text-[#FF5E2A] font-black">{progress}%</span>
          </div>

          <div className="h-2.5 bg-neutral-100 border border-neutral-200/50 rounded-full p-0.5 overflow-hidden relative">
            <motion.div 
              className="h-full bg-gradient-to-r from-[#FF5E2A] to-[#E04B1A] rounded-full"
              style={{ width: `${progress}%` }}
              layoutId="splash-progress"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
