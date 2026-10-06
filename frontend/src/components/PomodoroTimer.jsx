import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, X, Volume2, Sparkles, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function PomodoroTimer({ isOpen, onClose }) {
  const [mode, setMode] = useState('study'); // 'study' (25m) or 'break' (5m) or 'deep' (50m)
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);

  const modeDurations = {
    study: 25 * 60,
    break: 5 * 60,
    deep: 50 * 60,
  };

  useEffect(() => {
    let timer = null;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      setIsRunning(false);
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
      } catch (e) {}
      if (mode === 'study' || mode === 'deep') {
        setCompletedSessions((prev) => prev + 1);
        setMode('break');
        setTimeLeft(modeDurations.break);
      } else {
        setMode('study');
        setTimeLeft(modeDurations.study);
      }
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft, mode]);

  const switchMode = (newMode) => {
    setMode(newMode);
    setTimeLeft(modeDurations[newMode]);
    setIsRunning(false);
  };

  const resetTimer = () => {
    setTimeLeft(modeDurations[mode]);
    setIsRunning(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = 1 - timeLeft / modeDurations[mode];

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 glass-panel rounded-2xl p-5 shadow-2xl border border-indigo-500/30 animate-in fade-in slide-in-from-bottom-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
          <h3 className="font-semibold text-sm tracking-wide text-white flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-400" /> Focus Pomodoro
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Mode Selectors */}
      <div className="grid grid-cols-3 gap-1.5 mt-3 p-1 bg-slate-900/60 rounded-xl text-xs font-medium">
        <button
          onClick={() => switchMode('study')}
          className={`py-1.5 rounded-lg transition-all ${
            mode === 'study' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          25m Focus
        </button>
        <button
          onClick={() => switchMode('break')}
          className={`py-1.5 rounded-lg transition-all ${
            mode === 'break' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          5m Break
        </button>
        <button
          onClick={() => switchMode('deep')}
          className={`py-1.5 rounded-lg transition-all ${
            mode === 'deep' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          50m Deep
        </button>
      </div>

      {/* Circular / Big Timer Display */}
      <div className="my-6 text-center">
        <div className="text-4xl font-black tracking-tight font-mono text-white">
          {formatTime(timeLeft)}
        </div>
        <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
          {mode === 'study' ? 'Active Focus Session' : mode === 'deep' ? 'Deep Work Session' : 'Rest & Refresh'}
        </p>

        {/* Progress line */}
        <div className="w-full bg-slate-800 rounded-full h-1.5 mt-4 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              mode === 'break' ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg ${
            isRunning
              ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
          }`}
        >
          {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
          {isRunning ? 'Pause' : 'Start Focus'}
        </button>
        <button
          onClick={resetTimer}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          title="Reset"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Completed session counter */}
      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Finished Today:
        </span>
        <span className="font-semibold text-emerald-400">{completedSessions} intervals</span>
      </div>
    </div>
  );
}
