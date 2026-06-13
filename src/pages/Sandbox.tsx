import { useCallback, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Atom, Info } from 'lucide-react'
import PartsLibrary from '@/components/sandbox/PartsLibrary'
import SandboxCanvas from '@/components/sandbox/SandboxCanvas'
import {
  useSandboxStore,
  type PartTemplate,
  type Part,
  type PartType,
  PART_TEMPLATES,
} from '@/stores/sandboxStore'

const partNameMap: Record<PartType, string> = {
  ball: '小球',
  block: '方块',
  ground: '地面',
  wall: '墙壁',
  spring: '弹簧',
  pulley: '滑轮',
  rope: '绳索',
  'inclined-plane': '斜面',
}

const editableParamsByType: Record<PartType, string[]> = {
  ball: ['radius', 'mass', 'restitution'],
  block: ['width', 'height', 'mass', 'restitution'],
  ground: ['width', 'height'],
  wall: ['width', 'height'],
  spring: ['stiffness', 'damping', 'restLength'],
  pulley: ['radius'],
  rope: ['length'],
  'inclined-plane': ['width', 'height', 'angle', 'friction'],
}

const initialPositions = [
  { type: 'ground' as PartType, x: 0.5, y: 0.85 },
  { type: 'ball' as PartType, x: 0.3, y: 0.4 },
  { type: 'ball' as PartType, x: 0.55, y: 0.35 },
]

