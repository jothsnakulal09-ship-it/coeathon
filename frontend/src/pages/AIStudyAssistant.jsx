import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  HelpCircle,
  BookOpen,
  CheckCircle2,
  XCircle,
  Lightbulb,
  ArrowRight,
  RotateCcw,
  Zap,
  Award,
  Calendar,
  Clock
} from 'lucide-react';
import { api } from '../api/client';
import confetti from 'canvas-confetti';

export default function AIStudyAssistant({ user, onNavigate }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello ${user?.name || 'there'}! 🎓 I am your **Adaptive AI Study Coach**.\n\nI continuously monitor your study schedule, topic mastery, missed tasks, and upcoming exams.\n\nAsk me anything like:\n- *"Explain DBMS Normalization (1NF to BCNF) with examples"*\n- *"How do I improve my weakest subject?"*\n- *"Generate an adaptive revision timetable"*\n- Or test your knowledge with the **Diagnostic Quiz** below!`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  
  // Interactive Quiz State
  const [quizData, setQuizData] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Fetch initial revision suggestions
    const fetchSuggestions = async () => {
      try {
        const res = await api.getRevisionSuggestions();
        setSuggestions(res);
      } catch (e) {}
    };
    fetchSuggestions();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const newMsgs = [...messages, { role: 'user', content: text }];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);

    try {
      const res = await api.chat(newMsgs);
      setMessages([
        ...newMsgs,
        {
          role: 'assistant',
          content: res.reply,
          action_taken: res.action_taken,
          scheduled_task: res.scheduled_task
        }
      ]);
      if (res.action_taken === 'SCHEDULED' || res.action_taken === 'RESCHEDULED' || res.action_taken === 'COMPLETED_TASK') {
        confetti({ particleCount: 45, spread: 60, origin: { y: 0.6 } });
        window.dispatchEvent(new CustomEvent('study-plan-updated', { detail: res }));
      }
    } catch (err) {
      setMessages([
        ...newMsgs,
        { role: 'assistant', content: '⚠️ Sorry, I could not process that request. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadQuiz = async (subjectName = 'dbms') => {
    try {
      setLoading(true);
      const res = await api.getQuiz(subjectName);
      setQuizData(res);
      setQuizAnswers({});
      setQuizSubmitted(false);
      setQuizScore(0);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId, optionIndex) => {
    if (quizSubmitted) return;
    setQuizAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmitQuiz = () => {
    if (!quizData) return;
    let score = 0;
    quizData.questions.forEach((q) => {
      if (quizAnswers[q.id] === q.correct_index) {
        score += 1;
      }
    });
    setQuizScore(score);
    setQuizSubmitted(true);
    if (score >= Math.ceil(quizData.questions.length * 0.6)) {
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Knowledge & Revision Engine</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            AI Study Assistant & Intelligent Revision
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Rule-based intelligent guidance, concept breakdowns, diagnostic quizzes, and spaced repetition advice
          </p>
        </div>

        <button
          onClick={() => handleLoadQuiz('dbms')}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center gap-1.5"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Take 5-Min Diagnostic Quiz</span>
        </button>
      </div>

      {/* Spaced Repetition Revision Suggestions Row */}
      {suggestions.length > 0 && (
        <div className="glass-panel rounded-3xl p-5 border border-white/10 space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">
              Intelligent Revision Suggestions (Spaced Repetition)
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {suggestions.map((s, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-indigo-500/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-slate-300">
                    {s.badge}
                  </span>
                  <h4 className="text-xs font-bold text-white mt-1.5">{s.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-1">{s.reason}</p>
                </div>
                <button
                  onClick={() => handleSendMessage(`Help me study: ${s.title}`)}
                  className="mt-3 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 self-start"
                >
                  {s.action} <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Two Columns: Chat on Left, Diagnostic Quiz on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chat Assistant Panel */}
        <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col h-[580px]">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">AI Study Coach</h3>
                <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Online & Adaptive
                </p>
              </div>
            </div>

            {/* Quick Action Chips */}
            <div className="hidden sm:flex items-center gap-1 text-[10px]">
              <button
                onClick={() => handleSendMessage('Explain Normalization in DBMS with examples')}
                className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
              >
                Normalization
              </button>
              <button
                onClick={() => handleSendMessage('How should I prepare for my upcoming exam?')}
                className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
              >
                Exam Tips
              </button>
            </div>
          </div>

          {/* Messages scroll area */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-2">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-xl bg-purple-600/30 text-purple-300 flex items-center justify-center shrink-0 text-xs font-bold border border-purple-500/30 mt-0.5">
                    AI
                  </div>
                )}
                <div
                  className={`p-3.5 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-900/80 border border-white/10 text-slate-200 shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>

                  {m.action_taken === 'SCHEDULED' && (
                    <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onNavigate('calendar')}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        <span>View in Calendar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigate('tasks')}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-200 text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>View Daily Tasks</span>
                      </button>
                    </div>
                  )}

                  {m.action_taken === 'RESCHEDULED' && (
                    <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onNavigate('calendar')}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        <span>View Updated Calendar</span>
                      </button>
                    </div>
                  )}

                  {m.action_taken === 'SUBJECT_NOT_FOUND' && (
                    <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onNavigate('subjects')}
                        className="px-2.5 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                        <span>Go to Subjects & Add It</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-purple-300">
                <div className="w-3.5 h-3.5 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                <span>AI Coach is analyzing study metrics...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="pt-3 border-t border-white/10 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about formulas, concepts, or schedule advice..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Diagnostic Quiz Panel */}
        <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col h-[580px]">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Diagnostic Recall Quiz</h3>
                <p className="text-[10px] text-slate-400">
                  {quizData ? `${quizData.subject_name}` : 'Instant Knowledge Test'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleLoadQuiz('dbms')}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300"
              >
                DBMS
              </button>
              <button
                onClick={() => handleLoadQuiz('os')}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300"
              >
                OS
              </button>
            </div>
          </div>

          {!quizData ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
              <Award className="w-12 h-12 text-indigo-400" />
              <h4 className="font-bold text-sm text-white">Test Your Academic Recall</h4>
              <p className="text-xs text-slate-400 max-w-xs">
                Take a quick 5-question test in DBMS or Operating Systems to diagnose weak concepts before exams.
              </p>
              <button
                onClick={() => handleLoadQuiz('dbms')}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2"
              >
                <span>Start DBMS Quiz</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
              {quizSubmitted && (
                <div
                  className={`p-4 rounded-2xl border text-center ${
                    quizScore >= 3
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  }`}
                >
                  <p className="text-xs font-bold uppercase tracking-wider">Quiz Completed</p>
                  <h4 className="text-xl font-black text-white mt-0.5">
                    Score: {quizScore} / {quizData.questions.length}
                  </h4>
                  <p className="text-[11px] mt-1 text-slate-300">
                    {quizScore >= 4
                      ? 'Outstanding! You have strong grasp of core principles.'
                      : 'Topic needs reinforcement. Add to your study timetable for revision.'}
                  </p>
                </div>
              )}

              {quizData.questions.map((q, qIndex) => {
                const selectedOption = quizAnswers[q.id];

                return (
                  <div key={q.id} className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-indigo-400">Question {qIndex + 1}</span>
                      <span className="text-slate-500">{q.topic}</span>
                    </div>
                    <p className="text-xs font-semibold text-white">{q.question}</p>

                    <div className="space-y-1.5">
                      {q.options.map((opt, optIndex) => {
                        const isSelected = selectedOption === optIndex;
                        const isCorrect = q.correct_index === optIndex;
                        let optStyle = 'bg-slate-950/40 border-white/10 text-slate-300 hover:border-white/20';

                        if (quizSubmitted) {
                          if (isCorrect) optStyle = 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-bold';
                          else if (isSelected && !isCorrect) optStyle = 'bg-rose-950/60 border-rose-500 text-rose-200';
                        } else if (isSelected) {
                          optStyle = 'bg-indigo-600/30 border-indigo-500 text-white font-semibold';
                        }

                        return (
                          <button
                            key={optIndex}
                            type="button"
                            onClick={() => handleAnswerSelect(q.id, optIndex)}
                            className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between ${optStyle}`}
                          >
                            <span>{opt}</span>
                            {quizSubmitted && isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                            {quizSubmitted && isSelected && !isCorrect && <XCircle className="w-3.5 h-3.5 text-rose-400" />}
                          </button>
                        );
                      })}
                    </div>

                    {quizSubmitted && (
                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-white/5 text-[11px] text-slate-300">
                        <strong className="text-indigo-300">Explanation:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}

              {!quizSubmitted ? (
                <button
                  onClick={handleSubmitQuiz}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all"
                >
                  Submit & Check Answers
                </button>
              ) : (
                <button
                  onClick={() => handleLoadQuiz(quizData.subject_name.toLowerCase().includes('os') ? 'os' : 'dbms')}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry Quiz</span>
                </button>
              )}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
