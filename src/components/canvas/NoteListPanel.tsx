import { useState, useEffect, useRef, useCallback } from 'react'
import { FolderPlus, Trash, ChevronDown, ChevronUp, X, Plus, Check, Edit3 } from 'lucide-react'
import type { SavedNote, Annotation } from '@/data/types'
import { loadSavedNotes, saveNotesList, createNote, updateNoteInList } from './BrushOverlay'

interface NoteListPanelProps {
  experimentId: string
  open: boolean
  onToggle: () => void
  currentAnnotations: Annotation[]
  onLoadNote: (note: SavedNote) => void
  onNotesChange?: (notes: SavedNote[]) => void
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function NoteListPanel({
  experimentId,
  open,
  onToggle,
  currentAnnotations,
  onLoadNote,
  onNotesChange,
}: NoteListPanelProps) {
  const [notes, setNotes] = useState<SavedNote[]>([])
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [newNoteName, setNewNoteName] = useState('')
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setNotes(loadSavedNotes(experimentId))
    setActiveNoteId(null)
  }, [experimentId])

  useEffect(() => {
    onNotesChange?.(notes)
  }, [notes, onNotesChange])

  useEffect(() => {
    if (saveDialogOpen && nameInputRef.current) {
      nameInputRef.current.focus()
    }
  }, [saveDialogOpen])

  useEffect(() => {
    if (editingNoteId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingNoteId])

  const handleSaveNew = useCallback(() => {
    const name = newNoteName.trim()
    if (!name) return
    const newNote = createNote(experimentId, name, currentAnnotations)
    const updated = [newNote, ...notes]
    setNotes(updated)
    saveNotesList(experimentId, updated)
    setActiveNoteId(newNote.id)
    setNewNoteName('')
    setSaveDialogOpen(false)
  }, [experimentId, newNoteName, notes, currentAnnotations])

  const handleLoadNote = useCallback((note: SavedNote) => {
    setActiveNoteId(note.id)
    onLoadNote(note)
  }, [onLoadNote])

  const handleUpdateActive = useCallback(() => {
    if (!activeNoteId) return
    const updated = updateNoteInList(notes, activeNoteId, {
      annotations: JSON.parse(JSON.stringify(currentAnnotations)),
    })
    setNotes(updated)
    saveNotesList(experimentId, updated)
  }, [activeNoteId, notes, currentAnnotations, experimentId])

  const handleDelete = useCallback((noteId: string) => {
    const note = notes.find((n) => n.id === noteId)
    if (!note) return
    const confirmDel = window.confirm(`确定删除笔记「${note.name}」吗？`)
    if (!confirmDel) return
    const updated = notes.filter((n) => n.id !== noteId)
    setNotes(updated)
    saveNotesList(experimentId, updated)
    if (activeNoteId === noteId) {
      setActiveNoteId(null)
    }
  }, [notes, experimentId, activeNoteId])

  const handleRename = useCallback((noteId: string) => {
    const note = notes.find((n) => n.id === noteId)
    if (!note) return
    setEditingNoteId(noteId)
    setEditName(note.name)
  }, [notes])

  const handleSaveRename = useCallback(() => {
    if (!editingNoteId) return
    const name = editName.trim()
    if (!name) return
    const updated = updateNoteInList(notes, editingNoteId, { name })
    setNotes(updated)
    saveNotesList(experimentId, updated)
    setEditingNoteId(null)
    setEditName('')
  }, [editingNoteId, editName, notes, experimentId])

  const handleSaveDialogKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveNew()
    } else if (e.key === 'Escape') {
      setSaveDialogOpen(false)
      setNewNoteName('')
    }
  }, [handleSaveNew])

  const handleEditKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveRename()
    } else if (e.key === 'Escape') {
      setEditingNoteId(null)
      setEditName('')
    }
  }, [handleSaveRename])

  return (
    <div className="note-list-panel">
      <div className="note-list-header" onClick={onToggle}>
        <div className="flex items-center gap-2">
          <FolderPlus className="w-4 h-4 text-neon-purple" />
          <span className="text-xs font-orbitron tracking-wider">笔记列表</span>
          {notes.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-neon-purple/20 text-[10px] font-orbitron text-neon-purple">
              {notes.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="note-header-btn"
            onClick={(e) => {
              e.stopPropagation()
              if (currentAnnotations.length === 0) {
                window.alert('当前没有内容可保存')
                return
              }
              setSaveDialogOpen(true)
              setNewNoteName(`笔记 ${notes.length + 1}`)
            }}
            title="保存为新笔记"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          {activeNoteId && (
            <button
              className="note-header-btn update"
              onClick={(e) => {
                e.stopPropagation()
                handleUpdateActive()
              }}
              title="更新当前笔记"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          )}
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {open && (
        <div className="note-list-body animate-fade-in">
          {saveDialogOpen && (
            <div className="note-save-dialog">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-orbitron text-neon-cyan">保存为新笔记</span>
                <button
                  className="note-close-btn"
                  onClick={() => {
                    setSaveDialogOpen(false)
                    setNewNoteName('')
                  }}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  ref={nameInputRef}
                  type="text"
                  value={newNoteName}
                  onChange={(e) => setNewNoteName(e.target.value)}
                  onKeyDown={handleSaveDialogKeyDown}
                  className="note-name-input"
                  placeholder="输入笔记名称..."
                />
                <button
                  className="note-action-btn save"
                  onClick={handleSaveNew}
                  disabled={!newNoteName.trim()}
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          <div className="note-items-list">
            {notes.length === 0 ? (
              <div className="note-empty">
                <FolderPlus className="w-8 h-8 opacity-20 mb-2" />
                <p className="text-[11px] text-slate-500">暂无保存的笔记</p>
                <p className="text-[10px] text-slate-600 mt-1">绘制后点击 + 保存</p>
              </div>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className={`note-item ${activeNoteId === note.id ? 'active' : ''}`}
                >
                  <div
                    className="note-item-main"
                    onClick={() => handleLoadNote(note)}
                    title="加载此笔记"
                  >
                    <div className="note-item-info">
                      {editingNoteId === note.id ? (
                        <input
                          ref={editInputRef}
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={handleEditKeyDown}
                          onClick={(e) => e.stopPropagation()}
                          onBlur={handleSaveRename}
                          className="note-edit-input"
                        />
                      ) : (
                        <>
                          <div className="note-item-name">
                            {activeNoteId === note.id && (
                              <span className="note-active-dot" />
                            )}
                            {note.name}
                          </div>
                          <div className="note-item-meta">
                            <span>{note.annotations.length} 处标注</span>
                            <span>·</span>
                            <span>{formatTime(note.updatedAt)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="note-item-actions">
                    <button
                      className="note-icon-btn edit"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRename(note.id)
                      }}
                      title="重命名"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      className="note-icon-btn delete"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(note.id)
                      }}
                      title="删除"
                    >
                      <Trash className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
