import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Calendar,
  Plus,
  Trash2,
  CheckCircle,
  Circle,
  Clock,
  Sparkles,
  Zap,
  AlertCircle
} from 'lucide-react';
import { api } from '../api/client';
import confetti from 'canvas-confetti';

export default function ExamsAssignments() {
  const [exams, setExams] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Exam form
  const [showAddExam, setShowAddExam] = useState(false);
  const [examSubId, setExamSubId] = useState('');
  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examWeight, setExamWeight] = useState(40);
  const [examNotes, setExamNotes] = useState('');

  // Add Assignment form
  const [showAddAssign, setShowAddAssign] = useState(false);
  const [assignSubId, setAssignSubId] = useState('');
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDeadline, setAssignDeadline] = useState('');
  const [assignPriority, setAssignPriority] = useState('High');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [exRes, asRes, subRes] = await Promise.all([
        api.getExams(),
        api.getAssignments(),
        api.getSubjects(),
      ]);
      setExams(exRes);
      setAssignments(asRes);
      setSubjects(subRes);
      if (subRes.length > 0) {
        if (!examSubId) setExamSubId(subRes[0].id);
        if (!assignSubId) setAssignSubId(subRes[0].id);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateExam = async (e) => {
    e.preventDefault();
    if (!examSubId || !examName.trim() || !examDate) return;
    try {
      await api.createExam({
        subject_id: parseInt(examSubId, 10),
        name: examName,
        exam_date: examDate,
        weight_percentage: parseInt(examWeight, 10),
        notes: examNotes,
      });
      setExamName('');
      setExamDate('');
      setShowAddExam(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteExam = async (id) => {
    if (!window.confirm('Delete this exam?')) return;
    try {
      await api.deleteExam(id);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!assignSubId || !assignTitle.trim() || !assignDeadline) return;
    try {
      await api.createAssignment({
        subject_id: parseInt(assignSubId, 10),
        title: assignTitle,
        deadline: assignDeadline,
        priority: assignPriority,
      });
      setAssignTitle('');
      setAssignDeadline('');
      setShowAddAssign(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleAssignment = async (id) => {
    try {
      const res = await api.toggleAssignment(id);
      if (res.completed) {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      }
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm('Delete this assignment?')) return;
    try {
      await api.deleteAssignment(id);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Academic Milestones & Deadlines</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Exams & Assignments Countdown
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Approaching dates automatically surge subject priority in the adaptive schedule
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddExam(true)}
            className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Exam</span>
          </button>
          <button
            onClick={() => setShowAddAssign(true)}
            className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Assignment</span>
          </button>
        </div>
      </div>

      {/* Dynamic Proximity Priority Badge Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/30 flex items-center gap-3 text-xs text-indigo-200">
        <Zap className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
        <span>
          <strong>Proximity Priority Boost Active:</strong> Any exam within 7 days automatically boosts its subject's study priority by up to +35% in your generated timetable.
        </span>
      </div>

      {/* Add Exam Form Modal */}
      {showAddExam && (
        <div className="glass-panel rounded-2xl p-5 border border-indigo-500/40 shadow-2xl animate-in fade-in">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-indigo-400" /> Schedule Examination
            </h3>
            <button onClick={() => setShowAddExam(false)} className="text-xs text-slate-400 hover:text-white">
              Cancel
            </button>
          </div>
          <form onSubmit={handleCreateExam} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Subject</label>
              <select
                value={examSubId}
                onChange={(e) => setExamSubId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Exam Name</label>
              <input
                type="text"
                required
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="e.g. DBMS Mid-Semester Test"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Exam Date</label>
              <input
                type="date"
                required
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={examNotes}
                onChange={(e) => setExamNotes(e.target.value)}
                placeholder="Notes / Room"
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
              />
              <button
                type="submit"
                className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all shrink-0"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Assignment Form Modal */}
      {showAddAssign && (
        <div className="glass-panel rounded-2xl p-5 border border-purple-500/40 shadow-2xl animate-in fade-in">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-400" /> New Assignment Deadline
            </h3>
            <button onClick={() => setShowAddAssign(false)} className="text-xs text-slate-400 hover:text-white">
              Cancel
            </button>
          </div>
          <form onSubmit={handleCreateAssignment} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Subject</label>
              <select
                value={assignSubId}
                onChange={(e) => setAssignSubId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Assignment Title</label>
              <input
                type="text"
                required
                value={assignTitle}
                onChange={(e) => setAssignTitle(e.target.value)}
                placeholder="e.g. SQL Complex Joins Project"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Deadline Date</label>
              <input
                type="date"
                required
                value={assignDeadline}
                onChange={(e) => setAssignDeadline(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={assignPriority}
                onChange={(e) => setAssignPriority(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
                <option value="Urgent">Urgent Priority</option>
              </select>
              <button
                type="submit"
                className="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all shrink-0"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Two Columns: Upcoming Exams on Left, Assignments on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Exams List */}
        <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-base text-white">Upcoming Examinations</h3>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
              {exams.length} Listed
            </span>
          </div>

          {exams.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No exams scheduled. Click "+ Add Exam" to track.</p>
          ) : (
            <div className="space-y-3">
              {exams.map((ex) => {
                const days = ex.days_remaining;
                const isUrgent = days <= 5;

                return (
                  <div
                    key={ex.id}
                    className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 hover:border-indigo-500/40 transition-all flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold text-white"
                          style={{ backgroundColor: ex.subject_color || '#4f46e5' }}
                        >
                          {ex.subject_name}
                        </span>
                        {/* Countdown Badge from Prompt Specs */}
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                            isUrgent
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse'
                              : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                          }`}
                        >
                          {days === 0 ? 'Today!' : `${days} days remaining`}
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-sm mt-1">{ex.name}</h4>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                        <span>Date: {ex.exam_date}</span>
                        <span>Weight: {ex.weight_percentage}%</span>
                      </div>
                      {ex.notes && (
                        <p className="text-[11px] text-slate-400 mt-1 italic">Note: {ex.notes}</p>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteExam(ex.id)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-xl hover:bg-white/5 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Assignments List */}
        <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              <h3 className="font-bold text-base text-white">Assignments & Projects</h3>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
              {assignments.length} Listed
            </span>
          </div>

          {assignments.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No assignments listed. Click "+ Add Assignment" to track.</p>
          ) : (
            <div className="space-y-3">
              {assignments.map((a) => {
                const isDone = a.completed;
                const days = a.days_remaining;

                return (
                  <div
                    key={a.id}
                    className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                      isDone
                        ? 'bg-emerald-950/15 border-emerald-500/20 opacity-70'
                        : 'bg-slate-900/60 border-white/10 hover:border-purple-500/40'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleToggleAssignment(a.id)}
                        className={`mt-0.5 transition-colors ${
                          isDone ? 'text-emerald-400' : 'text-slate-500 hover:text-purple-400'
                        }`}
                      >
                        {isDone ? <CheckCircle className="w-5 h-5 fill-emerald-500/20" /> : <Circle className="w-5 h-5" />}
                      </button>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold text-white"
                            style={{ backgroundColor: a.subject_color || '#4f46e5' }}
                          >
                            {a.subject_name}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              a.priority === 'Urgent'
                                ? 'bg-rose-500/20 text-rose-300'
                                : a.priority === 'High'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-indigo-500/20 text-indigo-300'
                            }`}
                          >
                            {a.priority} Priority
                          </span>
                          {!isDone && (
                            <span className="text-[10px] font-mono text-slate-400">
                              {days < 0 ? 'Overdue' : days === 0 ? 'Due today' : `${days} days remaining`}
                            </span>
                          )}
                        </div>
                        <h4
                          className={`font-bold text-sm mt-1 ${
                            isDone ? 'line-through text-slate-400' : 'text-white'
                          }`}
                        >
                          {a.title}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 font-mono">Deadline: {a.deadline}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteAssignment(a.id)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-xl hover:bg-white/5 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
