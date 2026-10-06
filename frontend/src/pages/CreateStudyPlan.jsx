import React, { useState } from 'react';
import {
  BrainCircuit,
  Calendar,
  Clock,
  Sparkles,
  Zap,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Sliders,
  AlertCircle
} from 'lucide-react';
import { api } from '../api/client';
import confetti from 'canvas-confetti';

export default function CreateStudyPlan({ onNavigate }) {
  const [daysToPlan, setDaysToPlan] = useState(7);
  const [dailyHours, setDailyHours] = useState(3.0);
  const [preferredSlot, setPreferredSlot] = useState('Evening (6 PM - 10 PM)');
  const [sessionMinutes, setSessionMinutes] = useState(60);
  const [breakMinutes, setBreakMinutes] = useState(15);
  const [focusWeakSubjects, setFocusWeakSubjects] = useState(true);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await api.generatePlan({
        days_to_plan: parseInt(daysToPlan, 10),
        daily_hours: parseFloat(dailyHours),
        preferred_slot: preferredSlot,
        session_duration_minutes: parseInt(sessionMinutes, 10),
        break_duration_minutes: parseInt(breakMinutes, 10),
        focus_weak_subjects: focusWeakSubjects,
      });

      setResult(res);
      confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
    } catch (err) {
      alert(err.message || 'Failed to generate study plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
          <BrainCircuit className="w-3.5 h-3.5" />
          <span>Intelligent Scheduling Engine</span>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Create Adaptive Study Plan
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Our algorithm balances exam proximity, topic difficulty, weak subject detection, and your daily available hours to generate a personalized, non-overlapping study timetable.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Planner Configuration Form (Left 2 cols) */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 sm:p-7 border border-white/10">
          <form onSubmit={handleGenerate} className="space-y-5">
            
            {/* Planning Horizon */}
            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                1. Planning Horizon
              </label>
              <div className="grid grid-cols-4 gap-2.5">
                {[7, 14, 21, 30].map((days) => (
                  <button
                    type="button"
                    key={days}
                    onClick={() => setDaysToPlan(days)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                      daysToPlan === days
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-900/60 border-white/5 text-slate-300 hover:border-white/20'
                    }`}
                  >
                    {days} Days
                  </button>
                ))}
              </div>
            </div>

            {/* Daily Hours & Preferred Time Slot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                  2. Daily Available Study Hours
                </label>
                <select
                  value={dailyHours}
                  onChange={(e) => setDailyHours(parseFloat(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-indigo-500"
                >
                  <option value="2.0">2.0 Hours per day (1-2 sessions)</option>
                  <option value="3.0">3.0 Hours per day (Recommended)</option>
                  <option value="4.0">4.0 Hours per day (Intensive Prep)</option>
                  <option value="5.0">5.0 Hours per day (Exam Mode)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                  3. Preferred Daily Slot
                </label>
                <select
                  value={preferredSlot}
                  onChange={(e) => setPreferredSlot(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-indigo-500"
                >
                  <option value="Evening (6 PM - 10 PM)">Evening (6:00 PM – 10:00 PM)</option>
                  <option value="Morning (7 AM - 11 AM)">Morning (7:00 AM – 11:00 AM)</option>
                  <option value="Afternoon (2 PM - 6 PM)">Afternoon (2:00 PM – 6:00 PM)</option>
                </select>
              </div>
            </div>

            {/* Session Duration & Break Times */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                  4. Session Block Duration
                </label>
                <select
                  value={sessionMinutes}
                  onChange={(e) => setSessionMinutes(parseInt(e.target.value, 10))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-indigo-500"
                >
                  <option value="45">45 Minutes (High Intensity)</option>
                  <option value="60">60 Minutes (Balanced Standard)</option>
                  <option value="75">75 Minutes (Extended Problem Solving)</option>
                  <option value="90">90 Minutes (Deep Work)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                  5. Smart Buffer Break Between Sessions
                </label>
                <select
                  value={breakMinutes}
                  onChange={(e) => setBreakMinutes(parseInt(e.target.value, 10))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-indigo-500"
                >
                  <option value="10">10 Minutes Break</option>
                  <option value="15">15 Minutes Break (Recommended)</option>
                  <option value="20">20 Minutes Rest</option>
                </select>
              </div>
            </div>

            {/* Smart Adaptive Toggles */}
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={focusWeakSubjects}
                  onChange={(e) => setFocusWeakSubjects(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-0 mt-0.5"
                />
                <div>
                  <span className="text-xs font-bold text-white block">
                    Prioritize Weak Subjects (Needs Attention) & Imminent Exams
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Automatically computes the Smart Priority Score to schedule challenging topics when your cognitive energy is highest.
                  </span>
                </div>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Computing Optimal Timetable...</span>
                </div>
              ) : (
                <>
                  <BrainCircuit className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                  <span>Generate Personalized Study Schedule</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Success Banner */}
          {result && (
            <div className="mt-5 p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="font-bold text-white">{result.message}</p>
                  <p className="text-[11px] text-emerald-300/80">
                    {result.tasks_created} non-overlapping study sessions generated.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('timetable')}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0 transition-colors flex items-center gap-1.5"
              >
                <span>View Timetable</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Algorithm Insights Card (Right 1 col) */}
        <div className="space-y-4">
          <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> Smart Priority Algorithm
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every topic receives a dynamic score from <span className="text-white font-mono">0 to 100</span> using 5 key factors:
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5">
                <div className="flex justify-between font-bold text-slate-200">
                  <span>Exam Proximity</span>
                  <span className="text-indigo-400">30% Weight</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Exams within 5 days receive maximum urgency score.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5">
                <div className="flex justify-between font-bold text-slate-200">
                  <span>Weak Subject Multiplier</span>
                  <span className="text-rose-400">25% Weight</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Subjects categorized as "Needs Attention" receive double priority.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5">
                <div className="flex justify-between font-bold text-slate-200">
                  <span>Assignment Deadlines</span>
                  <span className="text-amber-400">20% Weight</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Upcoming project deliverables are scheduled ahead.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5">
                <div className="flex justify-between font-bold text-slate-200">
                  <span>Topic Difficulty & Importance</span>
                  <span className="text-purple-400">25% Weight</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Hard 5-star topics scheduled early to prevent last-minute cramming.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>100% collision-free guarantee: zero overlapping study sessions.</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
