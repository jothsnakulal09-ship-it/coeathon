import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Award,
  Flame,
  CheckCircle2,
  Clock,
  PieChart as PieIcon,
  Zap,
  ArrowRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { api } from '../api/client';

export default function ProgressAnalytics({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await api.getAnalytics();
        setData(res);
      } catch (err) {
        alert(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  const {
    subjects_performance = [],
    status_distribution = [],
    task_completion_distribution = [],
    daily_study_history = [],
    subject_hours = [],
    current_streak = 5,
    total_tasks_tracked = 0,
  } = data;

  const weakest = subjects_performance[0];
  const strongest = [...subjects_performance].reverse()[0];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Academic Performance Insights</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Progress Analytics & Weak Subject Detection
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time mastery tracking, study velocity trends, and algorithm-driven subject classifications
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold text-xs">
          <Flame className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span>{current_streak} Day Consistency Streak</span>
        </div>
      </div>

      {/* Top 3 Analytical Summary Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Weakest Subject Breakdown */}
        <div className="glass-card rounded-2xl p-5 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Subject Needing Attention
            </span>
            <span className="text-xs font-bold text-rose-300 px-2 py-0.5 rounded-full bg-rose-500/20">
              🔴 Needs Attention
            </span>
          </div>
          {weakest ? (
            <div>
              <h3 className="text-base font-bold text-white">{weakest.name}</h3>
              <p className="text-xs text-slate-300 mt-1">
                Mastery Score: <span className="font-extrabold text-rose-400">{weakest.performance_score}%</span> ({weakest.completed_topics}/{weakest.total_topics} Topics Done)
              </p>
              <p className="text-[11px] text-slate-400 mt-2">
                Planner allocates <span className="text-white font-semibold">{weakest.recommended_hours_per_week} hrs/week</span> to bridge knowledge gaps before exams.
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-400 mt-2">No weak subjects detected.</p>
          )}
        </div>

        {/* Strongest Subject */}
        <div className="glass-card rounded-2xl p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" /> Highest Mastery Subject
            </span>
            <span className="text-xs font-bold text-emerald-300 px-2 py-0.5 rounded-full bg-emerald-500/20">
              🟢 Strong
            </span>
          </div>
          {strongest ? (
            <div>
              <h3 className="text-base font-bold text-white">{strongest.name}</h3>
              <p className="text-xs text-slate-300 mt-1">
                Mastery Score: <span className="font-extrabold text-emerald-400">{strongest.performance_score}%</span> ({strongest.completed_topics}/{strongest.total_topics} Topics Done)
              </p>
              <p className="text-[11px] text-slate-400 mt-2">
                Maintain mastery with <span className="text-white font-semibold">{strongest.recommended_hours_per_week} hrs/week</span> of spaced repetition.
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-400 mt-2">No strong subjects yet.</p>
          )}
        </div>

        {/* Execution Reliability */}
        <div className="glass-card rounded-2xl p-5 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Overall Execution
            </span>
            <span className="text-xs font-bold text-indigo-300 px-2 py-0.5 rounded-full bg-indigo-500/20">
              {total_tasks_tracked} Total Sessions
            </span>
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Adaptive Timetable Reliability</h3>
            <p className="text-xs text-slate-300 mt-1">
              Missed sessions are automatically moved forward rather than lost, preserving syllabus coverage.
            </p>
            <button
              onClick={() => onNavigate('timetable')}
              className="mt-3 text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              Inspect Reschedule Log <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>

      {/* Row 1 Charts: Daily Study Hours & Subject Mastery */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Study Velocity (Hours completed last 7 days) */}
        <div className="glass-panel rounded-3xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-white">Daily Study Hours (Last 7 Days)</h3>
              <p className="text-[11px] text-slate-400">Actual productive hours completed per day</p>
            </div>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={daily_study_history}>
                <defs>
                  <linearGradient id="hourGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} unit="h" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="hours"
                  name="Study Hours"
                  stroke="#818cf8"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#hourGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Subject Mastery Radar / Bar Chart */}
        <div className="glass-panel rounded-3xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-white">Subject Mastery Scores (0 - 100%)</h3>
              <p className="text-[11px] text-slate-400">Evaluated across topic completion, task success, & difficulty</p>
            </div>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjects_performance} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={11} unit="%" />
                <YAxis dataKey="code" type="category" stroke="#94a3b8" fontSize={11} width={50} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="performance_score" name="Mastery %" radius={[0, 8, 8, 0]}>
                  {subjects_performance.map((entry, index) => {
                    const color =
                      entry.status === 'Needs Attention'
                        ? '#ef4444'
                        : entry.status === 'Strong'
                        ? '#10b981'
                        : '#f59e0b';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Row 2 Charts: Weak Subject Breakdown & Task Completion Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Donut Chart: Subject Status Breakdown */}
        <div className="glass-panel rounded-3xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-white">Subject Classification Distribution</h3>
              <p className="text-[11px] text-slate-400">🟢 Strong (≥75%) vs 🟡 Average (50-74%) vs 🔴 Needs Attention (&lt;50%)</p>
            </div>
            <PieIcon className="w-4 h-4 text-purple-400" />
          </div>
          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={status_distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {status_distribution.map((entry, index) => (
                    <Cell key={`status-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  formatter={(value, entry) => (
                    <span className="text-xs text-slate-300 font-semibold">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart: Task Distribution (Completed, Pending, Missed, Rescheduled) */}
        <div className="glass-panel rounded-3xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-white">Study Sessions Status Breakdown</h3>
              <p className="text-[11px] text-slate-400">Completed, Pending, Missed, and Auto-Rescheduled</p>
            </div>
            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={task_completion_distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {task_completion_distribution.map((entry, index) => (
                    <Cell key={`task-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  formatter={(value, entry) => (
                    <span className="text-xs text-slate-300 font-semibold">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
