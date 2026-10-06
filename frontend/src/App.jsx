import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import PomodoroTimer from './components/PomodoroTimer';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SubjectsTopics from './pages/SubjectsTopics';
import StudyAvailability from './pages/StudyAvailability';
import CreateStudyPlan from './pages/CreateStudyPlan';
import CalendarTimetable from './pages/CalendarTimetable';
import DailyTasks from './pages/DailyTasks';
import ProgressAnalytics from './pages/ProgressAnalytics';
import ExamsAssignments from './pages/ExamsAssignments';
import NotesRAG from './pages/NotesRAG';
import AIStudyAssistant from './pages/AIStudyAssistant';
import ProfileSettings from './pages/ProfileSettings';

import {
  getCurrentUser,
  getAuthToken,
  removeAuthToken,
  removeCurrentUser,
  api
} from './api/client';
import confetti from 'canvas-confetti';

export default function App() {
  const [user, setUser] = useState(getCurrentUser());
  const [isPomodoroOpen, setIsPomodoroOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      api.getMe()
        .then((userData) => {
          setUser(userData);
        })
        .catch(() => {
          removeAuthToken();
          removeCurrentUser();
          setUser(null);
        })
        .finally(() => setAuthChecked(true));
    } else {
      setAuthChecked(true);
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    removeAuthToken();
    removeCurrentUser();
    setUser(null);
    navigate('/login');
  };

  const handleSeedDemo = async () => {
    if (!window.confirm('Reset and load the sample college academic curriculum (DBMS, OS, ML, Exams)?')) return;
    try {
      await api.seedDemo();
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      alert('Sample academic data reset successfully!');
      window.location.reload();
    } catch (err) {
      alert(err.message || 'Failed to seed demo data');
    }
  };

  // Convert current path to activePage id for sidebar highlighting
  const getActivePageId = () => {
    const p = location.pathname.replace('/', '') || 'dashboard';
    if (p === 'planner') return 'planner';
    if (p === 'study-plan') return 'planner';
    if (p === 'timetable' || p === 'calendar') return 'timetable';
    if (p === 'analytics' || p === 'progress') return 'analytics';
    if (p === 'exams' || p === 'assignments') return 'exams';
    if (p === 'assistant' || p === 'ai-assistant') return 'assistant';
    if (p === 'settings') return 'profile';
    return p;
  };

  const activePage = getActivePageId();

  const handleNavigate = (pageId) => {
    if (pageId === 'planner') navigate('/study-plan');
    else if (pageId === 'timetable') navigate('/calendar');
    else if (pageId === 'assistant') navigate('/ai-assistant');
    else navigate(`/${pageId}`);
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Unauthenticated routes
  if (!user) {
    return (
      <Routes>
        <Route
          path="/login"
          element={
            <Login
              onLoginSuccess={handleLoginSuccess}
              onSwitchToRegister={() => navigate('/register')}
            />
          }
        />
        <Route
          path="/register"
          element={
            <Register
              onRegisterSuccess={handleLoginSuccess}
              onSwitchToLogin={() => navigate('/login')}
            />
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Authenticated Application Shell
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      
      {/* Top Navbar with Notifications, Streak, and Focus Mode */}
      <Navbar
        user={user}
        streak={user.study_streak || 5}
        onOpenPomodoro={() => setIsPomodoroOpen(true)}
        onSeedDemo={handleSeedDemo}
        onLogout={handleLogout}
        onNavigate={handleNavigate}
        activePage={activePage}
      />

      {/* Main Layout Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-6">
        
        {/* Sticky Sidebar Navigation */}
        <Sidebar
          activePage={activePage}
          onNavigate={handleNavigate}
          streak={user.study_streak || 5}
        />

        {/* Dynamic Route View */}
        <main className="flex-1 min-w-0">
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  user={user}
                  onNavigate={handleNavigate}
                  onOpenPomodoro={() => setIsPomodoroOpen(true)}
                />
              }
            />
            <Route
              path="/dashboard"
              element={
                <Dashboard
                  user={user}
                  onNavigate={handleNavigate}
                  onOpenPomodoro={() => setIsPomodoroOpen(true)}
                />
              }
            />
            <Route
              path="/subjects"
              element={<SubjectsTopics />}
            />
            <Route
              path="/topics"
              element={<SubjectsTopics />}
            />
            <Route
              path="/availability"
              element={<StudyAvailability onNavigate={handleNavigate} />}
            />
            <Route
              path="/study-plan"
              element={<CreateStudyPlan onNavigate={handleNavigate} />}
            />
            <Route
              path="/planner"
              element={<CreateStudyPlan onNavigate={handleNavigate} />}
            />
            <Route
              path="/calendar"
              element={<CalendarTimetable onNavigate={handleNavigate} />}
            />
            <Route
              path="/timetable"
              element={<CalendarTimetable onNavigate={handleNavigate} />}
            />
            <Route
              path="/tasks"
              element={
                <DailyTasks
                  onOpenPomodoro={() => setIsPomodoroOpen(true)}
                  onNavigate={handleNavigate}
                />
              }
            />
            <Route
              path="/progress"
              element={<ProgressAnalytics onNavigate={handleNavigate} />}
            />
            <Route
              path="/analytics"
              element={<ProgressAnalytics onNavigate={handleNavigate} />}
            />
            <Route
              path="/exams"
              element={<ExamsAssignments />}
            />
            <Route
              path="/assignments"
              element={<ExamsAssignments />}
            />
            <Route
              path="/notes"
              element={<NotesRAG onNavigate={handleNavigate} />}
            />
            <Route
              path="/ai-assistant"
              element={<AIStudyAssistant user={user} onNavigate={handleNavigate} />}
            />
            <Route
              path="/assistant"
              element={<AIStudyAssistant user={user} onNavigate={handleNavigate} />}
            />
            <Route
              path="/profile"
              element={
                <ProfileSettings
                  user={user}
                  onUserUpdated={(updated) => setUser(updated)}
                  onSeedDemo={handleSeedDemo}
                />
              }
            />
            <Route
              path="/settings"
              element={
                <ProfileSettings
                  user={user}
                  onUserUpdated={(updated) => setUser(updated)}
                  onSeedDemo={handleSeedDemo}
                />
              }
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>

      </div>

      {/* Floating Focus Pomodoro Timer Modal */}
      <PomodoroTimer
        isOpen={isPomodoroOpen}
        onClose={() => setIsPomodoroOpen(false)}
      />

      {/* Bottom Footer */}
      <footer className="w-full border-t border-white/5 py-4 text-center text-xs text-slate-500">
        AI-Powered Intelligent Study Planner & Progress Tracker • Code-A-Thon 3.0
      </footer>

    </div>
  );
}
