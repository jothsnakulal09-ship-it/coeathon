import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  Circle,
  AlertTriangle,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Tag,
  Star,
  Check
} from 'lucide-react';
import { api } from '../api/client';
import confetti from 'canvas-confetti';

export default function SubjectsTopics() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedSubject, setExpandedSubject] = useState(null);

  // Modals / forms
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubColor, setNewSubColor] = useState('#6366f1');

  const [addTopicSubId, setAddTopicSubId] = useState(null);
  const [topicName, setTopicName] = useState('');
  const [topicDiff, setTopicDiff] = useState('Medium');
  const [topicImportance, setTopicImportance] = useState(3);
  const [topicMins, setTopicMins] = useState(60);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await api.getSubjects();
      setSubjects(res);
      if (res.length > 0 && !expandedSubject) {
        setExpandedSubject(res[0].id);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!newSubName.trim()) return;
    try {
      await api.createSubject({
        name: newSubName,
        code: newSubCode || newSubName.slice(0, 4).toUpperCase(),
        color: newSubColor,
      });
      setNewSubName('');
      setNewSubCode('');
      setShowAddSubject(false);
      fetchSubjects();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteSubject = async (subId) => {
    if (!window.confirm('Are you sure you want to delete this subject and all its topics?')) return;
    try {
      await api.deleteSubject(subId);
      fetchSubjects();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!topicName.trim() || !addTopicSubId) return;
    try {
      await api.createTopic(addTopicSubId, {
        name: topicName,
        difficulty: topicDiff,
        importance: parseInt(topicImportance, 10),
        estimated_minutes: parseInt(topicMins, 10),
      });
      setTopicName('');
      setAddTopicSubId(null);
      fetchSubjects();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleTopic = async (topicId) => {
    try {
      const res = await api.toggleTopic(topicId);
      if (res.completed) {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
      }
      fetchSubjects();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteTopic = async (topicId) => {
    if (!window.confirm('Delete this topic?')) return;
    try {
      await api.deleteTopic(topicId);
      fetchSubjects();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading && subjects.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Academic Curriculum Management</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Subjects & Topic Mastery
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Organize topics, set difficulties, and let the AI detect your weakest subjects in real time
          </p>
        </div>

        <button
          onClick={() => setShowAddSubject(true)}
          className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Subject</span>
        </button>
      </div>

      {/* Add Subject Modal / Inline Form */}
      {showAddSubject && (
        <div className="glass-panel rounded-2xl p-5 border border-indigo-500/40 shadow-2xl animate-in fade-in">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" /> Create Subject
            </h3>
            <button
              onClick={() => setShowAddSubject(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
          <form onSubmit={handleCreateSubject} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Subject Name</label>
              <input
                type="text"
                required
                value={newSubName}
                onChange={(e) => setNewSubName(e.target.value)}
                placeholder="e.g. Distributed Database Systems"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Subject Code</label>
              <input
                type="text"
                value={newSubCode}
                onChange={(e) => setNewSubCode(e.target.value)}
                placeholder="e.g. DDBS"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Color Theme</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newSubColor}
                  onChange={(e) => setNewSubColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all"
                >
                  Save Subject
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Add Topic Modal / Drawer */}
      {addTopicSubId && (
        <div className="glass-panel rounded-2xl p-5 border border-purple-500/40 shadow-2xl animate-in fade-in">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-purple-400" /> Add Topic to{' '}
              {subjects.find((s) => s.id === addTopicSubId)?.name}
            </h3>
            <button
              onClick={() => setAddTopicSubId(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
          <form onSubmit={handleCreateTopic} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Topic Name</label>
              <input
                type="text"
                required
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                placeholder="e.g. B+ Tree Indexing & Search"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Difficulty</label>
              <select
                value={topicDiff}
                onChange={(e) => setTopicDiff(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
              >
                <option value="Easy">Easy (30-45m)</option>
                <option value="Medium">Medium (60m)</option>
                <option value="Hard">Hard (75-90m)</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Importance (1-5)</label>
                <select
                  value={topicImportance}
                  onChange={(e) => setTopicImportance(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value="1">1 - Low</option>
                  <option value="2">2 - Basic</option>
                  <option value="3">3 - Moderate</option>
                  <option value="4">4 - High Exam Weight</option>
                  <option value="5">5 - Critical Exam Must</option>
                </select>
              </div>
              <button
                type="submit"
                className="py-2 px-4 mt-auto rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all self-end"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List of Subjects */}
      <div className="space-y-4">
        {subjects.map((sub) => {
          const perf = sub.performance || {};
          const isExpanded = expandedSubject === sub.id;
          const status = perf.status || 'Average';
          const statusIcon = perf.status_icon || '🟡';
          const progress = perf.progress_percentage || 0;

          return (
            <div
              key={sub.id}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isExpanded ? 'glass-panel border-indigo-500/40 shadow-xl' : 'glass-card border-white/10'
              }`}
            >
              {/* Subject Header Card */}
              <div
                onClick={() => setExpandedSubject(isExpanded ? null : sub.id)}
                className="p-5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-3.5 h-10 rounded-full shrink-0"
                    style={{ backgroundColor: sub.color || '#4f46e5' }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white/10 text-slate-300">
                        {sub.code}
                      </span>
                      <h3 className="font-bold text-base text-white">{sub.name}</h3>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      <span>{sub.topics?.length || 0} Topics</span>
                      <span>●</span>
                      <span>{perf.completed_topics || 0} Mastered</span>
                      {perf.missed_tasks_count > 0 && (
                        <>
                          <span>●</span>
                          <span className="text-rose-400 font-medium">
                            {perf.missed_tasks_count} Missed Sessions
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Badges & Controls */}
                <div className="flex items-center gap-3 self-end sm:self-center">
                  {/* Weak Subject Status Badge (Unique Feature #9) */}
                  <div
                    className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold ${
                      status === 'Needs Attention'
                        ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                        : status === 'Strong'
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                        : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                    }`}
                  >
                    <span>{statusIcon}</span>
                    <span>{perf.performance_score}%</span>
                    <span>-</span>
                    <span>{status}</span>
                  </div>

                  {/* Progress bar pill */}
                  <div className="hidden md:block w-28 text-right">
                    <span className="text-[11px] text-slate-400 font-mono">{progress}% Complete</span>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${progress}%`,
                          backgroundColor: sub.color || '#4f46e5',
                        }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSubject(sub.id);
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete Subject"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="text-slate-400 p-1">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>
              </div>

              {/* Topics Drawer */}
              {isExpanded && (
                <div className="border-t border-white/10 bg-slate-950/40 p-5 space-y-3">
                  <div className="flex items-center justify-between pb-2">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Topics in this Subject ({sub.topics?.length || 0})
                    </span>
                    <button
                      onClick={() => setAddTopicSubId(sub.id)}
                      className="text-xs font-semibold px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-indigo-300 border border-white/10 transition-colors flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Topic
                    </button>
                  </div>

                  {(!sub.topics || sub.topics.length === 0) ? (
                    <p className="text-xs text-slate-500 py-4 text-center">
                      No topics added yet. Click "+ Add Topic" to start.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {sub.topics.map((t) => {
                        const isDone = t.completed;
                        return (
                          <div
                            key={t.id}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                              isDone
                                ? 'bg-emerald-950/15 border-emerald-500/25 opacity-80'
                                : 'bg-slate-900/60 border-white/5 hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleToggleTopic(t.id)}
                                className={`transition-colors p-0.5 ${
                                  isDone ? 'text-emerald-400' : 'text-slate-500 hover:text-indigo-400'
                                }`}
                              >
                                {isDone ? <CheckCircle className="w-5 h-5 fill-emerald-500/20" /> : <Circle className="w-5 h-5" />}
                              </button>

                              <div>
                                <h4
                                  className={`text-xs font-semibold ${
                                    isDone ? 'line-through text-slate-400' : 'text-white'
                                  }`}
                                >
                                  {t.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-1 text-[10px]">
                                  {/* Difficulty Pill */}
                                  <span
                                    className={`px-1.5 py-0.5 rounded font-bold ${
                                      t.difficulty === 'Hard'
                                        ? 'bg-rose-500/20 text-rose-300'
                                        : t.difficulty === 'Easy'
                                        ? 'bg-emerald-500/20 text-emerald-300'
                                        : 'bg-amber-500/20 text-amber-300'
                                    }`}
                                  >
                                    {t.difficulty}
                                  </span>

                                  {/* Importance Stars */}
                                  <span className="flex items-center text-amber-400 font-medium">
                                    <Star className="w-3 h-3 fill-amber-400" />
                                    <span className="ml-0.5">{t.importance}/5</span>
                                  </span>

                                  <span className="text-slate-400 flex items-center gap-0.5">
                                    <Clock className="w-3 h-3" /> {t.estimated_minutes}m
                                  </span>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => handleDeleteTopic(t.id)}
                              className="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-white/5 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
