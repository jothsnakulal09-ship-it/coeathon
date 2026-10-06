import React from 'react';
import { AlertCircle, CalendarClock, ArrowRight, X } from 'lucide-react';

export default function RescheduleBanner({ message, details, onClose, onViewTimetable }) {
  if (!message) return null;

  return (
    <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-rose-950/80 via-slate-900 to-indigo-950/80 border border-rose-500/40 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 shrink-0 border border-rose-500/30">
            <CalendarClock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Adaptive Rescheduler
              </span>
              <span className="text-xs text-slate-400">Automatic Rebalance</span>
            </div>
            <p className="text-sm font-medium text-slate-100 mt-0.5">
              {message}
            </p>
            {details && (
              <p className="text-xs text-rose-300/80 mt-1 flex items-center gap-1.5 font-mono">
                <span>{details.old_slot}</span>
                <ArrowRight className="w-3 h-3 text-rose-400" />
                <span className="text-emerald-300 font-semibold">{details.new_slot}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {onViewTimetable && (
            <button
              onClick={onViewTimetable}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10 flex items-center gap-1"
            >
              View Timetable <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
