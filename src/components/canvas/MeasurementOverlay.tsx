import { useEffect, useRef, useState, useCallback } from 'react'
import { Pin, X } from 'lucide-react'
import { useExperimentStore } from '@/stores/experimentStore'
import type { Point, CoordinateMeasure, DistanceMeasure, AngleMeasure } from '@/data/types'

interface MeasurementOverlayProps {
  containerRef: React.RefObject<HTMLDivElement>
}

export default function MeasurementOverlay({ containerRef }: MeasurementOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayContainerRef = useRef<HTMLDivElement>(null)
  const [hoveredMeasure, setHoveredMeasure] = useState<string | null>(null)

  const {
    measureTool,
    measureColor,
    measures,
    addMeasure,
    togglePinMeasure,
    removeMeasure,
  } = useExperimentStore()

  const drawingRef = useRef<{
    points: Point[]
    currentMousePos: Point | null
  }>({
    points: [],
    currentMousePos: null,
  })

  const measuresRef = useRef(measures)
  const measureToolRef = useRef(measureTool)
  const measureColorRef = useRef(measureColor)
  const hoveredMeasureRef = useRef(hoveredMeasure)

  useEffect(() => {
    measuresRef.current = measures
  }, [measures])

  useEffect(() => {
    measureToolRef.current = measureTool
    drawingRef.current.points = []
    drawingRef.current.currentMousePos = null
  }, [measureTool])

  useEffect(() => {
    measureColorRef.current = measureColor
  }, [measureColor])

  useEffect(() => {
    hoveredMeasureRef.current = hoveredMeasure
  }, [hoveredMeasure])

  const getCanvasCoords = useCallback((e: React.MouseEvent | MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }, [])

  const getRequiredPoints = (tool: string) => {
    switch (tool) {
      case 'coordinate': return 1
      case 'distance': return 2
      case 'angle': return 3
      default: return 0
    }
  }

  const calculateDistance = (p1: Point, p2: Point) => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
  }

  const calculateAngle = (vertex: Point, p1: Point, p2: Point) => {
    const v1 = { x: p1.x - vertex.x, y: p1.y - vertex.y }
    const v2 = { x: p2.x - vertex.x, y: p2.y - vertex.y }
    const dot = v1.x * v2.x + v1.y * v2.y
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y)
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y)
    const cos = dot / (mag1 * mag2)
    const angleRad = Math.acos(Math.max(-1, Math.min(1, cos)))
    return angleRad * (180 / Math.PI)
  }

  const drawMeasure = useCallback((ctx: CanvasRenderingContext2D, measure: any, isHovered: boolean) => {
    ctx.save()
    ctx.strokeStyle = measure.color
    ctx.fillStyle = measure.color
    ctx.lineWidth = isHovered ? 3 : 2
    ctx.shadowColor = measure.color
    ctx.shadowBlur = isHovered ? 10 : 4

    if (measure.type === 'coordinate') {
      const { point } = measure
      ctx.beginPath()
      ctx.arc(point.x, point.y, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(10, 14, 23, 0.8)'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(point.x, point.y)
      ctx.lineTo(point.x, point.y + 40)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(point.x, point.y)
      ctx.lineTo(point.x + 40, point.y)
      ctx.stroke()
      ctx.setLineDash([])
    } else if (measure.type === 'distance') {
      const { from, to } = measure
      const angle = Math.atan2(to.y - from.y, to.x - from.x)

      ctx.beginPath()
      ctx.moveTo(from.x, from.y)
      ctx.lineTo(to.x, to.y)
      ctx.stroke()

      const tickLength = 8
      const perpAngle = angle + Math.PI / 2
      ctx.beginPath()
      ctx.moveTo(from.x + tickLength * Math.cos(perpAngle), from.y + tickLength * Math.sin(perpAngle))
      ctx.lineTo(from.x - tickLength * Math.cos(perpAngle), from.y - tickLength * Math.sin(perpAngle))
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(to.x + tickLength * Math.cos(perpAngle), to.y + tickLength * Math.sin(perpAngle))
      ctx.lineTo(to.x - tickLength * Math.cos(perpAngle), to.y - tickLength * Math.sin(perpAngle))
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(from.x, from.y, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(to.x, to.y, 4, 0, Math.PI * 2)
      ctx.fill()
    } else if (measure.type === 'angle') {
      const { vertex, point1, point2 } = measure
      const radius = 30

      const startAngle = Math.atan2(point1.y - vertex.y, point1.x - vertex.x)
      const endAngle = Math.atan2(point2.y - vertex.y, point2.x - vertex.x)

      ctx.beginPath()
      ctx.moveTo(vertex.x, vertex.y)
      ctx.lineTo(point1.x, point1.y)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(vertex.x, vertex.y)
      ctx.lineTo(point2.x, point2.y)
      ctx.stroke()

      ctx.beginPath()
      const angleDiff = endAngle - startAngle
      const normalizedDiff = angleDiff > Math.PI ? angleDiff - 2 * Math.PI : angleDiff < -Math.PI ? angleDiff + 2 * Math.PI : angleDiff
      ctx.arc(vertex.x, vertex.y, radius, startAngle, startAngle + normalizedDiff, normalizedDiff < 0)
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(vertex.x, vertex.y, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(point1.x, point1.y, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(point2.x, point2.y, 4, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  }, [])

  const drawLabel = useCallback((ctx: CanvasRenderingContext2D, measure: any, isHovered: boolean) => {
    ctx.save()
    ctx.font = 'bold 12px "IBM Plex Sans", monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'

    let labelX = 0, labelY = 0, label = ''

    if (measure.type === 'coordinate') {
      labelX = measure.point.x + 20
      labelY = measure.point.y - 20
      label = `(${measure.point.x.toFixed(1)}, ${measure.point.y.toFixed(1)})`
    } else if (measure.type === 'distance') {
      const midX = (measure.from.x + measure.to.x) / 2
      const midY = (measure.from.y + measure.to.y) / 2
      const angle = Math.atan2(measure.to.y - measure.from.y, measure.to.x - measure.from.x)
      const offset = 20
      labelX = midX + offset * Math.sin(angle)
      labelY = midY - offset * Math.cos(angle)
      label = `${measure.distance.toFixed(2)} px`
    } else if (measure.type === 'angle') {
      const radius = 45
      const startAngle = Math.atan2(measure.point1.y - measure.vertex.y, measure.point1.x - measure.vertex.x)
      const endAngle = Math.atan2(measure.point2.y - measure.vertex.y, measure.point2.x - measure.vertex.x)
      const midAngle = (startAngle + endAngle) / 2
      labelX = measure.vertex.x + radius * Math.cos(midAngle)
      labelY = measure.vertex.y + radius * Math.sin(midAngle)
      label = `${measure.angle.toFixed(1)}°`
    }

    const padding = 6
    const textWidth = ctx.measureText(label).width
    const boxWidth = textWidth + padding * 2
    const boxHeight = 20

    ctx.fillStyle = isHovered ? 'rgba(10, 14, 23, 0.95)' : 'rgba(10, 14, 23, 0.85)'
    ctx.strokeStyle = measure.color
    ctx.lineWidth = 1
    ctx.shadowColor = measure.color
    ctx.shadowBlur = isHovered ? 8 : 4

    ctx.beginPath()
    const boxX = labelX - boxWidth / 2
    const boxY = labelY - boxHeight
    if (ctx.roundRect) {
      ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 4)
    } else {
      const r = 4
      ctx.moveTo(boxX + r, boxY)
      ctx.lineTo(boxX + boxWidth - r, boxY)
      ctx.quadraticCurveTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + r)
      ctx.lineTo(boxX + boxWidth, boxY + boxHeight - r)
      ctx.quadraticCurveTo(boxX + boxWidth, boxY + boxHeight, boxX + boxWidth - r, boxY + boxHeight)
      ctx.lineTo(boxX + r, boxY + boxHeight)
      ctx.quadraticCurveTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - r)
      ctx.lineTo(boxX, boxY + r)
      ctx.quadraticCurveTo(boxX, boxY, boxX + r, boxY)
      ctx.closePath()
    }
    ctx.fill()
    ctx.stroke()

    ctx.shadowBlur = 0
    ctx.fillStyle = measure.color
    ctx.fillText(label, labelX, labelY - 4)

    ctx.restore()

    return { x: labelX, y: labelY, width: textWidth + 12, height: 20 }
  }, [])

  const drawPreview = useCallback((ctx: CanvasRenderingContext2D) => {
    const { points, currentMousePos } = drawingRef.current
    const tool = measureToolRef.current
    const color = measureColorRef.current

    if (!currentMousePos || tool === 'none') return

    ctx.save()
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = 2
    ctx.shadowColor = color
    ctx.shadowBlur = 8
    ctx.setLineDash([6, 4])

    if (tool === 'distance' && points.length === 1) {
      ctx.beginPath()
      ctx.moveTo(points[0].x, points[0].y)
      ctx.lineTo(currentMousePos.x, currentMousePos.y)
      ctx.stroke()
    } else if (tool === 'angle') {
      if (points.length === 1) {
        ctx.beginPath()
        ctx.moveTo(points[0].x, points[0].y)
        ctx.lineTo(currentMousePos.x, currentMousePos.y)
        ctx.stroke()
      } else if (points.length === 2) {
        ctx.beginPath()
        ctx.moveTo(points[0].x, points[0].y)
        ctx.lineTo(points[1].x, points[1].y)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(points[0].x, points[0].y)
        ctx.lineTo(currentMousePos.x, currentMousePos.y)
        ctx.stroke()
      }
    }

    ctx.setLineDash([])
    ctx.restore()
  }, [])

  const drawPendingPoints = useCallback((ctx: CanvasRenderingContext2D) => {
    const { points } = drawingRef.current
    const color = measureColorRef.current

    if (points.length === 0) return

    ctx.save()
    ctx.fillStyle = color
    ctx.strokeStyle = '#0a0e17'
    ctx.lineWidth = 2
    ctx.shadowColor = color
    ctx.shadowBlur = 8

    points.forEach((point, index) => {
      ctx.beginPath()
      ctx.arc(point.x, point.y, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = '#0a0e17'
      ctx.font = 'bold 10px "IBM Plex Sans", sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(String(index + 1), point.x, point.y)
      ctx.fillStyle = color
    })

    ctx.restore()
  }, [])

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const rect = container.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const canvasRect = canvas.getBoundingClientRect()
    ctx.clearRect(0, 0, canvasRect.width, canvasRect.height)

    measuresRef.current.forEach((measure) => {
      const isHovered = hoveredMeasureRef.current === measure.id
      drawMeasure(ctx, measure, isHovered)
      drawLabel(ctx, measure, isHovered)
    })

    drawPendingPoints(ctx)
    drawPreview(ctx)
  }, [drawMeasure, drawLabel, drawPendingPoints, drawPreview, containerRef])

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
        redrawCanvas()
      }
    }

    resizeCanvas()

    const resizeObserver = new ResizeObserver(resizeCanvas)
    resizeObserver.observe(container)

    return () => resizeObserver.disconnect()
  }, [redrawCanvas, containerRef])

  useEffect(() => {
    redrawCanvas()
  }, [measures, redrawCanvas])

  useEffect(() => {
    redrawCanvas()
  }, [hoveredMeasure, redrawCanvas])

  const completeMeasurement = useCallback(() => {
    const { points } = drawingRef.current
    const tool = measureToolRef.current
    const color = measureColorRef.current

    if (points.length === 0) return

    const id = `measure-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    if (tool === 'coordinate') {
      const measure: CoordinateMeasure = {
        id,
        type: 'coordinate',
        point: points[0],
        pinned: false,
        color,
      }
      addMeasure(measure)
    } else if (tool === 'distance' && points.length >= 2) {
      const measure: DistanceMeasure = {
        id,
        type: 'distance',
        from: points[0],
        to: points[1],
        distance: calculateDistance(points[0], points[1]),
        pinned: false,
        color,
      }
      addMeasure(measure)
    } else if (tool === 'angle' && points.length >= 3) {
      const measure: AngleMeasure = {
        id,
        type: 'angle',
        vertex: points[0],
        point1: points[1],
        point2: points[2],
        angle: calculateAngle(points[0], points[1], points[2]),
        pinned: false,
        color,
      }
      addMeasure(measure)
    }

    drawingRef.current.points = []
    drawingRef.current.currentMousePos = null
  }, [addMeasure])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (measureToolRef.current === 'none') return

    const pos = getCanvasCoords(e)
    drawingRef.current.currentMousePos = pos
    redrawCanvas()
  }, [getCanvasCoords, redrawCanvas])

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (measureToolRef.current === 'none') return

    const pos = getCanvasCoords(e)
    const required = getRequiredPoints(measureToolRef.current)

    drawingRef.current.points.push(pos)

    if (drawingRef.current.points.length >= required) {
      completeMeasurement()
    }
    redrawCanvas()
  }, [getCanvasCoords, completeMeasurement, redrawCanvas])

  const handleRightClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    if (measureToolRef.current !== 'none') {
      drawingRef.current.points = []
      drawingRef.current.currentMousePos = null
      redrawCanvas()
    }
  }, [redrawCanvas])

  const handleMouseLeave = useCallback(() => {
    drawingRef.current.currentMousePos = null
    redrawCanvas()
  }, [redrawCanvas])

  const cursorClass = measureTool !== 'none'
    ? 'cursor-crosshair'
    : 'cursor-default'

  const isInteractive = measureTool !== 'none'
  const hasPinnedMeasures = measures.some((m) => m.pinned)
  const shouldRenderOverlay = isInteractive || hasPinnedMeasures

  return (
    <div
      ref={overlayContainerRef}
      className={`absolute inset-0 z-30 ${isInteractive ? '' : 'pointer-events-none'}`}
    >
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onContextMenu={handleRightClick}
        className={`block ${cursorClass} ${isInteractive ? 'pointer-events-auto' : 'pointer-events-none'}`}
        style={{ touchAction: 'none' }}
      />

      {measures.map((measure) => (
        measure.pinned && (
          <div
            key={measure.id}
            className={`measure-pin-controls ${hoveredMeasure === measure.id ? 'visible' : ''}`}
            style={{
              left: measure.type === 'coordinate' ? measure.point.x :
                    measure.type === 'distance' ? (measure.from.x + measure.to.x) / 2 :
                    measure.vertex.x,
              top: (measure.type === 'coordinate' ? measure.point.y :
                    measure.type === 'distance' ? (measure.from.y + measure.to.y) / 2 :
                    measure.vertex.y) - 50,
            }}
            onMouseEnter={() => setHoveredMeasure(measure.id)}
            onMouseLeave={() => setHoveredMeasure(null)}
          >
            <button
              className="measure-pin-btn"
              onClick={(e) => {
                e.stopPropagation()
                togglePinMeasure(measure.id)
              }}
              title="取消钉住"
              style={{ color: measure.color, borderColor: measure.color }}
            >
              <Pin className="w-3 h-3" />
            </button>
            <button
              className="measure-pin-btn"
              onClick={(e) => {
                e.stopPropagation()
                removeMeasure(measure.id)
              }}
              title="删除"
              style={{ color: '#ef4444', borderColor: '#ef4444' }}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )
      ))}
    </div>
  )
}
