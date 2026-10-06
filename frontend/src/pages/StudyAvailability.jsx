import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Save, CheckCircle2, ShieldCheck, Sparkles, Sliders } from 'lucide-react';
import { api } from '../api/client';
import confetti from 'canvas-confetti';

export default function StudyAvailability({ onNavigate }) {
  const [availability, setAvailability] = useState([
    { day_of_week: 'Monday', available_hours: 3.0 },
    { day_of_week: 'Tuesday', available_hours: 2.5 },
    { day_of_week: 'Wednesday', available_hours: 3.0 },
    { day_of_week: 'Thursday', available_hours: 2.0 },
    { day_of_week: 'Friday', available_hours: 3.5 },
    { day_of_week: 'Saturday', available_hours: 4.0 },
    { day_of_week: 'Sunday', available_hours: 2.0 },
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchAvail = async () => {
      try {
        setLoading(true);
        const res = await api.getAvailability();
        if (res && res.length > 0) {
          setAvailability(res);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAvail();
  }, []);

  const handleHourChange = (dayName, hours) => {
    setAvailability((prev) =>
      prev.map((item) =>
        item.day_of_week === dayName ? { ...item, available_hours: parseFloat(hours) } : item
      )
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.updateAvailability(availability);
      setMessage('Weekly study availability updated successfully!');
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      alert(err.message || 'Failed to update availability');
    } finally {
      setSaving(false);
    }
  };

  const totalWeeklyHours = availability.reduce((acc, curr) => acc + (curr.available_hours || 0), 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
            <Clock className="w-3.5 h-3.5" />
            <span>Time Capacity Management</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Weekly Study Availability
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure different study hours for each day of the week. The adaptive scheduler strictly respects these limits.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-bold text-xs">
          <span>Total: {totalWeeklyHours.toFixed(1)} hrs/week</span>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSave} className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/10 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availability.map((item) => (
            <div
              key={item.day_of_week}
              className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-indigo-500/30 transition-all flex items-center justify-between gap-4"
            >
              <div>
                <span className="font-bold text-sm text-white block">{item.day_of_week}</span>
                <span className="text-xs text-slate-400 font-mono">
                  {item.available_hours > 0 ? `${item.available_hours} hours available` : 'Rest day (0 hrs)'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="8"
                  step="0.5"
                  value={item.available_hours}
                  onChange={(e) => handleHourChange(item.day_of_week, e.target.value)}
                  className="w-24 accent-indigo-500 cursor-pointer"
                />
                <select
                  value={item.available_hours}
                  onChange={(e) => handleHourChange(item.day_of_week, e.target.value)}
                  className="px-2.5 py-1 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-mono font-semibold"
                >
                  <option value="0">0h</option>
                  <option value="1">1h</option>
                  <option value="1.5">1.5h</option>
                  <option value="2">2h</option>
                  <option value="2.5">2.5h</option>
                  <option value="3">3h</option>
                  <option value="3.5">3.5h</option>
                  <option value="4">4h</option>
                  <option value="5">5h</option>
                  <option value="6">6h</option>
                  <option value="8">8h</option>
                </select>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-slate-300 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0" />
          <span>
            <strong>Zero Collision Guarantee:</strong> The intelligent scheduler maps non-overlapping sessions within these exact daily limits and preserves buffer breaks between sessions.
          </span>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('planner')}
            className="text-xs font-semibold text-slate-400 hover:text-white"
          >
            ← Back to Study Plan Generator
          </button>

          <button
            type="submit"
            disabled={saving}
            className="py-2.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Availability</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
