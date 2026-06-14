import { useEffect, useRef, useState, useCallback } from 'react'
import { Pen, Eraser, ArrowRight, Circle, Type, Trash2 } from 'lucide-react'
import type { Annotation, BrushTool, PenColor, StrokeAnnotation, ArrowAnnotation, CircleAnnotation, TextAnnotation } from '@/data/types'

interface BrushOverlayProps {
  experimentId: string
  active: boolean
}

const PEN_COLORS: { value: PenColor; label: string }[] = [
  { value: '#ef4444', label: '红' },
  { value: '#eab308', label: '黄' },
  { value: '#3b82f6', label: '蓝' },
]

const STORAGE_PREFIX = 'brush_annotations_'

function loadAnnotations(experimentId: string): Annotation[] {
  try {
    const stored = localStorage.getItem(STORAGE_PREFIX + experimentId)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveAnnotations(experimentId: string, annotations: Annotation[]) {
  try {
    localStorage.setItem(STORAGE_PREFIX + experimentId, JSON.stringify(annotations))
  } catch {
    // ignore
  }
}

function renderAnnotation(ctx: CanvasRenderingContext2D, ann: Annotation) {
  if (ann.type === 'stroke') {
    const s = ann as StrokeAnnotation
    if (s.points.length < 2) return
    ctx.save()
    if (s.isEraser) {
      ctx.globalCompositeOperation = 'destination-out'
    }
    ctx.strokeStyle = s.color
    ctx.lineWidth = s.lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(s.points[0].x, s.points[0].y)
    for (let i = 1; i < s.points.length; i++) {
      ctx.lineTo(s.points[i].x, s.points[i].y)
    }
    ctx.stroke()
    ctx.restore()
  } else if (ann.type === 'arrow') {
    const a = ann as ArrowAnnotation
    const headLen = 14
    const angle = Math.atan2(a.to.y - a.from.y, a.to.x - a.from.x)
    ctx.save()
    ctx.strokeStyle = a.color
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(a.from.x, a.from.y)
    ctx.lineTo(a.to.x, a.to.y)
    ctx.stroke()
    ctx.fillStyle = a.color
    ctx.beginPath()
    ctx.moveTo(a.to.x, a.to.y)
    ctx.lineTo(a.to.x - headLen * Math.cos(angle - Math.PI / 6), a.to.y - headLen * Math.sin(angle - Math.PI / 6))
    ctx.lineTo(a.to.x - headLen * Math.cos(angle + Math.PI / 6), a.to.y - headLen * Math.sin(angle + Math.PI / 6))
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  } else if (ann.type === 'circle') {
    const c = ann as CircleAnnotation
    ctx.save()
    ctx.strokeStyle = c.color
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.arc(c.center.x, c.center.y, c.radius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  } else if (ann.type === 'text') {
    const t = ann as TextAnnotation
    ctx.save()
    ctx.font = 'bold 14px "IBM Plex Sans", sans-serif'
    ctx.fillStyle = t.color
    ctx.textBaseline = 'top'
    const lines = t.content.split('\n')
    lines.forEach((line, i) => {
      ctx.fillText(line, t.position.x, t.position.y + i * 20)
    })
    ctx.restore()
  }
}

function redrawAll(ctx: CanvasRenderingContext2D, annotations: Annotation[], width: number, height: number) {
  ctx.clearRect(0, 0, width, height)
  annotations.forEach((ann) => renderAnnotation(ctx, ann))
}

export default function BrushOverlay({ experimentId, active }: BrushOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [tool, setTool] = useState<BrushTool>('pen')
  const [color, setColor] = useState<PenColor>('#ef4444')
  const [annotations, setAnnotations] = useState<Annotation[]>(() => loadAnnotations(experimentId))
  const drawingRef = useRef(false)
  const startPosRef = useRef({ x: 0, y: 0 })
  const currentStrokeRef = useRef<{ x: number; y: number }[]>([])
  const [textInput, setTextInput] = useState<{ x: number; y: number; visible: boolean; value: string }>({
    x: 0, y: 0, visible: false, value: '',
  })
  const textInputRef = useRef<HTMLInputElement>(null)
  const annotationsRef = useRef(annotations)

  useEffect(() => {
    annotationsRef.current = annotations
  }, [annotations])

  useEffect(() => {
    if (experimentId) {
      const loaded = loadAnnotations(experimentId)
      setAnnotations(loaded)
    }
  }, [experimentId])

  useEffect(() => {
    if (active) {
      saveAnnotations(experimentId, annotations)
    }
  }, [annotations, experimentId, active])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        redrawAll(ctx, annotationsRef.current, rect.width, rect.height)
      }
    }

    resizeCanvas()
    const observer = new ResizeObserver(resizeCanvas)
    observer.observe(container)
    return () => observer.disconnect()
  }, [active])

  useEffect(() => {
    if (textInput.visible && textInputRef.current) {
      textInputRef.current.focus()
    }
  }, [textInput.visible])

  const getCoords = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }, [])

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return null
    return canvas.getContext('2d')
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!active) return
    const pos = getCoords(e)

    if (tool === 'text') {
      setTextInput({ x: pos.x, y: pos.y, visible: true, value: '' })
      return
    }

    drawingRef.current = true
    startPosRef.current = pos
    currentStrokeRef.current = [pos]

    if (tool === 'pen' || tool === 'eraser') {
      const ctx = getCtx()
      if (!ctx) return
      ctx.save()
      if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out'
      }
      ctx.strokeStyle = color
      ctx.lineWidth = tool === 'eraser' ? 20 : 3
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(pos.x, pos.y)
      ctx.restore()
    }
  }, [active, tool, color, getCoords, getCtx])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!drawingRef.current || !active) return
    const pos = getCoords(e)
    const ctx = getCtx()
    if (!ctx) return

    if (tool === 'pen' || tool === 'eraser') {
      currentStrokeRef.current.push(pos)
      ctx.save()
      if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out'
      }
      ctx.strokeStyle = color
      ctx.lineWidth = tool === 'eraser' ? 20 : 3
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      const prev = currentStrokeRef.current[currentStrokeRef.current.length - 2]
      ctx.moveTo(prev.x, prev.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
      ctx.restore()
    } else if (tool === 'arrow' || tool === 'circle') {
      const canvas = canvasRef.current
      const container = containerRef.current
      if (!canvas || !container) return
      const rect = container.getBoundingClientRect()
      redrawAll(ctx, annotationsRef.current, rect.width, rect.height)

      if (tool === 'arrow') {
        const headLen = 14
        const angle = Math.atan2(pos.y - startPosRef.current.y, pos.x - startPosRef.current.x)
        ctx.save()
        ctx.strokeStyle = color
        ctx.lineWidth = 2.5
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(startPosRef.current.x, startPosRef.current.y)
        ctx.lineTo(pos.x, pos.y)
        ctx.stroke()
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.moveTo(pos.x, pos.y)
        ctx.lineTo(pos.x - headLen * Math.cos(angle - Math.PI / 6), pos.y - headLen * Math.sin(angle - Math.PI / 6))
        ctx.lineTo(pos.x - headLen * Math.cos(angle + Math.PI / 6), pos.y - headLen * Math.sin(angle + Math.PI / 6))
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      } else if (tool === 'circle') {
        const dx = pos.x - startPosRef.current.x
        const dy = pos.y - startPosRef.current.y
        const radius = Math.sqrt(dx * dx + dy * dy)
        ctx.save()
        ctx.strokeStyle = color
        ctx.lineWidth = 2.5
        ctx.beginPath()
        ctx.arc(startPosRef.current.x, startPosRef.current.y, radius, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()
      }
    }
  }, [active, tool, color, getCoords, getCtx])

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!drawingRef.current || !active) return
    drawingRef.current = false
    const pos = getCoords(e)

    if (tool === 'pen' || tool === 'eraser') {
      if (currentStrokeRef.current.length >= 2) {
        const stroke: StrokeAnnotation = {
          type: 'stroke',
          color,
          lineWidth: tool === 'eraser' ? 20 : 3,
          points: [...currentStrokeRef.current],
          isEraser: tool === 'eraser',
        }
        setAnnotations((prev) => [...prev, stroke])
      }
      currentStrokeRef.current = []
    } else if (tool === 'arrow') {
      const arrow: ArrowAnnotation = {
        type: 'arrow',
        color,
        from: { ...startPosRef.current },
        to: { x: pos.x, y: pos.y },
      }
      setAnnotations((prev) => [...prev, arrow])
      const ctx = getCtx()
      const container = containerRef.current
      const canvas = canvasRef.current
      if (ctx && container && canvas) {
        const rect = container.getBoundingClientRect()
        redrawAll(ctx, [...annotationsRef.current, arrow], rect.width, rect.height)
      }
    } else if (tool === 'circle') {
      const dx = pos.x - startPosRef.current.x
      const dy = pos.y - startPosRef.current.y
      const radius = Math.sqrt(dx * dx + dy * dy)
      const circle: CircleAnnotation = {
        type: 'circle',
        color,
        center: { ...startPosRef.current },
        radius,
      }
      setAnnotations((prev) => [...prev, circle])
      const ctx = getCtx()
      const container = containerRef.current
      const canvas = canvasRef.current
      if (ctx && container && canvas) {
        const rect = container.getBoundingClientRect()
        redrawAll(ctx, [...annotationsRef.current, circle], rect.width, rect.height)
      }
    }
  }, [active, tool, color, getCoords, getCtx])

  const handleClear = useCallback(() => {
    setAnnotations([])
    const ctx = getCtx()
    const container = containerRef.current
    if (ctx && container) {
      const rect = container.getBoundingClientRect()
      ctx.clearRect(0, 0, rect.width, rect.height)
    }
  }, [getCtx])

  const handleTextSubmit = useCallback(() => {
    if (textInput.value.trim()) {
      const textAnn: TextAnnotation = {
        type: 'text',
        color,
        position: { x: textInput.x, y: textInput.y },
        content: textInput.value.trim(),
      }
      setAnnotations((prev) => {
        const next = [...prev, textAnn]
        const ctx = getCtx()
        const container = containerRef.current
        if (ctx && container) {
          const rect = container.getBoundingClientRect()
          redrawAll(ctx, next, rect.width, rect.height)
        }
        return next
      })
    }
    setTextInput({ x: 0, y: 0, visible: false, value: '' })
  }, [textInput, color, getCtx])

  const handleTextKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleTextSubmit()
    } else if (e.key === 'Escape') {
      setTextInput({ x: 0, y: 0, visible: false, value: '' })
    }
  }, [handleTextSubmit])

  const cursorClass = active
    ? tool === 'pen'
      ? 'cursor-crosshair'
      : tool === 'eraser'
        ? 'brush-eraser-cursor'
        : tool === 'text'
          ? 'cursor-text'
          : 'cursor-crosshair'
    : 'cursor-default'

  if (!active) return null

  return (
    <div ref={containerRef} className="absolute inset-0 z-20">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          if (drawingRef.current) {
            drawingRef.current = false
            currentStrokeRef.current = []
          }
        }}
        className={`block ${cursorClass}`}
      />

      {textInput.visible && (
        <div
          className="absolute z-30"
          style={{ left: textInput.x, top: textInput.y - 4 }}
        >
          <input
            ref={textInputRef}
            type="text"
            value={textInput.value}
            onChange={(e) => setTextInput((prev) => ({ ...prev, value: e.target.value }))}
            onKeyDown={handleTextKeyDown}
            onBlur={handleTextSubmit}
            className="brush-text-input"
            placeholder="输入文字..."
          />
        </div>
      )}

      <div className="brush-toolbar">
        <div className="brush-toolbar-inner">
          <div className="brush-tool-group">
            <button
              className={`brush-tool-btn ${tool === 'pen' ? 'active' : ''}`}
              onClick={() => setTool('pen')}
              title="画笔"
            >
              <Pen className="w-4 h-4" />
            </button>
            <button
              className={`brush-tool-btn ${tool === 'eraser' ? 'active' : ''}`}
              onClick={() => setTool('eraser')}
              title="橡皮擦"
            >
              <Eraser className="w-4 h-4" />
            </button>
            <button
              className={`brush-tool-btn ${tool === 'arrow' ? 'active' : ''}`}
              onClick={() => setTool('arrow')}
              title="箭头"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              className={`brush-tool-btn ${tool === 'circle' ? 'active' : ''}`}
              onClick={() => setTool('circle')}
              title="圆圈"
            >
              <Circle className="w-4 h-4" />
            </button>
            <button
              className={`brush-tool-btn ${tool === 'text' ? 'active' : ''}`}
              onClick={() => setTool('text')}
              title="文字"
            >
              <Type className="w-4 h-4" />
            </button>
          </div>

          {(tool === 'pen' || tool === 'arrow' || tool === 'circle' || tool === 'text') && (
            <div className="brush-color-group">
              {PEN_COLORS.map((c) => (
                <button
                  key={c.value}
                  className={`brush-color-btn ${color === c.value ? 'active' : ''}`}
                  style={{ backgroundColor: c.value }}
                  onClick={() => setColor(c.value)}
                  title={c.label}
                />
              ))}
            </div>
          )}

          <div className="brush-tool-group" style={{ borderLeft: '1px solid rgba(0,240,255,0.15)', paddingLeft: '8px' }}>
            <button
              className="brush-tool-btn brush-clear-btn"
              onClick={handleClear}
              title="清屏"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
