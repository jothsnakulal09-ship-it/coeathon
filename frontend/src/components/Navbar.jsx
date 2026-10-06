import React, { useState, useEffect } from 'react';
import { Sparkles, Flame, Clock, RefreshCw, LogOut, User, Bell, Check, Trash2, X } from 'lucide-react';
import { api } from '../api/client';

export default function Navbar({
  user,
  streak = 0,
  onOpenPomodoro,
  onSeedDemo,
  onLogout,
  onNavigate,
  activePage
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifs = async () => {
    try {
      const res = await api.getNotifications();
      setNotifications(res || []);
      setUnreadCount((res || []).filter((n) => !n.is_read).length);
    } catch (e) {}
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      fetchNotifs();
    } catch (e) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      fetchNotifs();
    } catch (e) {}
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Brand Identity */}
        <div 
          onClick={() => onNavigate('dashboard')} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400 group-hover:rotate-12 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                Adaptive StudyAI
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 -mt-0.5">Intelligent Study Planner & Progress Tracker</p>
          </div>
        </div>

        {/* Center / Right Quick Actions */}
        <div className="flex items-center gap-3">
          
          {/* Study Streak Badge */}
          <div 
            title="Your continuous study streak"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-bold"
          >
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400 animate-bounce" />
            <span>{streak} Day Streak</span>
          </div>

          {/* Pomodoro Focus Button */}
          <button
            onClick={onOpenPomodoro}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 hover:text-white text-xs font-semibold transition-all shadow-sm"
          >
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Focus Timer</span>
          </button>

          {/* Quick Demo Data Seed Button */}
          <button
            onClick={onSeedDemo}
            title="Reset or refresh sample academic demo curriculum"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-medium transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Demo Data</span>
          </button>

          {/* Notifications Bell Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 glass-panel rounded-2xl p-4 shadow-2xl border border-white/10 z-50 animate-in fade-in">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                  <div className="flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-indigo-400" />
                    <span className="font-bold text-xs text-white">Notifications ({unreadCount} unread)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                      >
                        Mark All Read
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-slate-400 hover:text-white p-1 rounded-lg"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-500 py-6 text-center">No notifications yet.</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-2.5 rounded-xl border text-xs transition-all ${
                          n.is_read
                            ? 'bg-slate-900/40 border-white/5 opacity-70'
                            : 'bg-slate-900 border-indigo-500/30'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-bold text-white text-[11px]">{n.title}</span>
                          {!n.is_read && (
                            <button
                              onClick={() => handleMarkRead(n.id)}
                              className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
                            >
                              <Check className="w-3 h-3" /> Read
                            </button>
                          )}
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed">{n.message}</p>
                        <span className="text-[9px] text-slate-500 mt-1 block">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-white/10">
            <button
              onClick={() => onNavigate('profile')}
              className={`flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl transition-all ${
                activePage === 'profile'
                  ? 'bg-white/15 text-white'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300'
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-xs font-semibold text-white leading-tight">{user?.name || 'Alex Chen'}</p>
                <p className="text-[10px] text-slate-400 truncate max-w-[100px]">{user?.college || 'CS & Engineering'}</p>
              </div>
            </button>

            <button
              onClick={onLogout}
              title="Logout"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </header>
  );
}
