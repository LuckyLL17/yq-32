import type { Annotation, SavedNote } from '@/data/types'

export const BRUSH_STORAGE_PREFIX = 'brush_annotations_'
export const NOTES_STORAGE_PREFIX = 'brush_notes_'

export function loadBrushAnnotations(experimentId: string): Annotation[] {
  try {
    const stored = localStorage.getItem(BRUSH_STORAGE_PREFIX + experimentId)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function saveBrushAnnotations(experimentId: string, annotations: Annotation[]) {
  try {
    localStorage.setItem(BRUSH_STORAGE_PREFIX + experimentId, JSON.stringify(annotations))
  } catch {
    // ignore
  }
}

export function loadSavedNotes(experimentId: string): SavedNote[] {
  try {
    const stored = localStorage.getItem(NOTES_STORAGE_PREFIX + experimentId)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function saveNotesList(experimentId: string, notes: SavedNote[]) {
  try {
    localStorage.setItem(NOTES_STORAGE_PREFIX + experimentId, JSON.stringify(notes))
  } catch {
    // ignore
  }
}

export function createNote(experimentId: string, name: string, annotations: Annotation[]): SavedNote {
  const now = Date.now()
  return {
    id: `note-${now}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    experimentId,
    annotations: JSON.parse(JSON.stringify(annotations)),
    createdAt: now,
    updatedAt: now,
  }
}

export function updateNoteInList(notes: SavedNote[], noteId: string, updates: Partial<SavedNote>): SavedNote[] {
  return notes.map((n) => (n.id === noteId ? { ...n, ...updates, updatedAt: Date.now() } : n))
}

export function annotationsEqual(a: Annotation[], b: Annotation[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

export function formatNoteTime(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
