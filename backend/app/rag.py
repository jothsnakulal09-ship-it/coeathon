import os
import re
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from .models import Note

def extract_text_from_file(file_path: str, filename: str) -> str:
    """Extract text from uploaded files (PDF, TXT, MD, etc.)."""
    ext = os.path.splitext(filename)[1].lower()
    text = ""

    if ext == ".pdf":
        try:
            import pypdf
            reader = pypdf.PdfReader(file_path)
            pages_text = []
            for page_num, page in enumerate(reader.pages):
                page_content = page.extract_text() or ""
                if page_content.strip():
                    pages_text.append(f"--- Page {page_num + 1} ---\n{page_content}")
            text = "\n\n".join(pages_text)
        except Exception as e:
            text = f"[Text extraction error: {e}]"
    else:
        # Plain text, markdown, csv, etc.
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()
        except Exception as e:
            text = f"[File reading error: {e}]"

    return text.strip()


def chunk_text(text: str, chunk_size: int = 600, overlap: int = 100) -> List[str]:
    """Splits document text into overlapping passages for semantic RAG retrieval."""
    if not text:
        return []
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
        i += chunk_size - overlap
    return chunks


def search_notes_rag(user_id: int, query: str, db: Session, top_k: int = 3) -> List[Dict[str, Any]]:
    """
    RAG Pipeline:
    Retrieves most relevant passages from uploaded notes matching student query.
    Ready for FAISS vector embeddings or clean lexical/BM25 similarity fallback.
    """
    notes = db.query(Note).filter(Note.user_id == user_id).all()
    if not notes:
        return []

    query_tokens = set(re.findall(r'\w+', query.lower()))
    if not query_tokens:
        return []

    scored_chunks = []

    for note in notes:
        if not note.extracted_text:
            continue

        chunks = chunk_text(note.extracted_text, chunk_size=300, overlap=50)
        for chunk in chunks:
            chunk_tokens = set(re.findall(r'\w+', chunk.lower()))
            overlap = query_tokens.intersection(chunk_tokens)
            if overlap:
                # Score based on token overlap count and exact phrase matching
                score = len(overlap) * 2.0
                if query.lower() in chunk.lower():
                    score += 10.0
                scored_chunks.append({
                    "note_id": note.id,
                    "title": note.title,
                    "filename": note.filename,
                    "score": score,
                    "chunk": chunk[:500] + "..." if len(chunk) > 500 else chunk
                })

    # Sort descending by score
    scored_chunks.sort(key=lambda x: x["score"], reverse=True)
    return scored_chunks[:top_k]
