import { PART_TEMPLATES, type PartTemplate, type PartType } from '@/stores/sandboxStore'
import { Trash2, Play, Pause, RotateCcw, Zap, GripVertical } from 'lucide-react'

interface PartsLibraryProps {
  onDragStart: (template: PartTemplate, e: React.DragEvent) => void
  onClearAll: () => void
  onToggleRun: () => void
  onReset: () => void
  onToggleGravity: () => void
  isRunning: boolean
  gravityEnabled: boolean
  partsCount: number
  gravity: number
  onGravityChange: (value: number) => void
  selectedPartInfo: {
    id: string
    type: PartType
    name: string
  } | null
  onDeleteSelected: () => void
  onPartParamChange: (partId: string, key: string, value: number) => void
  partParams: Record<string, number>
}

const partCategoryLabels: Record<string, string> = {
  ball: '动态物体',
  block: '动态物体',
  ground: '静态物体',
  wall: '静态物体',
  'inclined-plane': '静态物体',
  spring: '连接器',
  rope: '连接器',
  pulley: '连接器',
}

const partParamLabels: Record<string, { label: string; min: number; max: number; step: number; unit?: string }> = {
  radius: { label: '半径', min: 10, max: 80, step: 1, unit: 'px' },
  mass: { label: '质量', min: 0.1, max: 20, step: 0.1, unit: 'kg' },
  restitution: { label: '弹性', min: 0, max: 1, step: 0.05 },
  width: { label: '宽度', min: 20, max: 500, step: 5, unit: 'px' },
  height: { label: '高度', min: 20, max: 500, step: 5, unit: 'px' },
  stiffness: { label: '劲度系数', min: 5, max: 200, step: 1 },
  damping: { label: '阻尼', min: 0, max: 10, step: 0.1 },
  restLength: { label: '原长', min: 20, max: 300, step: 1, unit: 'px' },
  length: { label: '长度', min: 20, max: 400, step: 1, unit: 'px' },
  angle: { label: '角度', min: 5, max: 85, step: 1, unit: '°' },
  friction: { label: '摩擦系数', min: 0, max: 1, step: 0.05 },
}

