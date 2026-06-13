import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Save, Trash2, Bookmark, Star, Zap, Brain } from 'lucide-react'
import type { Template, TemplateCategory, SavedTemplate } from '@/data/types'

interface TemplateSelectorProps {
  builtInTemplates: Template[]
  savedTemplates: SavedTemplate[]
  selectedTemplateId: string | null
  onSelectTemplate: (template: Template) => void
  onSaveTemplate: (name: string) => void
  onDeleteSavedTemplate: (templateId: string) => void
}

const categoryLabels: Record<TemplateCategory, { label: string; icon: typeof Star; color: string }> = {
  classic: { label: '经典案例', icon: Star, color: 'var(--color-neon-cyan)' },
  extreme: { label: '极端条件', icon: Zap, color: 'var(--color-neon-orange)' },
  counterintuitive: { label: '反直觉场景', icon: Brain, color: 'var(--color-neon-purple)' },
}

export default function TemplateSelector({
  builtInTemplates,
  savedTemplates,
  selectedTemplateId,
  onSelectTemplate,
  onSaveTemplate,
  onDeleteSavedTemplate,
}: TemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveName, setSaveName] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const groupedBuiltIn = builtInTemplates.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = []
    acc[t.category].push(t)
    return acc
  }, {} as Record<TemplateCategory, Template[]>)

  const selectedTemplate =
    builtInTemplates.find((t) => t.id === selectedTemplateId) ||
    savedTemplates.find((t) => t.id === selectedTemplateId)

  const handleSelect = (template: Template | SavedTemplate) => {
    onSelectTemplate(template)
    setIsOpen(false)
  }

  const handleSave = () => {
    if (saveName.trim()) {
      onSaveTemplate(saveName.trim())
      setSaveName('')
      setShowSaveDialog(false)
    }
  }

  return (
    <div className="w-full" ref={dropdownRef}>
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border transition-all"
            style={{
              borderColor: 'rgba(0, 240, 255, 0.3)',
              background: 'rgba(15, 21, 36, 0.6)',
              color: 'var(--color-neon-cyan)',
            }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Bookmark className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium truncate">
                {selectedTemplate ? selectedTemplate.name : '选择模板'}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {isOpen && (
            <div
              className="absolute top-full left-0 right-0 mt-1 rounded-lg border z-20 max-h-72 overflow-y-auto"
              style={{
                background: 'rgba(15, 21, 36, 0.98)',
                borderColor: 'rgba(0, 240, 255, 0.3)',
                backdropFilter: 'blur(12px)',
              }}
            >
              {(Object.keys(categoryLabels) as TemplateCategory[]).map((cat) => {
                const templates = groupedBuiltIn[cat] || []
                if (templates.length === 0) return null
                const catInfo = categoryLabels[cat]
                const CatIcon = catInfo.icon
                return (
                  <div key={cat} className="py-1">
                    <div
                      className="px-3 py-1.5 flex items-center gap-2 text-xs font-medium uppercase tracking-wider"
                      style={{ color: catInfo.color }}
                    >
                      <CatIcon className="w-3.5 h-3.5" />
                      {catInfo.label}
                    </div>
                    {templates.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleSelect(t)}
                        className="w-full text-left px-3 py-2 text-sm transition-colors"
                        style={{
                          color:
                            selectedTemplateId === t.id
                              ? 'var(--color-neon-cyan)'
                              : '#cbd5e1',
                          background:
                            selectedTemplateId === t.id
                              ? 'rgba(0, 240, 255, 0.1)'
                              : 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          if (selectedTemplateId !== t.id) {
                            e.currentTarget.style.background = 'rgba(0, 240, 255, 0.05)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedTemplateId !== t.id) {
                            e.currentTarget.style.background = 'transparent'
                          }
                        }}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                )
              })}

              {savedTemplates.length > 0 && (
                <div className="py-1 border-t" style={{ borderColor: 'rgba(0, 240, 255, 0.15)' }}>
                  <div
                    className="px-3 py-1.5 flex items-center gap-2 text-xs font-medium uppercase tracking-wider"
                    style={{ color: 'var(--color-neon-green)' }}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    我的收藏
                  </div>
                  {savedTemplates.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center group"
                      style={{
                        background:
                          selectedTemplateId === t.id
                            ? 'rgba(0, 240, 255, 0.1)'
                            : 'transparent',
                      }}
                    >
                      <button
                        onClick={() => handleSelect(t)}
                        className="flex-1 text-left px-3 py-2 text-sm transition-colors"
                        style={{
                          color:
                            selectedTemplateId === t.id
                              ? 'var(--color-neon-cyan)'
                              : '#cbd5e1',
                        }}
                      >
                        {t.name}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteSavedTemplate(t.id)
                        }}
                        className="px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: 'var(--color-neon-orange)' }}
                        title="删除模板"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => setShowSaveDialog(true)}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border transition-all"
          style={{
            borderColor: 'rgba(15, 155, 88, 0.5)',
            background: 'rgba(15, 155, 88, 0.1)',
            color: 'var(--color-neon-green)',
          }}
          title="保存当前参数为模板"
        >
          <Save className="w-4 h-4" />
        </button>
      </div>

      {showSaveDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0, 0, 0, 0.6)' }}>
          <div
            className="rounded-xl border p-5 w-72"
            style={{
              background: 'rgba(15, 21, 36, 0.98)',
              borderColor: 'rgba(0, 240, 255, 0.3)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <h3 className="font-orbitron text-sm font-bold mb-3" style={{ color: 'var(--color-neon-cyan)' }}>
              保存模板
            </h3>
            <p className="text-xs text-slate-400 mb-3">保存当前参数组合为自定义模板</p>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="输入模板名称"
              autoFocus
              className="w-full px-3 py-2 rounded-lg border text-sm text-white outline-none transition-all"
              style={{
                background: 'rgba(15, 21, 36, 0.8)',
                borderColor: 'rgba(0, 240, 255, 0.3)',
              }}
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setShowSaveDialog(false)
                  setSaveName('')
                }}
                className="flex-1 px-3 py-2 rounded-lg border text-sm transition-all"
                style={{
                  borderColor: 'rgba(148, 163, 184, 0.3)',
                  color: '#94a3b8',
                }}
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={!saveName.trim()}
                className="flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-all"
                style={{
                  borderColor: 'var(--color-neon-green)',
                  background: saveName.trim() ? 'rgba(15, 155, 88, 0.2)' : 'transparent',
                  color: 'var(--color-neon-green)',
                  opacity: saveName.trim() ? 1 : 0.5,
                  cursor: saveName.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
