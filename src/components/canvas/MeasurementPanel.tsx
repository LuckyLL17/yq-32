import { useState } from 'react'
import { Crosshair, Ruler, Triangle, Pin, Trash2, ChevronDown, ChevronUp, X } from 'lucide-react'
import { useExperimentStore } from '@/stores/experimentStore'
import type { MeasureTool, Measure } from '@/data/types'

interface MeasurementPanelProps {
  containerRef: React.RefObject<HTMLDivElement>
}

const MEASURE_COLORS = ['#00f0ff', '#ff6b2b', '#0f9b58', '#a855f7', '#ef4444']

export default function MeasurementPanel({ containerRef }: MeasurementPanelProps) {
  const [expanded, setExpanded] = useState(true)
  const {
    measureTool,
    setMeasureTool,
    measureColor,
    setMeasureColor,
    measures,
    removeMeasure,
    togglePinMeasure,
    clearMeasures,
  } = useExperimentStore()

  const tools: { value: MeasureTool; icon: typeof Crosshair; label: string; desc: string }[] = [
    { value: 'coordinate', icon: Crosshair, label: '坐标探针', desc: '点击显示坐标' },
    { value: 'distance', icon: Ruler, label: '距离尺', desc: '两点测量距离' },
    { value: 'angle', icon: Triangle, label: '角度尺', desc: '三点测量角度' },
  ]

  const pinnedMeasures = measures.filter((m) => m.pinned)
  const unpinnedMeasures = measures.filter((m) => !m.pinned)

  const formatMeasureValue = (measure: Measure) => {
    if (measure.type === 'coordinate') {
      return `(${measure.point.x.toFixed(1)}, ${measure.point.y.toFixed(1)})`
    } else if (measure.type === 'distance') {
      return `${measure.distance.toFixed(2)} px`
    } else if (measure.type === 'angle') {
      return `${measure.angle.toFixed(1)}°`
    }
    return ''
  }

  const getMeasureLabel = (measure: Measure) => {
    switch (measure.type) {
      case 'coordinate': return '坐标'
      case 'distance': return '距离'
      case 'angle': return '角度'
    }
  }

  const handleToolClick = (tool: MeasureTool) => {
    if (measureTool === tool) {
      setMeasureTool('none')
    } else {
      setMeasureTool(tool)
    }
  }

  if (!expanded) {
    return (
      <button
        className="measure-panel-collapsed"
        onClick={() => setExpanded(true)}
        title="展开测量工具"
      >
        <Crosshair className="w-4 h-4" />
        <span className="text-xs font-orbitron">测量</span>
        {measures.length > 0 && (
          <span className="measure-badge">{measures.length}</span>
        )}
      </button>
    )
  }

  return (
    <div className="measure-panel">
      <div className="measure-panel-header">
        <div className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-neon-cyan" />
          <span className="font-orbitron text-sm text-white">测量工具</span>
        </div>
        <button
          className="measure-panel-close"
          onClick={() => setExpanded(false)}
          title="收起"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>

      <div className="measure-panel-tools">
        {tools.map(({ value, icon: Icon, label, desc }) => (
          <button
            key={value}
            className={`measure-tool-btn ${measureTool === value ? 'active' : ''}`}
            onClick={() => handleToolClick(value)}
            title={desc}
          >
            <Icon className="w-4 h-4" />
            <span className="text-xs">{label}</span>
          </button>
        ))}
      </div>

      <div className="measure-panel-colors">
        <span className="text-xs text-slate-400">颜色</span>
        <div className="flex gap-1">
          {MEASURE_COLORS.map((color) => (
            <button
              key={color}
              className={`measure-color-btn ${measureColor === color ? 'active' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => setMeasureColor(color)}
            />
          ))}
        </div>
      </div>

      {measureTool !== 'none' && (
        <div className="measure-panel-hint">
          <span className="text-xs text-neon-cyan">
            {measureTool === 'coordinate' && '点击画布任意位置标记坐标'}
            {measureTool === 'distance' && '点击画布两点测量距离'}
            {measureTool === 'angle' && '依次点击画布三点测量角度'}
          </span>
        </div>
      )}

      {measures.length > 0 && (
        <div className="measure-panel-divider" />
      )}

      {pinnedMeasures.length > 0 && (
        <div className="measure-panel-list">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Pin className="w-3 h-3" /> 已钉住
            </span>
          </div>
          <div className="space-y-1">
            {pinnedMeasures.map((measure) => (
              <div
                key={measure.id}
                className="measure-item"
                style={{ borderLeftColor: measure.color }}
              >
                <span className="text-xs text-slate-300">{getMeasureLabel(measure)}</span>
                <span className="text-sm font-mono" style={{ color: measure.color }}>
                  {formatMeasureValue(measure)}
                </span>
                <div className="flex gap-1">
                  <button
                    className="measure-item-btn active"
                    onClick={() => togglePinMeasure(measure.id)}
                    title="取消钉住"
                  >
                    <Pin className="w-3 h-3" />
                  </button>
                  <button
                    className="measure-item-btn"
                    onClick={() => removeMeasure(measure.id)}
                    title="删除"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {unpinnedMeasures.length > 0 && (
        <div className="measure-panel-list">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400">最近测量</span>
            <button
              className="measure-clear-btn"
              onClick={clearMeasures}
              title="清除所有"
            >
              <Trash2 className="w-3 h-3" />
              <span className="text-xs">清除</span>
            </button>
          </div>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {unpinnedMeasures.slice(-5).reverse().map((measure) => (
              <div
                key={measure.id}
                className="measure-item"
                style={{ borderLeftColor: measure.color }}
              >
                <span className="text-xs text-slate-300">{getMeasureLabel(measure)}</span>
                <span className="text-sm font-mono" style={{ color: measure.color }}>
                  {formatMeasureValue(measure)}
                </span>
                <div className="flex gap-1">
                  <button
                    className="measure-item-btn"
                    onClick={() => togglePinMeasure(measure.id)}
                    title="钉住"
                  >
                    <Pin className="w-3 h-3" />
                  </button>
                  <button
                    className="measure-item-btn"
                    onClick={() => removeMeasure(measure.id)}
                    title="删除"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export { MEASURE_COLORS }
