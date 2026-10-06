import React, { useState } from 'react';
import {
  User,
  Settings,
  Mail,
  GraduationCap,
  Clock,
  Flame,
  RefreshCw,
  Save,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { api, setCurrentUser } from '../api/client';
import confetti from 'canvas-confetti';

export default function ProfileSettings({ user, onUserUpdated, onSeedDemo }) {
  const [name, setName] = useState(user?.name || '');
  const [college, setCollege] = useState(user?.college || '');
  const [major, setMajor] = useState(user?.major || '');
  const [dailyHours, setDailyHours] = useState(user?.daily_study_hours || 3.0);
  const [preferredSlot, setPreferredSlot] = useState(user?.preferred_slot || 'Evening (6 PM - 10 PM)');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const updated = await api.updateProfile({
        name,
        college,
        major,
        daily_study_hours: parseFloat(dailyHours),
        preferred_slot: preferredSlot,
      });

      setCurrentUser(updated);
      if (onUserUpdated) onUserUpdated(updated);
      setMessage('Profile settings updated successfully!');
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
            <Settings className="w-3.5 h-3.5" />
            <span>Preferences & Settings</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Student Profile & Preferences
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure your daily study targets, preferred learning timeframes, and academic curriculum
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold text-xs">
          <Flame className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span>{user?.study_streak || 5} Day Streak Active</span>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Col: Profile Avatar Card */}
        <div className="glass-panel rounded-3xl p-6 border border-white/10 text-center space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 mx-auto shadow-xl shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center text-2xl font-black text-white">
              {name ? name.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-base text-white">{name || 'Alex Chen'}</h3>
            <p className="text-xs text-slate-400">{user?.email}</p>
            <p className="text-[11px] text-indigo-300 font-medium mt-1">{major || 'Computer Science'}</p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 text-left text-xs space-y-2">
            <div className="flex justify-between text-slate-400">
              <span>Institution:</span>
              <span className="text-white font-medium">{college || 'Engineering'}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Daily Target:</span>
              <span className="text-white font-medium">{dailyHours} Hours</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Preferred Slot:</span>
              <span className="text-white font-medium">{preferredSlot.split(' ')[0]}</span>
            </div>
          </div>

          {/* Quick Demo Reset Button */}
          <div className="pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onSeedDemo}
              className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Demo Academic Data</span>
            </button>
            <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
              Resets sample DBMS, OS, ML subjects, upcoming exams in 5 days, and auto-rescheduled demo tasks.
            </p>
          </div>
        </div>

        {/* Right Col: Settings Form (2 cols) */}
        <div className="md:col-span-2 glass-panel rounded-3xl p-6 sm:p-7 border border-white/10">
          <form onSubmit={handleSave} className="space-y-4">
            
            <h3 className="font-bold text-sm text-white mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" /> Student Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/40 border border-white/5 text-slate-400 text-xs cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">College / University</label>
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Major / Specialization</label>
                <input
                  type="text"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <h3 className="font-bold text-sm text-white mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" /> Study Planner Preferences
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Daily Study Target</label>
                  <select
                    value={dailyHours}
                    onChange={(e) => setDailyHours(parseFloat(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="2.0">2.0 Hours / day</option>
                    <option value="3.0">3.0 Hours / day (Standard)</option>
                    <option value="3.5">3.5 Hours / day</option>
                    <option value="4.0">4.0 Hours / day (Intensive)</option>
                    <option value="5.0">5.0 Hours / day (Exam Cram)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Preferred Time Window</label>
                  <select
                    value={preferredSlot}
                    onChange={(e) => setPreferredSlot(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Evening (6 PM - 10 PM)">Evening (6:00 PM – 10:00 PM)</option>
                    <option value="Morning (7 AM - 11 AM)">Morning (7:00 AM – 11:00 AM)</option>
                    <option value="Afternoon (2 PM - 6 PM)">Afternoon (2:00 PM – 6:00 PM)</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="py-3 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 mt-4"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Preferences</span>
                </>
              )}
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
