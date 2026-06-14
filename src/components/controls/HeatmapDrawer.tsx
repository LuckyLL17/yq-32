import { useState, useCallback, useMemo } from 'react'
import { X, MousePointerClick } from 'lucide-react'
import type { ScanResult } from './ScanExplore'

interface HeatmapDrawerProps {
  result: ScanResult | null
  open: boolean
  onClose: () => void
  onApplyParams: (params: Record<string, number>) => void
}

function valueToColor(value: number, min: number, max: number): string {
  if (max === min) return 'hsl(180, 80%, 50%)'
  const t = (value - min) / (max - min)
  const clamped = Math.max(0, Math.min(1, t))
  const hue = 240 - clamped * 270
  const saturation = 75 + clamped * 15
  const lightness = 25 + clamped * 35
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

export default function HeatmapDrawer({ result, open, onClose, onApplyParams }: HeatmapDrawerProps) {
  const [hoveredCell, setHoveredCell] = useState<{ xi: number; yi: number } | null>(null)

  const { minVal, maxVal } = useMemo(() => {
    if (!result) return { minVal: 0, maxVal: 1 }
    let min = Infinity
    let max = -Infinity
    for (const row of result.grid) {
      for (const v of row) {
        if (isFinite(v)) {
          if (v < min) min = v
          if (v > max) max = v
        }
      }
    }
    return { minVal: min, maxVal: max }
  }, [result])

  const drawHeatmap = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!result) return
    const { grid } = result
    const rows = grid.length
    const cols = grid[0]?.length ?? 0
    if (rows === 0 || cols === 0) return

    const cellW = width / cols
    const cellH = height / rows

    for (let yi = 0; yi < rows; yi++) {
      for (let xi = 0; xi < cols; xi++) {
        const value = grid[yi][xi]
        if (!isFinite(value)) {
          ctx.fillStyle = '#1a1a2e'
        } else {
          ctx.fillStyle = valueToColor(value, minVal, maxVal)
        }
        ctx.fillRect(xi * cellW, yi * cellH, cellW + 0.5, cellH + 0.5)
      }
    }

    if (hoveredCell) {
      const { xi, yi } = hoveredCell
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.strokeRect(xi * cellW, yi * cellH, cellW, cellH)
    }
  }, [result, minVal, maxVal, hoveredCell])

  const handleCanvasRender = useCallback((canvas: HTMLCanvasElement) => {
    if (!canvas || !result) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    drawHeatmap(ctx, rect.width, rect.height)
  }, [drawHeatmap, result])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!result) return
    const canvas = e.currentTarget
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const cols = result.grid[0]?.length ?? 0
    const rows = result.grid.length
    const cellW = rect.width / cols
    const cellH = rect.height / rows
    const xi = Math.floor(x / cellW)
    const yi = Math.floor(y / cellH)
    if (xi >= 0 && xi < cols && yi >= 0 && yi < rows) {
      setHoveredCell({ xi, yi })
    } else {
      setHoveredCell(null)
    }
  }, [result])

  const handleMouseLeave = useCallback(() => {
    setHoveredCell(null)
  }, [])

  const handleClick = useCallback(() => {
    if (!result || !hoveredCell) return
    const { xi, yi } = hoveredCell
    const newParams: Record<string, number> = {
      ...result.fixedParams,
      [result.xParamKey]: result.xValues[xi],
      [result.yParamKey]: result.yValues[yi],
    }
    onApplyParams(newParams)
  }, [result, hoveredCell, onApplyParams])

  const hoveredValue = useMemo(() => {
    if (!result || !hoveredCell) return null
    const { xi, yi } = hoveredCell
    return {
      xParam: result.xValues[xi],
      yParam: result.yValues[yi],
      value: result.grid[yi][xi],
    }
  }, [result, hoveredCell])

  if (!open || !result) return null

  return (
    <div className="heatmap-drawer">
      <div className="heatmap-drawer-inner">
        <div className="heatmap-drawer-header">
          <h3 className="font-orbitron text-sm tracking-wider" style={{ color: 'var(--color-neon-cyan)' }}>
            扫描结果
          </h3>
          <button className="heatmap-close-btn" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="heatmap-info-row">
          <span className="text-xs text-slate-400">
            {result.metricLabel} = f({result.xParamLabel}, {result.yParamLabel})
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <MousePointerClick className="w-3 h-3" />
            点击应用参数
          </span>
        </div>

        <div className="heatmap-canvas-wrapper">
          <canvas
            ref={el => {
              if (el) handleCanvasRender(el)
            }}
            className="heatmap-canvas"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
          />

          {hoveredValue && (
            <div className="heatmap-tooltip">
              <div className="text-xs text-slate-400">
                {result.xParamLabel}: <span className="text-white font-mono">{hoveredValue.xParam.toFixed(2)}</span>
              </div>
              <div className="text-xs text-slate-400">
                {result.yParamLabel}: <span className="text-white font-mono">{hoveredValue.yParam.toFixed(2)}</span>
              </div>
              <div className="text-xs" style={{ color: 'var(--color-neon-cyan)' }}>
                {result.metricLabel}: <span className="font-mono font-bold">{hoveredValue.value.toFixed(4)}</span>
                {result.metricUnit && <span className="ml-1">{result.metricUnit}</span>}
              </div>
            </div>
          )}
        </div>

        <div className="heatmap-axis-labels">
          <div className="heatmap-x-label">
            <span className="text-xs text-slate-400">{result.xParamLabel}</span>
            <div className="heatmap-axis-range">
              <span className="text-xs font-mono text-slate-500">{result.xValues[0]?.toFixed(1)}</span>
              <span className="text-xs font-mono text-slate-500">{result.xValues[result.xValues.length - 1]?.toFixed(1)}</span>
            </div>
          </div>
          <div className="heatmap-y-label">
            <span className="text-xs text-slate-400">{result.yParamLabel}</span>
            <div className="heatmap-axis-range-y">
              <span className="text-xs font-mono text-slate-500">{result.yValues[result.yValues.length - 1]?.toFixed(1)}</span>
              <span className="text-xs font-mono text-slate-500">{result.yValues[0]?.toFixed(1)}</span>
            </div>
          </div>
        </div>

        <div className="heatmap-colorbar">
          <div
            className="heatmap-colorbar-gradient"
            style={{
              background: `linear-gradient(to right, ${valueToColor(minVal, minVal, maxVal)}, ${valueToColor(maxVal, minVal, maxVal)})`
            }}
          />
          <div className="heatmap-colorbar-labels">
            <span className="text-xs font-mono text-slate-500">{minVal.toFixed(2)}</span>
            <span className="text-xs font-mono text-slate-500">{maxVal.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
