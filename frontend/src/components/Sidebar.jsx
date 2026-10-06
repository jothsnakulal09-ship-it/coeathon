import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Clock,
  CalendarPlus,
  Calendar,
  CheckSquare,
  BarChart3,
  GraduationCap,
  FileText,
  Bot,
  Settings,
  Flame,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({ activePage, onNavigate, streak = 0 }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'subjects', label: 'Subjects & Topics', icon: BookOpen, badge: null },
    { id: 'availability', label: 'Study Availability', icon: Clock, badge: 'New' },
    { id: 'planner', label: 'Create Study Plan', icon: CalendarPlus, badge: 'Smart' },
    { id: 'timetable', label: 'Calendar / Timetable', icon: Calendar, badge: null },
    { id: 'tasks', label: 'Daily Tasks', icon: CheckSquare, badge: 'Live' },
    { id: 'analytics', label: 'Progress Analytics', icon: BarChart3, badge: null },
    { id: 'exams', label: 'Exams & Deadlines', icon: GraduationCap, badge: null },
    { id: 'notes', label: 'Study Notes & RAG', icon: FileText, badge: 'RAG' },
    { id: 'assistant', label: 'AI Study Assistant', icon: Bot, badge: 'AI' },
    { id: 'profile', label: 'Profile / Settings', icon: Settings, badge: null },
  ];

  return (
    <aside className="w-64 shrink-0 hidden md:block">
      <div className="sticky top-20 glass-panel rounded-2xl p-3 border border-white/10 shadow-xl space-y-1">
        
        {/* Navigation list */}
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        item.badge === 'Smart' || item.badge === 'AI' || item.badge === 'RAG'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Consistency Motivation */}
        <div className="pt-3 mt-3 border-t border-white/5 px-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-950/60 to-purple-950/40 border border-indigo-500/20 text-left">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-xs font-bold text-slate-200">Consistency Power</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Studying consistently beats an 8-hour cram session. Keep up your {streak}-day streak!
            </p>
          </div>
        </div>

      </div>
    </aside>
  );
}
