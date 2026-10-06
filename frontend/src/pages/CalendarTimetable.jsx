import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ListFilter,
  History,
  Check
} from 'lucide-react';
import { api } from '../api/client';
import confetti from 'canvas-confetti';
import RescheduleBanner from '../components/RescheduleBanner';

export default function CalendarTimetable({ onNavigate }) {
  const [tasks, setTasks] = useState([]);
  const [rescheduleLogs, setRescheduleLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('weekly'); // 'weekly' or 'logs'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [notice, setNotice] = useState(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.getTasks();
      setTasks(res);
      const logs = await api.getRescheduleLogs();
      setRescheduleLogs(logs);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    const handleUpdate = () => fetchTasks();
    window.addEventListener('study-plan-updated', handleUpdate);
    return () => window.removeEventListener('study-plan-updated', handleUpdate);
  }, []);

  const handleMarkComplete = async (taskId) => {
    try {
      await api.updateTaskStatus(taskId, 'Completed');
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      fetchTasks();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleMarkMissed = async (taskId) => {
    try {
      const res = await api.rescheduleMissedTask(taskId);
      setNotice({
        message: res.message || 'Your schedule has been automatically updated because you missed 1 task.',
        details: { old_slot: res.old_slot, new_slot: res.new_slot },
      });
      fetchTasks();
    } catch (err) {
      alert(err.message);
    }
  };

  // Helper to calculate week days
  const getWeekDates = (offset = 0) => {
    const curr = new Date();
    const first = curr.getDate() - curr.getDay() + 1 + offset * 7; // Monday as 1st day
    const week = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(curr.getFullYear(), curr.getMonth(), first + i);
      week.push(nextDay.toISOString().split('T')[0]);
    }
    return week;
  };

  const weekDates = getWeekDates(weekOffset);

  const formatDayName = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const formatDayNumber = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      
      {/* Reschedule Alert Banner */}
      {notice && (
        <RescheduleBanner
          message={notice.message}
          details={notice.details}
          onClose={() => setNotice(null)}
        />
      )}

      {/* Top Controls */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Interactive Timetable</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Study Schedule & Rescheduling Log
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Non-overlapping, collision-free study sessions with intelligent auto-rebalancing
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 bg-slate-900/60 p-1.5 rounded-2xl border border-white/10 self-stretch sm:self-auto">
          <button
            onClick={() => setActiveTab('weekly')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'weekly'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Weekly View</span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'logs'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Reschedule Logs ({rescheduleLogs.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'weekly' && (
        <>
          {/* Week Navigator */}
          <div className="glass-panel rounded-2xl p-4 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWeekOffset((prev) => prev - 1)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                title="Previous Week"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setWeekOffset(0)}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => setWeekOffset((prev) => prev + 1)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                title="Next Week"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs font-bold text-slate-300">
              Week of {formatDayNumber(weekDates[0])} – {formatDayNumber(weekDates[6])}
            </div>

            <button
              onClick={() => onNavigate('planner')}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> Re-Generate
            </button>
          </div>

          {/* 7 Days Columns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {weekDates.map((dateStr) => {
              const isToday = dateStr === todayStr;
              const dayTasks = tasks.filter((t) => t.scheduled_date === dateStr);

              return (
                <div
                  key={dateStr}
                  className={`rounded-2xl border transition-all p-3 flex flex-col min-h-[320px] ${
                    isToday
                      ? 'glass-panel border-indigo-500/60 bg-indigo-950/20 shadow-lg shadow-indigo-500/10'
                      : 'glass-card border-white/10'
                  }`}
                >
                  {/* Day Header */}
                  <div className="pb-2.5 mb-2.5 border-b border-white/10 text-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      {formatDayName(dateStr)}
                    </span>
                    <span
                      className={`text-sm font-extrabold inline-block px-2 py-0.5 rounded-lg mt-0.5 ${
                        isToday ? 'bg-indigo-600 text-white shadow' : 'text-slate-200'
                      }`}
                    >
                      {formatDayNumber(dateStr)}
                    </span>
                  </div>

                  {/* Task list for this day */}
                  <div className="space-y-2.5 flex-1">
                    {dayTasks.length === 0 ? (
                      <p className="text-[11px] text-slate-600 text-center py-6">No sessions</p>
                    ) : (
                      dayTasks.map((t) => {
                        const isDone = t.status === 'Completed';
                        const isMissed = t.status === 'Missed';

                        return (
                          <div
                            key={t.id}
                            className={`p-2.5 rounded-xl border text-left transition-all ${
                              isDone
                                ? 'bg-emerald-950/20 border-emerald-500/30 opacity-70'
                                : isMissed
                                ? 'bg-rose-950/20 border-rose-500/30'
                                : 'bg-slate-900/80 border-white/10 hover:border-indigo-500/40'
                            }`}
                          >
                            {/* Time & Subject pill */}
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="font-mono text-[10px] font-bold text-slate-300">
                                {t.start_time} - {t.end_time}
                              </span>
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: t.subject_color || '#4f46e5' }}
                                title={t.subject_name}
                              />
                            </div>

                            <h5
                              className={`text-[11px] font-semibold line-clamp-2 ${
                                isDone ? 'line-through text-slate-400' : 'text-white'
                              }`}
                            >
                              {t.title}
                            </h5>

                            {t.is_rescheduled && (
                              <span className="inline-block mt-1 text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                🔄 Rescheduled
                              </span>
                            )}

                            {/* Task Actions */}
                            <div className="mt-2 pt-1.5 border-t border-white/5 flex items-center justify-between gap-1">
                              {!isDone && !isMissed ? (
                                <>
                                  <button
                                    onClick={() => handleMarkComplete(t.id)}
                                    className="p-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors text-[10px] font-semibold flex items-center gap-1"
                                    title="Mark Completed"
                                  >
                                    <Check className="w-3 h-3" /> Done
                                  </button>
                                  <button
                                    onClick={() => handleMarkMissed(t.id)}
                                    className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors text-[10px] font-semibold flex items-center gap-1"
                                    title="Mark Missed & Auto Reschedule"
                                  >
                                    <RotateCcw className="w-3 h-3" /> Missed
                                  </button>
                                </>
                              ) : isDone ? (
                                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Completed
                                </span>
                              ) : (
                                <span className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
                                  <RotateCcw className="w-3 h-3" /> Auto-Moved
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Automatic Reschedule History Log Tab (Unique Feature #8 Proof) */}
      {activeTab === 'logs' && (
        <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/10 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/10">
            <History className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="font-bold text-base text-white">Adaptive Reschedule Audit Trail</h3>
              <p className="text-xs text-slate-400">
                Log of tasks moved automatically by the scheduler when marked missed
              </p>
            </div>
          </div>

          {rescheduleLogs.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">
              No tasks have been rescheduled yet. Mark a task as "Missed" to see the adaptive engine in action!
            </p>
          ) : (
            <div className="space-y-3">
              {rescheduleLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-2xl bg-slate-900/70 border border-purple-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        Auto Rebalanced
                      </span>
                      <h4 className="text-xs font-bold text-white">{log.task_title}</h4>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
                      <span className="text-rose-300/80">{log.old_slot}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
                      <span className="text-emerald-300 font-bold">{log.new_slot}</span>
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-slate-400 shrink-0">
                    <p className="italic text-slate-300">"{log.reason}"</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
