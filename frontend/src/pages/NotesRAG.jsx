import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  Trash2,
  Search,
  Sparkles,
  BookOpen,
  CheckCircle2,
  FileCheck,
  AlertCircle,
  Eye,
  Bot,
  ArrowRight
} from 'lucide-react';
import { api } from '../api/client';
import confetti from 'canvas-confetti';

export default function NotesRAG({ onNavigate, onAskAssistant }) {
  const [notes, setNotes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Upload Form
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [selectedSubId, setSelectedSubId] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  // Selected note for modal preview
  const [previewNote, setPreviewNote] = useState(null);

  const fetchNotesAndSubjects = async () => {
    try {
      setLoading(true);
      const [notesRes, subRes] = await Promise.all([
        api.getNotes(),
        api.getSubjects(),
      ]);
      setNotes(notesRes);
      setSubjects(subRes);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotesAndSubjects();
  }, []);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setUploadSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (title) formData.append('title', title);
      if (selectedSubId) formData.append('subject_id', selectedSubId);

      const res = await api.uploadNote(formData);
      setUploadSuccess(`Uploaded "${res.filename}" successfully! Indexed ${res.extracted_chars} characters for RAG.`);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });

      setFile(null);
      setTitle('');
      setSelectedSubId('');
      fetchNotesAndSubjects();
    } catch (err) {
      alert(err.message || 'Failed to upload note');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this note and its vector index?')) return;
    try {
      await api.deleteNote(id);
      fetchNotesAndSubjects();
    } catch (err) {
      alert(err.message);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    const kb = bytes / 1024;
    return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(1)} KB`;
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Document Retrieval-Augmented Generation (RAG)</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Study Notes & RAG Knowledge Base
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Upload course notes and PDFs. The AI Study Assistant will answer questions citing your actual materials!
          </p>
        </div>

        <button
          onClick={() => onNavigate('assistant')}
          className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Bot className="w-4 h-4" />
          <span>Ask AI Assistant</span>
        </button>
      </div>

      {uploadSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {/* Grid: Upload Card on Left, List on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Upload Card */}
        <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Upload className="w-4 h-4 text-indigo-400" /> Upload Study Material
          </h3>
          <p className="text-xs text-slate-400">
            Accepts PDF syllabus, lecture notes, textbook chapters, or markdown summaries.
          </p>

          <form onSubmit={handleUpload} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Select File (PDF, TXT, MD)
              </label>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-dashed border-white/20 hover:border-indigo-500/50 text-center transition-all cursor-pointer relative">
                <input
                  type="file"
                  required
                  accept=".pdf,.txt,.md,.doc,.docx"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <FileText className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-white">
                  {file ? file.name : 'Click or Drag document here'}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  {file ? formatFileSize(file.size) : 'PDF, TXT or Markdown up to 25MB'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Document Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Unit 3 DBMS Normalization"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Link to Subject (Optional)
              </label>
              <select
                value={selectedSubId}
                onChange={(e) => setSelectedSubId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="">General Academic Notes</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={uploading || !file}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {uploading ? (
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Extracting & Indexing...</span>
                </div>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload & Index with RAG</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Notes List (Right 2 cols) */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-base text-white">Indexed Course Materials</h3>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
              {notes.length} Documents Indexed
            </span>
          </div>

          {notes.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <FileText className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">No notes uploaded yet. Upload a PDF to start.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((n) => (
                <div
                  key={n.id}
                  className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-indigo-500/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-400" />
                      <h4 className="font-bold text-xs text-white">{n.title}</h4>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-slate-300">
                        {formatFileSize(n.file_size_bytes)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 font-mono truncate max-w-md">
                      File: {n.filename} • {new Date(n.created_at).toLocaleDateString()}
                    </p>

                    {n.extracted_text_preview && (
                      <p className="text-[11px] text-slate-400 italic line-clamp-2 bg-slate-950/40 p-2 rounded-lg border border-white/5">
                        "{n.extracted_text_preview}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => onNavigate('assistant')}
                      className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>Ask AI</span>
                    </button>
                    <button
                      onClick={() => handleDelete(n.id)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
