import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Flame,
  Clock,
  CheckCircle2,
  ListTodo,
  AlertTriangle,
  GraduationCap,
  Calendar,
  ArrowRight,
  TrendingUp,
  BrainCircuit,
  Play,
  Check,
  RotateCcw,
  Zap,
  BookOpen,
  Award,
  Target,
  Plus,
  Trash2,
  FileText
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import confetti from 'canvas-confetti';
import { api } from '../api/client';
import RescheduleBanner from '../components/RescheduleBanner';

export default function Dashboard({ user, onNavigate, onOpenPomodoro }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionNotice, setActionNotice] = useState(null);
  const [newGoalText, setNewGoalText] = useState('');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardOverview();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const handleUpdate = () => fetchDashboard();
    window.addEventListener('study-plan-updated', handleUpdate);
    return () => window.removeEventListener('study-plan-updated', handleUpdate);
  }, []);

  const handleMarkComplete = async (taskId) => {
    try {
      await api.completeTask(taskId);
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      fetchDashboard();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleMarkMissed = async (taskId) => {
    try {
      const res = await api.missTask(taskId);
      setActionNotice({
        message: res.message || 'Your study plan has been automatically updated because you missed 1 task.',
        details: { old_slot: res.old_slot, new_slot: res.new_slot }
      });
      fetchDashboard();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleGoal = async (goalId) => {
    try {
      await api.toggleDailyGoal(goalId);
      fetchDashboard();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;
    try {
      await api.createDailyGoal({ title: newGoalText });
      setNewGoalText('');
      fetchDashboard();
    } catch (err) {
      alert(err.message);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-medium">Loading your study dashboard...</p>
        </div>
      </div>
    );
  }

  const {
    today_study_hours_planned = 0,
    today_study_hours_completed = 0,
    today_tasks_total = 0,
    today_tasks_completed = 0,
    today_tasks_pending = 0,
    today_tasks_missed = 0,
    overall_progress_percentage = 0,
    study_streak = 5,
    upcoming_exam,
    upcoming_assignment,
    weakest_subject,
    recent_reschedule_alert,
    today_tasks = [],
    today_goals = []
  } = data || {};

  const completedGoalsCount = today_goals.filter((g) => g.completed).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Automatic Rescheduling Banner Notice */}
      {(actionNotice || recent_reschedule_alert) && (
        <RescheduleBanner
          message={actionNotice?.message || recent_reschedule_alert}
          details={actionNotice?.details}
          onClose={() => setActionNotice(null)}
          onViewTimetable={() => onNavigate('timetable')}
        />
      )}

      {/* Top Welcome Header with Quick Action */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Adaptive Academic Engine Ready</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {getGreeting()}, {user?.name || 'Student'}! 👋
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              You have <span className="text-white font-semibold">{today_tasks_pending} pending session(s)</span> scheduled for today. Your current study streak is <span className="text-amber-400 font-bold">{study_streak} days</span>!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('planner')}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 group"
            >
              <BrainCircuit className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              <span>Generate Study Plan</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={onOpenPomodoro}
              className="px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-semibold transition-all flex items-center gap-2"
            >
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Start Timer</span>
            </button>
            <button
              onClick={() => onNavigate('notes')}
              className="px-4 py-2.5 rounded-2xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-semibold transition-all flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>Upload Notes</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Today's Study Hours */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Hours</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{today_study_hours_completed}h</span>
            <span className="text-xs text-slate-400 font-medium">/ {today_study_hours_planned}h target</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all"
              style={{
                width: `${today_study_hours_planned > 0 ? Math.min(100, (today_study_hours_completed / today_study_hours_planned) * 100) : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Tasks Completed & Pending */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Tasks</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{today_tasks_completed}</span>
            <span className="text-xs text-slate-400 font-medium">completed ({today_tasks_pending} pending)</span>
          </div>
          <div className="flex items-center gap-3 mt-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              ● {today_tasks_completed} Done
            </span>
            <span className="flex items-center gap-1 text-indigo-400 font-medium">
              ● {today_tasks_pending} Left
            </span>
            {today_tasks_missed > 0 && (
              <span className="flex items-center gap-1 text-rose-400 font-medium">
                ● {today_tasks_missed} Missed
              </span>
            )}
          </div>
        </div>

        {/* Study Streak */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Streak</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Flame className="w-4 h-4 fill-amber-400 text-amber-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400">{study_streak} Days</span>
            <span className="text-xs text-slate-400 font-medium">🔥 Active</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Consistent learning unlocks badges!
          </p>
        </div>

        {/* Overall Syllabus Progress */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Progress</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{overall_progress_percentage}%</span>
            <span className="text-xs text-slate-400 font-medium">Syllabus Mastered</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
              style={{ width: `${overall_progress_percentage}%` }}
            />
          </div>
        </div>

      </div>

      {/* 3 Secondary Highlight Cards: Upcoming Exam, Assignment, Weakest Subject */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Upcoming Exam Countdown */}
        <div className="glass-card rounded-2xl p-5 border-l-4 border-l-indigo-500 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" /> Upcoming Exam
              </span>
              {upcoming_exam && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                  {upcoming_exam.days_remaining === 0 ? 'Today!' : `${upcoming_exam.days_remaining} days remaining`}
                </span>
              )}
            </div>
            {upcoming_exam ? (
              <>
                <h4 className="font-bold text-white text-base leading-snug">{upcoming_exam.name}</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Subject: <span className="text-slate-200 font-medium">{upcoming_exam.subject_name}</span>
                </p>
                <p className="text-xs text-indigo-300/80 font-mono mt-0.5">Date: {upcoming_exam.exam_date}</p>
              </>
            ) : (
              <p className="text-xs text-slate-400 mt-2">No exams scheduled in the next 30 days.</p>
            )}
          </div>
          <button
            onClick={() => onNavigate('exams')}
            className="mt-4 text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 self-start"
          >
            Manage Exams <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Upcoming Assignment Countdown */}
        <div className="glass-card rounded-2xl p-5 border-l-4 border-l-amber-500 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Pending Assignment
              </span>
              {upcoming_assignment && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                  {upcoming_assignment.days_remaining === 0 ? 'Due Today!' : `${upcoming_assignment.days_remaining} days remaining`}
                </span>
              )}
            </div>
            {upcoming_assignment ? (
              <>
                <h4 className="font-bold text-white text-base leading-snug">{upcoming_assignment.title}</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Subject: <span className="text-slate-200 font-medium">{upcoming_assignment.subject_name}</span>
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-400 font-mono">Due: {upcoming_assignment.deadline}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {upcoming_assignment.priority} Priority
                  </span>
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-400 mt-2">No pending assignments due.</p>
            )}
          </div>
          <button
            onClick={() => onNavigate('exams')}
            className="mt-4 text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 self-start"
          >
            View Deadlines <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Weakest Subject Detection Card */}
        <div className="glass-card rounded-2xl p-5 border-l-4 border-l-rose-500 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Weak Subject Alert
              </span>
              {weakest_subject && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30 flex items-center gap-1">
                  <span>{weakest_subject.status_icon}</span>
                  <span>{weakest_subject.status}</span>
                </span>
              )}
            </div>
            {weakest_subject ? (
              <>
                <h4 className="font-bold text-white text-base leading-snug">{weakest_subject.name}</h4>
                <div className="flex items-center gap-3 mt-1.5">
                  <div className="text-xs text-slate-300">
                    Mastery: <span className="font-bold text-rose-400">{weakest_subject.performance_score}%</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Topics: <span className="text-slate-200">{weakest_subject.completed_topics}/{weakest_subject.total_topics}</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Recommended: <span className="text-indigo-300 font-semibold">{weakest_subject.recommended_hours_per_week} hrs/week</span> study time allocated by smart planner.
                </p>
              </>
            ) : (
              <p className="text-xs text-slate-400 mt-2">All subjects are performing strong!</p>
            )}
          </div>
          <button
            onClick={() => onNavigate('subjects')}
            className="mt-4 text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 self-start"
          >
            Review Weak Topics <ArrowRight className="w-3 h-3" />
          </button>
        </div>

      </div>

      {/* Section 12 & 13: Today's Recommended Goals & Achievement Badges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Daily Goals (2 cols) */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="font-bold text-base text-white">Today's Recommended Goals</h3>
                <p className="text-xs text-slate-400">
                  {completedGoalsCount} of {today_goals.length} goals completed today
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {today_goals.length > 0 ? Math.round((completedGoalsCount / today_goals.length) * 100) : 0}% Done
            </span>
          </div>

          {/* Goal checklist */}
          <div className="space-y-2.5">
            {today_goals.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">No goals set for today yet.</p>
            ) : (
              today_goals.map((g) => (
                <div
                  key={g.id}
                  onClick={() => handleToggleGoal(g.id)}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    g.completed
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-400'
                      : 'bg-slate-900/60 border-white/5 hover:border-indigo-500/30 text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                        g.completed ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-white/20'
                      }`}
                    >
                      {g.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <span className={`text-xs font-medium ${g.completed ? 'line-through text-slate-400' : ''}`}>
                      {g.title}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Today</span>
                </div>
              ))
            )}
          </div>

          {/* Add Goal Input */}
          <form onSubmit={handleAddGoal} className="flex items-center gap-2 pt-2">
            <input
              type="text"
              value={newGoalText}
              onChange={(e) => setNewGoalText(e.target.value)}
              placeholder="Add a new custom target for today..."
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Goal</span>
            </button>
          </form>
        </div>

        {/* Achievement Badges (1 col) */}
        <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/10">
            <Award className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-base text-white">Study Badges</h3>
              <p className="text-xs text-slate-400">Consistency milestones</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center gap-3">
              <span className="text-xl">🚀</span>
              <div>
                <span className="font-bold text-white block">First Step</span>
                <span className="text-[10px] text-slate-400">Started your academic study plan</span>
              </div>
              <span className="ml-auto text-[10px] font-bold text-emerald-400">Unlocked</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center gap-3">
              <span className="text-xl">🔥</span>
              <div>
                <span className="font-bold text-white block">3 Day Streak</span>
                <span className="text-[10px] text-slate-400">Maintained 3 consecutive study days</span>
              </div>
              <span className="ml-auto text-[10px] font-bold text-emerald-400">Unlocked</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center gap-3">
              <span className="text-xl">⚡</span>
              <div>
                <span className="font-bold text-white block">7 Day Streak</span>
                <span className="text-[10px] text-slate-400">{study_streak >= 7 ? 'Completed 1 full week' : `${study_streak}/7 days`}</span>
              </div>
              <span className={`ml-auto text-[10px] font-bold ${study_streak >= 7 ? 'text-emerald-400' : 'text-slate-500'}`}>
                {study_streak >= 7 ? 'Unlocked' : 'In Progress'}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center gap-3">
              <span className="text-xl">🎓</span>
              <div>
                <span className="font-bold text-white block">Exam Ready</span>
                <span className="text-[10px] text-slate-400">Completed all high-priority topics</span>
              </div>
              <span className="ml-auto text-[10px] font-bold text-amber-400">Level 2</span>
            </div>
          </div>
        </div>

      </div>

      {/* Today's Scheduled Tasks Checklist */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/10">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ListTodo className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Today's Study Schedule</h3>
              <p className="text-xs text-slate-400">Non-overlapping adaptive study sessions for today</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('timetable')}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-colors flex items-center gap-1.5"
          >
            Full Week View <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {today_tasks.length === 0 ? (
          <div className="text-center py-10 space-y-3">
            <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm text-slate-400">No study sessions scheduled for today yet.</p>
            <button
              onClick={() => onNavigate('planner')}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md inline-flex items-center gap-2"
            >
              <BrainCircuit className="w-4 h-4" />
              <span>Generate Timetable</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {today_tasks.map((task) => {
              const isDone = task.status === 'Completed';
              const isMissed = task.status === 'Missed';

              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    isDone
                      ? 'bg-emerald-950/20 border-emerald-500/30 opacity-75'
                      : isMissed
                      ? 'bg-rose-950/20 border-rose-500/30'
                      : 'glass-card border-white/10 hover:border-indigo-500/40'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    {/* Time pill */}
                    <div className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-center shrink-0">
                      <div className="font-mono text-xs font-bold text-white">
                        {task.start_time} - {task.end_time}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {task.duration_minutes} mins
                      </div>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white"
                          style={{ backgroundColor: task.subject_color || '#4f46e5' }}
                        >
                          {task.subject_name}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-bold text-slate-300">
                          {task.priority_level || 'MEDIUM'}
                        </span>
                        {task.is_rescheduled && (
                          <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                            🔄 Auto-Rescheduled
                          </span>
                        )}
                      </div>
                      <h4
                        className={`text-sm font-semibold mt-1 ${
                          isDone ? 'line-through text-slate-400' : 'text-white'
                        }`}
                      >
                        {task.title}
                      </h4>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {!isDone && !isMissed && (
                      <>
                        <button
                          onClick={onOpenPomodoro}
                          title="Start focus timer on this task"
                          className="p-2 rounded-xl bg-white/5 hover:bg-indigo-600/30 text-indigo-400 hover:text-white border border-white/10 transition-colors"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMarkComplete(task.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-semibold transition-all flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Complete</span>
                        </button>
                        <button
                          onClick={() => handleMarkMissed(task.id)}
                          title="Missed this session? Auto-reschedule to appropriate future slot"
                          className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-semibold transition-all flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Missed (Auto-Reschedule)</span>
                        </button>
                      </>
                    )}
                    {isDone && (
                      <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Done
                      </span>
                    )}
                    {isMissed && (
                      <span className="px-3 py-1 rounded-xl bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30 flex items-center gap-1">
                        <RotateCcw className="w-3.5 h-3.5" /> Rescheduled
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
