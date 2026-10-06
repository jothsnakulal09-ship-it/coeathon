import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Clock,
  Play,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Flame,
  ArrowRight,
  Filter,
  Check
} from 'lucide-react';
import { api } from '../api/client';
import confetti from 'canvas-confetti';
import RescheduleBanner from '../components/RescheduleBanner';

export default function DailyTasks({ onOpenPomodoro, onNavigate }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All'); // 'All', 'Pending', 'Completed', 'Missed'
  const [notice, setNotice] = useState(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const fetchTodayTasks = async () => {
    try {
      setLoading(true);
      const res = await api.getTasks({ date: todayStr });
      setTasks(res);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayTasks();
    const handleUpdate = () => fetchTodayTasks();
    window.addEventListener('study-plan-updated', handleUpdate);
    return () => window.removeEventListener('study-plan-updated', handleUpdate);
  }, []);

  const handleMarkComplete = async (taskId) => {
    try {
      await api.updateTaskStatus(taskId, 'Completed');
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      fetchTodayTasks();
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
      fetchTodayTasks();
    } catch (err) {
      alert(err.message);
    }
  };

  const completedCount = tasks.filter((t) => t.status === 'Completed').length;
  const totalCount = tasks.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'All') return true;
    if (filter === 'Pending') return t.status === 'Pending' || t.status === 'In Progress';
    return t.status === filter;
  });

  return (
    <div className="space-y-6">
      
      {/* Reschedule Notification */}
      {notice && (
        <RescheduleBanner
          message={notice.message}
          details={notice.details}
          onClose={() => setNotice(null)}
          onViewTimetable={() => onNavigate('timetable')}
        />
      )}

      {/* Header */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Today's Execution Target</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Daily Study Tasks & Focus Mode
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Progress gauge */}
        <div className="flex items-center gap-4 bg-slate-900/60 p-3.5 rounded-2xl border border-white/10 self-stretch md:self-auto">
          <div className="text-right">
            <span className="text-xs font-bold text-white block">{completedCount} of {totalCount} Completed</span>
            <span className="text-[11px] text-slate-400">{progressPct}% daily quota</span>
          </div>
          <div className="w-14 h-14 rounded-full border-4 border-slate-800 flex items-center justify-center font-bold text-xs text-indigo-400 font-mono relative">
            <div
              className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin-slow"
              style={{ opacity: progressPct > 0 ? 1 : 0.2 }}
            />
            {progressPct}%
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {['All', 'Pending', 'Completed', 'Missed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === f
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {f} ({f === 'All' ? tasks.length : tasks.filter((t) => (f === 'Pending' ? t.status === 'Pending' || t.status === 'In Progress' : t.status === f)).length})
            </button>
          ))}
        </div>

        <button
          onClick={onOpenPomodoro}
          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Launch Focus Timer</span>
        </button>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center space-y-3 border border-white/10">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="font-bold text-base text-white">No tasks found in this view!</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            All caught up or no tasks scheduled for today. You can auto-generate new sessions from the planner.
          </p>
          <button
            onClick={() => onNavigate('planner')}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all inline-flex items-center gap-2"
          >
            <span>Generate Today's Plan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((t) => {
            const isDone = t.status === 'Completed';
            const isMissed = t.status === 'Missed';

            return (
              <div
                key={t.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  isDone
                    ? 'bg-emerald-950/20 border-emerald-500/30 opacity-75'
                    : isMissed
                    ? 'bg-rose-950/20 border-rose-500/30'
                    : 'glass-panel border-white/10 hover:border-indigo-500/40'
                }`}
              >
                <div className="flex items-start sm:items-center gap-4">
                  {/* Time badge */}
                  <div className="px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-center shrink-0">
                    <span className="font-mono text-xs font-bold text-white block">
                      {t.start_time} - {t.end_time}
                    </span>
                    <span className="text-[10px] text-slate-400">{t.duration_minutes} Minutes</span>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold text-white"
                        style={{ backgroundColor: t.subject_color || '#4f46e5' }}
                      >
                        {t.subject_name}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white/10 text-slate-300">
                        {t.difficulty || 'Medium'} Difficulty
                      </span>
                      {t.is_rescheduled && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          🔄 Auto-Rescheduled
                        </span>
                      )}
                    </div>
                    <h3
                      className={`text-sm font-bold ${
                        isDone ? 'line-through text-slate-400' : 'text-white'
                      }`}
                    >
                      {t.title}
                    </h3>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  {!isDone && !isMissed && (
                    <>
                      <button
                        onClick={onOpenPomodoro}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-indigo-600/20 text-indigo-400 hover:text-indigo-300 border border-white/10 text-xs font-semibold transition-colors flex items-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Focus</span>
                      </button>
                      <button
                        onClick={() => handleMarkComplete(t.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Complete</span>
                      </button>
                      <button
                        onClick={() => handleMarkMissed(t.id)}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Missed (Auto-Reschedule)</span>
                      </button>
                    </>
                  )}
                  {isDone && (
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Completed
                    </span>
                  )}
                  {isMissed && (
                    <span className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30 flex items-center gap-1.5">
                      <RotateCcw className="w-4 h-4" /> Moved to Tomorrow
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