export default function PartsLibrary({
  onDragStart,
  onClearAll,
  onToggleRun,
  onReset,
  onToggleGravity,
  isRunning,
  gravityEnabled,
  partsCount,
  gravity,
  onGravityChange,
  selectedPartInfo,
  onDeleteSelected,
  onPartParamChange,
  partParams,
}: PartsLibraryProps) {
  const categories = Array.from(new Set(PART_TEMPLATES.map((t) => partCategoryLabels[t.type])))

  const renderParam = (partId: string, key: string) => {
    const cfg = partParamLabels[key]
    if (!cfg) return null
    const value = partParams[key]
    if (value === undefined) return null

    return (
      <div key={key} className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">{cfg.label}</span>
          <span className="text-neon-cyan font-mono">
            {value.toFixed(cfg.step < 1 ? 2 : 0)}
            {cfg.unit && <span className="text-slate-500 ml-1">{cfg.unit}</span>}
          </span>
        </div>
        <input
          type="range"
          min={cfg.min}
          max={cfg.max}
          step={cfg.step}
          value={value}
          onChange={(e) => onPartParamChange(partId, key, parseFloat(e.target.value))}
          className="slider-neon w-full"
        />
      </div>
    )
  }

  return (
    <aside className="flex h-full w-72 flex-col border-r border-neon-cyan/20 bg-space-800/60 backdrop-blur-xl">
      <div className="border-b border-neon-cyan/20 p-4">
        <div className="flex items-center gap-2 mb-4">
          <GripVertical className="h-5 w-5 text-neon-cyan" />
          <h2 className="font-orbitron text-lg font-bold text-neon-cyan glow-text">实验零件库</h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          将零件拖拽到画布中自由组合，实时计算物理碰撞与约束
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {categories.map((cat) => (
          <div key={cat}>
            <h3 className="text-xs font-orbitron uppercase tracking-wider text-slate-500 mb-3">
              {cat}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {PART_TEMPLATES.filter((t) => partCategoryLabels[t.type] === cat).map((template) => (
                <div
                  key={template.type}
                  draggable
                  onDragStart={(e) => onDragStart(template, e)}
                  className="group relative flex cursor-grab flex-col items-center gap-2 rounded-lg border border-neon-cyan/15 bg-space-700/50 p-3 transition-all duration-300 hover:border-neon-cyan/50 hover:bg-neon-cyan/5 hover:shadow-[0_0_15px_rgba(0,240,255,0.15)] active:cursor-grabbing"
                  title={template.description}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-space-800 text-2xl text-neon-cyan transition-transform duration-300 group-hover:scale-110">
                    {template.icon}
                  </div>
                  <span className="text-xs font-medium text-slate-300 group-hover:text-neon-cyan transition-colors">
                    {template.name}
                  </span>
                  <div className="pointer-events-none absolute inset-x-0 -top-1 translate-y-[-100%] opacity-0 transition-opacity duration-200 group-hover:opacity-100 z-10">
                    <div className="rounded-md bg-space-700 border border-neon-cyan/30 px-3 py-2 text-[11px] text-slate-300 shadow-lg">
                      {template.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-neon-cyan/20 p-4 space-y-4">
        <div className="glass-panel rounded-lg p-3">
          <h4 className="text-xs font-orbitron text-neon-cyan mb-3 tracking-wider">全局控制</h4>
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">重力加速度</span>
                <span className="font-mono text-neon-cyan">{gravity.toFixed(0)} px/s²</span>
              </div>
              <input
                type="range"
                min={0}
                max={800}
                step={10}
                value={gravity}
                onChange={(e) => onGravityChange(parseFloat(e.target.value))}
                className="slider-neon w-full"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onToggleRun}
                className={`flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-all ${
                  isRunning
                    ? 'border-neon-orange/50 bg-neon-orange/10 text-neon-orange hover:bg-neon-orange/20'
                    : 'border-neon-green/50 bg-neon-green/10 text-neon-green hover:bg-neon-green/20'
                }`}
              >
                {isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                {isRunning ? '暂停' : '运行'}
              </button>
              <button
                onClick={onToggleGravity}
                className={`flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-all ${
                  gravityEnabled
                    ? 'border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan hover:bg-neon-cyan/20'
                    : 'border-slate-500/50 bg-slate-600/10 text-slate-400 hover:bg-slate-600/20'
                }`}
              >
                <Zap className="h-3.5 w-3.5" />
                {gravityEnabled ? '重力开' : '重力关'}
              </button>
              <button
                onClick={onReset}
                className="flex items-center justify-center gap-1.5 rounded-md border border-neon-purple/50 bg-neon-purple/10 px-3 py-2 text-xs font-medium text-neon-purple transition-all hover:bg-neon-purple/20"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                复位
              </button>
              <button
                onClick={onClearAll}
                disabled={partsCount === 0}
                className="flex items-center justify-center gap-1.5 rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 transition-all hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-3.5 w-3.5" />
                清空
              </button>
            </div>
          </div>
        </div>

        {selectedPartInfo && (
          <div className="glass-panel rounded-lg p-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-orbitron text-neon-orange tracking-wider">
                {selectedPartInfo.name} 属性
              </h4>
              <button
                onClick={onDeleteSelected}
                className="rounded p-1 text-slate-400 transition-colors hover:bg-red-500/20 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {Object.keys(partParams).map((key) =>
                renderParam(selectedPartInfo.id, key)
              )}
              {Object.keys(partParams).length === 0 && (
                <p className="text-xs text-slate-500 py-2 text-center">此零件无可调参数</p>
              )}
            </div>
          </div>
        )}

        <div className="text-center text-[11px] text-slate-500">
          当前零件: <span className="text-neon-cyan font-mono">{partsCount}</span> 个
        </div>
      </div>
    </aside>
  )
}