export default function Sandbox() {
  const navigate = useNavigate()

  const {
    parts,
    selectedPartId,
    gravity,
    gravityEnabled,
    isRunning,
    connectingFrom,
    addPart,
    removePart,
    updatePart,
    clearAll,
    setSelectedPartId,
    setGravity,
    setGravityEnabled,
    setIsRunning,
    setTime,
    resetTime,
    startConnecting,
    endConnecting,
  } = useSandboxStore()

  useEffect(() => {
    if (parts.length === 0) {
      const canvas = document.querySelector('canvas')
      const W = canvas?.width ?? 800
      const H = canvas?.height ?? 600
      initialPositions.forEach(({ type, x, y }) => {
        const template = PART_TEMPLATES.find((t) => t.type === type)
        if (template) {
          const part = template.create(x * W, y * H)
          addPart(part)
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDragStart = useCallback((template: PartTemplate, e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('application/x-part-template', JSON.stringify(template.type))
    if (!(window as any).__partTemplateCache) {
      ;(window as any).__partTemplateCache = {}
    }
    ;(window as any).__partTemplateCache[template.type] = template
  }, [])

  const handleDropPart = useCallback(
    (template: PartTemplate, x: number, y: number) => {
      const part = template.create(x, y)
      addPart(part)
      setSelectedPartId(part.id)
      if (part.type === 'spring' || part.type === 'rope') {
        startConnecting(part.id, part.type)
      }
    },
    [addPart, setSelectedPartId, startConnecting]
  )

  const handlePartClick = useCallback(
    (id: string | null) => {
      setSelectedPartId(id)
      if (connectingFrom && !id) {
        endConnecting()
      }
    },
    [connectingFrom, endConnecting, setSelectedPartId]
  )

  const handlePartDrag = useCallback(
    (id: string, x: number, y: number) => {
      updatePart(id, { x, y } as Partial<Part>)
    },
    [updatePart]
  )

  const handleUpdatePart = useCallback(
    (id: string, updates: Partial<Part>) => {
      updatePart(id, updates)
    },
    [updatePart]
  )

  const handleTick = useCallback(() => {
    setTime(useSandboxStore.getState().time + 0.016)
  }, [setTime])

  const handleReset = useCallback(() => {
    resetTime()
    parts.forEach((p) => {
      if (!p.locked && (p.type === 'ball' || p.type === 'block')) {
        updatePart(p.id, { vx: 0, vy: 0, angularVel: 0 } as Partial<Part>)
      }
    })
  }, [resetTime, parts, updatePart])

  const selectedPartInfo = useMemo(() => {
    if (!selectedPartId) return null
    const part = parts.find((p) => p.id === selectedPartId)
    if (!part) return null
    return {
      id: part.id,
      type: part.type,
      name: partNameMap[part.type],
    }
  }, [selectedPartId, parts])

  const partParams = useMemo(() => {
    if (!selectedPartId) return {}
    const part = parts.find((p) => p.id === selectedPartId)
    if (!part) return {}
    const keys = editableParamsByType[part.type] || []
    const params: Record<string, number> = {}
    keys.forEach((k) => {
      const val = (part as any)[k]
      if (typeof val === 'number') {
        params[k] = val
      }
    })
    return params
  }, [selectedPartId, parts])

  const handlePartParamChange = useCallback(
    (partId: string, key: string, value: number) => {
      updatePart(partId, { [key]: value } as Partial<Part>)
    },
    [updatePart]
  )

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-space-900">
      <nav className="glass-panel z-50 flex h-16 w-full shrink-0 items-center justify-between border-b border-neon-cyan/20 px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="group flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 transition-all hover:bg-neon-cyan/10 hover:text-neon-cyan hover:shadow-[0_0_15px_rgba(0,240,255,0.3)]"
            title="返回"
          >
            <ArrowLeft className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-0.5" />
          </button>
          <Link to="/" className="flex items-center gap-3">
            <Atom className="h-7 w-7 text-neon-cyan" />
            <span className="font-orbitron text-lg font-bold text-neon-cyan glow-text">
              SciLab
            </span>
          </Link>
          <div className="mx-2 h-6 w-px bg-neon-cyan/20" />
          <div>
            <h1 className="font-orbitron text-base font-bold text-white">物理沙盒模式</h1>
            <p className="text-[11px] text-slate-500">自由组合 · 实时模拟 · 无限可能</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-6 md:flex">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="text-slate-500">时间</span>
              <span className="font-mono text-neon-cyan">
                {useSandboxStore.getState().time.toFixed(2)}s
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="text-slate-500">状态</span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 ${
                  isRunning
                    ? 'bg-neon-green/15 text-neon-green'
                    : 'bg-neon-orange/15 text-neon-orange'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isRunning ? 'bg-neon-green animate-pulse' : 'bg-neon-orange'
                  }`}
                />
                {isRunning ? '运行中' : '已暂停'}
              </span>
            </div>
          </div>

          <div className="group relative">
            <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-neon-purple/30 text-neon-purple transition-all hover:bg-neon-purple/10">
              <Info className="h-4 w-4" />
            </button>
            <div className="pointer-events-none absolute right-0 top-full z-50 mt-2 w-72 translate-y-1 rounded-lg border border-neon-purple/30 bg-space-800/95 p-4 opacity-0 shadow-2xl backdrop-blur-xl transition-all group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
              <h4 className="mb-2 font-orbitron text-sm text-neon-purple">操作指南</h4>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex gap-2">
                  <span className="text-neon-cyan">◆</span>
                  <span>从左侧拖拽零件到画布中</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-neon-cyan">◆</span>
                  <span>在画布中拖拽移动零件</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-neon-cyan">◆</span>
                  <span>点击零件查看/修改属性</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-neon-cyan">◆</span>
                  <span>弹簧/绳索拖入后点击两个物体连接</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-neon-cyan">◆</span>
                  <span>调节重力开关观察微重力效果</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex min-h-0 flex-1">
        <PartsLibrary
          onDragStart={handleDragStart}
          onClearAll={clearAll}
          onToggleRun={() => setIsRunning(!isRunning)}
          onReset={handleReset}
          onToggleGravity={() => setGravityEnabled(!gravityEnabled)}
          isRunning={isRunning}
          gravityEnabled={gravityEnabled}
          partsCount={parts.length}
          gravity={gravity}
          onGravityChange={setGravity}
          selectedPartInfo={selectedPartInfo}
          onDeleteSelected={() => selectedPartId && removePart(selectedPartId)}
          onPartParamChange={handlePartParamChange}
          partParams={partParams}
        />
        <div className="relative min-w-0 flex-1">
          <SandboxCanvas
            parts={parts}
            gravity={gravity}
            gravityEnabled={gravityEnabled}
            isRunning={isRunning}
            selectedPartId={selectedPartId}
            connectingFrom={connectingFrom}
            onPartClick={handlePartClick}
            onPartDrag={handlePartDrag}
            onDropPart={handleDropPart}
            onUpdatePart={handleUpdatePart}
            onEndConnecting={endConnecting}
            onTick={handleTick}
          />
        </div>
      </div>
    </div>
  )
}
