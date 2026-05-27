import React, { useState, useEffect } from "react";
import { ArrowLeft, Gamepad2, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ArcBirdScreenProps {
  onBack: () => void;
}

export function ArcBirdScreen({ onBack }: ArcBirdScreenProps) {
  const [gameScore, setGameScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(
    localStorage.getItem("arcbird_highscore")
      ? parseInt(localStorage.getItem("arcbird_highscore")!)
      : 142,
  );
  const [gameTimeLeft, setGameTimeLeft] = useState<number>(15);
  const [isGameActive, setIsGameActive] = useState<boolean>(false);
  const [floatingTexts, setFloatingTexts] = useState<
    { id: number; x: number; y: number; text: string }[]
  >([]);

  useEffect(() => {
    let interval: any;
    if (isGameActive && gameTimeLeft > 0) {
      interval = setInterval(() => {
        setGameTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (gameTimeLeft === 0) {
      setIsGameActive(false);
      if (gameScore > highScore) {
        setHighScore(gameScore);
        localStorage.setItem("arcbird_highscore", gameScore.toString());
      }
    }
    return () => clearInterval(interval);
  }, [isGameActive, gameTimeLeft, gameScore, highScore]);

  return (
    <div className="absolute inset-0 z-[60] bg-white flex flex-col animate-in slide-in-from-right duration-300">
      <div className="flex items-center px-4 pt-6 pb-3 bg-slate-900 shadow-md relative z-10 w-full justify-center">
        <button
          onClick={onBack}
          className="absolute left-4 p-2 hover:bg-white/10 rounded-full transition-colors active:bg-white/20 cursor-pointer border-0 bg-transparent"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h2 className="font-bold text-[16px] text-white">ARCBIRD RUN</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        <div className="flex flex-col items-center justify-center pt-2">
          <div className="w-12 h-12 mb-3 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm">
            <Gamepad2 size={24} />
          </div>
          <h2 className="font-bold text-[20px] text-slate-800 leading-tight">
            ARCBIRD RUN
          </h2>
          <p className="text-[12px] text-slate-500 font-bold uppercase tracking-wider mt-1">
            Arc Network Simulation
          </p>
        </div>

        <p className="text-[13px] text-slate-500 text-center">
          Play **ArcBird Run**! Tap the JUMP button to flap and earn native ARC
          rewards instantly.
        </p>

        <div className="grid grid-cols-2 gap-3 w-full">
          <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-3">
            <span className="text-[10px] uppercase font-bold text-purple-400 block mb-0.5">
              Your Highscore
            </span>
            <div className="flex items-center justify-center gap-1">
              <Trophy className="text-amber-500" size={14} />
              <span className="text-[18px] font-black text-purple-900 font-mono">
                {highScore} ARC
              </span>
            </div>
          </div>
          <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3">
            <span className="text-[10px] uppercase font-bold text-amber-500 block mb-0.5">
              Time Left
            </span>
            <span className="text-[18px] font-black text-amber-700 font-mono">
              {gameTimeLeft}s
            </span>
          </div>
        </div>

        <div className="w-full h-[240px] bg-indigo-950 rounded-[28px] border-4 border-indigo-900 relative overflow-hidden shadow-2xl flex flex-col justify-between p-4 select-none">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 to-purple-900 opacity-90"></div>
          <div className="absolute w-2 h-2 rounded-full bg-white top-4 left-6 animate-pulse opacity-40"></div>
          <div className="absolute w-1.5 h-1.5 rounded-full bg-white top-12 right-20 animate-pulse delay-500 opacity-30"></div>

          <div className="absolute bottom-0 inset-x-0 h-1/4 bg-blue-900/30 border-t border-blue-500/20 grid grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="border-r border-blue-500/10 h-full"></div>
            ))}
          </div>

          <div className="relative z-10 flex justify-between items-center w-full">
            <span className="text-[10px] font-mono text-purple-300 uppercase tracking-widest bg-indigo-900/80 px-2 py-0.5 rounded border border-purple-500/30">
              Arc Arcade System
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-[14px] font-bold text-white font-mono">
                {gameScore} pts
              </span>
            </div>
          </div>

          <div className="relative z-10 flex justify-center items-center h-full">
            <motion.div
              animate={
                isGameActive
                  ? { y: [0, -32, 0], rotate: [0, -10, 15, 0] }
                  : { y: 0 }
              }
              transition={{
                duration: 0.5,
                repeat: isGameActive ? Infinity : 0,
                repeatDelay: 0.4,
              }}
              className="text-[48px]"
            >
              🐤
            </motion.div>

            {isGameActive && (
              <div className="absolute right-0 flex flex-col gap-2 w-full pr-[140px] items-end pointer-events-none">
                <div className="w-12 h-1 bg-gradient-to-l from-white/30 to-transparent rounded-full animate-pulse"></div>
                <div className="w-8 h-1 bg-gradient-to-l from-white/20 to-transparent rounded-full animate-pulse delay-300"></div>
              </div>
            )}

            <AnimatePresence>
              {floatingTexts.map((f) => (
                <motion.span
                  key={f.id}
                  initial={{ opacity: 1, y: 10, scale: 0.8 }}
                  animate={{ opacity: 0, y: -45, scale: 1.2 }}
                  exit={{ opacity: 0 }}
                  className="absolute text-yellow-300 font-extrabold text-[16px] drop-shadow-md z-20 pointer-events-none font-sans"
                  style={{ left: f.x + 120, top: f.y + 20 }}
                >
                  {f.text}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>

          {!isGameActive && (
            <div className="absolute inset-0 bg-slate-950/70 z-20 flex flex-col items-center justify-center gap-3 font-sans animate-in zoom-in-95 duration-200">
              <Gamepad2 size={32} className="text-purple-400 animate-bounce" />
              <p className="text-[15px] font-bold text-white uppercase tracking-wider">
                Ready to Play?
              </p>
              <button
                onClick={() => {
                  setGameScore(0);
                  setGameTimeLeft(15);
                  setIsGameActive(true);
                }}
                className="bg-teal-500 hover:bg-teal-600 text-white font-bold px-6 py-2 rounded-xl text-[14px] border-0 cursor-pointer shadow-lg active:scale-95 transition-all"
              >
                START GAME
              </button>
            </div>
          )}
        </div>

        {isGameActive && (
          <button
            onClick={() => {
              const rx = Math.random() * 80 - 40;
              const ry = Math.random() * 20 - 40;
              setGameScore((s) => s + 5);
              setFloatingTexts((prev) => [
                ...prev,
                { id: Date.now(), x: rx, y: ry, text: "+5 ARC!" },
              ]);
              setTimeout(() => {
                setFloatingTexts((prev) => prev.slice(1));
              }, 900);
            }}
            className="w-full h-24 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white py-3.5 rounded-3xl font-black text-[24px] tracking-wider active:scale-95 transition-all shadow-xl shadow-purple-500/20 uppercase cursor-pointer border-0"
          >
            ⚡ JUMP ⚡
          </button>
        )}
      </div>
    </div>
  );
}
