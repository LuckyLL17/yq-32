import { useEffect, useRef } from 'react'
import type { ExperimentEngine, EngineData } from '@/data/types'
import { AnimationLoop } from '@/utils/animation'

interface ExperimentCanvasProps {
  engine: ExperimentEngine
  params: Record<string, number>
  onParamChange?: (params: Record<string, number>) => void
  onDataUpdate?: (data: EngineData) => void
  running?: boolean
}

export default function ExperimentCanvas({
  engine,
  params,
  onParamChange,
  onDataUpdate,
  running = true,
}: ExperimentCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef(engine)
  const paramsRef = useRef(params)
  const isDraggingRef = useRef(false)
  const loopRef = useRef<AnimationLoop | null>(null)
  const onDataUpdateRef = useRef(onDataUpdate)
  const runningRef = useRef(running)

  useEffect(() => {
    engineRef.current = engine
  }, [engine])

  useEffect(() => {
    paramsRef.current = params
    if (!isDraggingRef.current) {
      const canvas = canvasRef.current
      if (canvas) {
        engineRef.current.init(canvas, params, canvas.clientWidth, canvas.clientHeight)
      }
    }
  }, [params])

  useEffect(() => {
    onDataUpdateRef.current = onDataUpdate
  }, [onDataUpdate])

  useEffect(() => {
    runningRef.current = running
  }, [running])

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
      }
      engineRef.current.init(canvas, paramsRef.current, rect.width, rect.height)
    }

    resizeCanvas()

    const resizeObserver = new ResizeObserver(resizeCanvas)
    resizeObserver.observe(container)

    const loop = new AnimationLoop((dt) => {
      if (runningRef.current) {
        engineRef.current.update(dt, paramsRef.current)
      }
      engineRef.current.render()
      if (onDataUpdateRef.current && runningRef.current) {
        onDataUpdateRef.current(engineRef.current.getData())
      }
    })

    loopRef.current = loop
    loop.start()

    return () => {
      resizeObserver.disconnect()
      loop.destroy()
      engineRef.current.destroy()
    }
  }, [])

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e)
    const result = engineRef.current.handleDrag({ type: 'start', x, y })
    if (result.handled) {
      isDraggingRef.current = true
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return
    const { x, y } = getCanvasCoords(e)
    const result = engineRef.current.handleDrag({ type: 'move', x, y })
    if (result.handled && result.params && onParamChange) {
      onParamChange(result.params)
    }
  }

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return
    const { x, y } = getCanvasCoords(e)
    engineRef.current.handleDrag({ type: 'end', x, y })
    isDraggingRef.current = false
  }

  const handleMouseLeave = () => {
    if (!isDraggingRef.current) return
    engineRef.current.handleDrag({ type: 'end', x: 0, y: 0 })
    isDraggingRef.current = false
  }

  return (
    <div ref={containerRef} className="w-full h-full">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className="block cursor-pointer"
      />
    </div>
  )
}
