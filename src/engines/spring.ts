import type { ExperimentEngine, DragEvent, DragResult, EngineData, HighlightElementType } from '../data/types'
import { drawGrid, drawSpring, drawCircle, drawArrow, drawText, clearCanvas, drawLine } from '../utils/canvas'
import { harmonicMotion } from '../utils/physics'

export class SpringEngine implements ExperimentEngine {
  private ctx: CanvasRenderingContext2D | null = null
  private width = 0
  private height = 0
  private time = 0
  private currentDisplacement = 0
  private currentVelocity = 0
  private trajectoryPoints: { x: number; y: number }[] = []
  private isDragging = false
  private params: Record<string, number> = {}
  private highlightElement: HighlightElementType | null = null
  private highlightTime = 0

  init(canvas: HTMLCanvasElement, params: Record<string, number>, width?: number, height?: number): void {
    this.ctx = canvas.getContext('2d')
    this.width = width ?? canvas.width
    this.height = height ?? canvas.height
    this.params = params
    this.time = 0
    this.currentDisplacement = params.displacement ?? 1
    this.currentVelocity = 0
    this.trajectoryPoints = []
  }

  update(dt: number, params: Record<string, number>): void {
    this.params = params
    if (this.highlightElement) {
      this.highlightTime += dt
    } else {
      this.highlightTime = 0
    }
    if (this.isDragging) return

    this.time += dt
    const mass = params.mass ?? 1
    const k = params.stiffness ?? 20
    const damping = params.damping ?? 0.1
    const amplitude = params.displacement ?? 1
    const omega = Math.sqrt(k / mass)

    this.currentDisplacement = harmonicMotion(amplitude, omega, damping, this.time)
    this.currentVelocity =
      amplitude *
      Math.exp(-damping * this.time) *
      (-damping * Math.cos(omega * this.time) - omega * Math.sin(omega * this.time))

    this.trajectoryPoints.push({ x: this.time, y: this.currentDisplacement })
    if (this.trajectoryPoints.length > 300) {
      this.trajectoryPoints = this.trajectoryPoints.slice(-300)
    }
  }

  setHighlightElement(element: HighlightElementType | null): void {
    this.highlightElement = element
    this.highlightTime = 0
  }

  private getHighlightPulse(): number {
    if (!this.highlightElement) return 0
    return (Math.sin(this.highlightTime * 8) + 1) / 2
  }

  private isHighlighted(type: HighlightElementType): boolean {
    return this.highlightElement === type
  }

  render(): void {
    if (!this.ctx) return
    const ctx = this.ctx
    const { width, height } = this

    clearCanvas(ctx, width, height)
    drawGrid(ctx, width, height)

    const wallX = width * 0.2
    const wallW = 12
    const wallH = 140
    const centerY = height * 0.38
    const equilibriumX = width * 0.55
    const mass = this.params.mass ?? 1
    const massRadius = Math.min(50, Math.max(20, mass * 10 + 10))
    const blockX = equilibriumX + this.currentDisplacement * 80

    const wallHighlighted = this.isHighlighted('wall')
    const wallPulse = wallHighlighted ? this.getHighlightPulse() : 0
    ctx.fillStyle = wallHighlighted ? `rgb(${71 + wallPulse * 100}, ${85 + wallPulse * 100}, ${105 + wallPulse * 100})` : '#475569'
    ctx.fillRect(wallX - wallW, centerY - wallH / 2, wallW, wallH)
    ctx.strokeStyle = wallHighlighted ? `rgba(0, 240, 255, ${0.5 + wallPulse * 0.5})` : '#64748b'
    ctx.lineWidth = wallHighlighted ? 2 + wallPulse * 2 : 1
    for (let i = 0; i < wallH; i += 8) {
      const y0 = centerY - wallH / 2 + i
      ctx.beginPath()
      ctx.moveTo(wallX - wallW, y0)
      ctx.lineTo(wallX - wallW + Math.min(8, i), y0 - Math.min(8, i))
      ctx.stroke()
    }
    if (wallHighlighted) {
      ctx.save()
      ctx.shadowColor = '#00f0ff'
      ctx.shadowBlur = 20 + wallPulse * 30
      ctx.strokeStyle = `rgba(0, 240, 255, ${0.5 + wallPulse * 0.5})`
      ctx.lineWidth = 3
      ctx.strokeRect(wallX - wallW, centerY - wallH / 2, wallW, wallH)
      ctx.restore()
    }

    const springHighlighted = this.isHighlighted('spring')
    const springPulse = springHighlighted ? this.getHighlightPulse() : 0
    const springColor = springHighlighted ? `rgb(${0 + springPulse * 255}, ${240 + springPulse * 15}, ${255})` : '#00f0ff'
    const springAmplitude = 14 + (springHighlighted ? springPulse * 8 : 0)
    drawSpring(ctx, wallX, centerY, blockX - massRadius, centerY, 12, springAmplitude, springColor)
    if (springHighlighted) {
      ctx.save()
      ctx.shadowColor = '#00f0ff'
      ctx.shadowBlur = 15 + springPulse * 25
      ctx.strokeStyle = `rgba(0, 240, 255, ${0.8})`
      ctx.lineWidth = 3 + springPulse * 2
      drawSpring(ctx, wallX, centerY, blockX - massRadius, centerY, 12, springAmplitude + 2, `rgba(0, 240, 255, ${0.3 + springPulse * 0.4})`)
      ctx.restore()
    }

    const massHighlighted = this.isHighlighted('mass')
    const massPulse = massHighlighted ? this.getHighlightPulse() : 0
    const massGlowColor = massHighlighted ? `rgba(59, 130, 246, ${0.5 + massPulse * 0.5})` : '#3b82f680'
    const massStrokeColor = massHighlighted ? `rgb(${59 + massPulse * 100}, ${130 + massPulse * 100}, ${246})` : '#3b82f6'
    drawCircle(ctx, blockX, centerY, massRadius + (massHighlighted ? massPulse * 5 : 0), '#1e3a8a', massStrokeColor, massGlowColor)
    if (massHighlighted) {
      ctx.save()
      ctx.shadowColor = '#3b82f6'
      ctx.shadowBlur = 25 + massPulse * 35
      ctx.beginPath()
      ctx.arc(blockX, centerY, massRadius + massPulse * 8, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(59, 130, 246, ${0.6 + massPulse * 0.4})`
      ctx.lineWidth = 3 + massPulse * 3
      ctx.stroke()
      ctx.restore()
    }

    ctx.font = 'bold 14px sans-serif'
    ctx.fillStyle = '#e2e8f0'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('m', blockX, centerY)

    const dispHighlighted = this.isHighlighted('displacement')
    const dispPulse = dispHighlighted ? this.getHighlightPulse() : 0
    if (Math.abs(this.currentDisplacement) > 0.02 || dispHighlighted) {
      const arrowY = centerY + massRadius + 28
      const dispColor = dispHighlighted ? `rgb(${251 + dispPulse * 4}, ${191 + dispPulse * 64}, ${36})` : '#fbbf24'
      const dispLineWidth = dispHighlighted ? 2 + dispPulse * 3 : 1.5
      drawArrow(ctx, equilibriumX, arrowY, blockX, arrowY, dispColor, dispLineWidth)
      if (dispHighlighted) {
        ctx.save()
        ctx.shadowColor = '#fbbf24'
        ctx.shadowBlur = 15 + dispPulse * 25
        drawArrow(ctx, equilibriumX, arrowY, blockX, arrowY, `rgba(251, 191, 36, ${0.6 + dispPulse * 0.4})`, dispLineWidth + 2)
        ctx.restore()
      }
      drawText(
        ctx,
        `x = ${this.currentDisplacement.toFixed(2)} m`,
        (equilibriumX + blockX) / 2,
        arrowY + 16,
        dispColor,
        dispHighlighted ? 14 + dispPulse * 2 : 12,
        'center'
      )
    }

    const k = this.params.stiffness ?? 20
    const force = -k * this.currentDisplacement
    const forceHighlighted = this.isHighlighted('force')
    const forcePulse = forceHighlighted ? this.getHighlightPulse() : 0
    if (Math.abs(force) > 0.5 || forceHighlighted) {
      const forceScale = Math.min(Math.abs(Math.max(force, 0.5)) * 1.5, 120) * Math.sign(force || 1)
      const forceColor = forceHighlighted ? `rgb(${239 + forcePulse * 16}, ${68 + forcePulse * 68}, ${68})` : '#ef4444'
      const forceLineWidth = forceHighlighted ? 3 + forcePulse * 2 : 2
      drawArrow(
        ctx,
        blockX,
        centerY - massRadius - 18,
        blockX + forceScale,
        centerY - massRadius - 18,
        forceColor,
        forceLineWidth
      )
      if (forceHighlighted) {
        ctx.save()
        ctx.shadowColor = '#ef4444'
        ctx.shadowBlur = 15 + forcePulse * 25
        drawArrow(
          ctx,
          blockX,
          centerY - massRadius - 18,
          blockX + forceScale,
          centerY - massRadius - 18,
          `rgba(239, 68, 68, ${0.6 + forcePulse * 0.4})`,
          forceLineWidth + 2
        )
        ctx.restore()
      }
      drawText(ctx, 'F', blockX + forceScale / 2, centerY - massRadius - 34, forceColor, forceHighlighted ? 15 + forcePulse * 2 : 13, 'center')
    }

    const infoX = width * 0.85
    const infoY = 30
    drawText(ctx, `x = ${this.currentDisplacement.toFixed(2)} m`, infoX, infoY, '#fbbf24', 13, 'right')
    drawText(ctx, `v = ${this.currentVelocity.toFixed(2)} m/s`, infoX, infoY + 20, '#34d399', 13, 'right')

    const plotX = width * 0.1
    const plotY = height * 0.7
    const plotW = width * 0.8
    const plotH = height * 0.22

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)'
    ctx.fillRect(plotX, plotY, plotW, plotH)
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)'
    ctx.lineWidth = 1
    ctx.strokeRect(plotX, plotY, plotW, plotH)

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)'
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(plotX, plotY + plotH / 2)
    ctx.lineTo(plotX + plotW, plotY + plotH / 2)
    ctx.stroke()
    ctx.setLineDash([])

    drawText(ctx, '位移-时间', plotX + 8, plotY + 14, '#64748b', 11)

    const trajHighlighted = this.isHighlighted('trajectory')
    const trajPulse = trajHighlighted ? this.getHighlightPulse() : 0
    if (this.trajectoryPoints.length > 1) {
      const maxDisp = 2.5
      const timeWindow = 10
      const points = this.trajectoryPoints
        .map((p) => ({
          x: plotX + (p.x / timeWindow) * plotW,
          y: plotY + plotH / 2 - (p.y / maxDisp) * (plotH / 2)
        }))
        .filter((p) => p.x >= plotX && p.x <= plotX + plotW && p.y >= plotY && p.y <= plotY + plotH)

      if (points.length > 1) {
        const trajColor = trajHighlighted ? `rgb(${0 + trajPulse * 100}, ${240 + trajPulse * 15}, ${255})` : '#00f0ff'
        const trajLineWidth = trajHighlighted ? 2 + trajPulse * 3 : 1.5
        if (trajHighlighted) {
          ctx.save()
          ctx.shadowColor = '#00f0ff'
          ctx.shadowBlur = 20 + trajPulse * 30
          ctx.strokeStyle = `rgba(0, 240, 255, ${0.8})`
          ctx.lineWidth = trajLineWidth + 2
          ctx.lineJoin = 'round'
          ctx.beginPath()
          ctx.moveTo(points[0].x, points[0].y)
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y)
          }
          ctx.stroke()
          ctx.restore()
        }
        drawLine(ctx, points, trajColor, trajLineWidth, true)
      }
    }
  }

  handleDrag(event: DragEvent): DragResult {
    if (!this.ctx) return { handled: false }

    const centerY = this.height * 0.38
    const equilibriumX = this.width * 0.55
    const mass = this.params.mass ?? 1
    const massRadius = Math.min(50, Math.max(20, mass * 10 + 10))
    const blockX = equilibriumX + this.currentDisplacement * 80

    if (event.type === 'start') {
      const dx = event.x - blockX
      const dy = event.y - centerY
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < massRadius + 10) {
        this.isDragging = true
        return { handled: true }
      }
      return { handled: false }
    }

    if (event.type === 'move' && this.isDragging) {
      const newDisplacement = (event.x - equilibriumX) / 80
      const clamped = Math.max(-2, Math.min(2, Math.round(newDisplacement * 10) / 10))
      this.currentDisplacement = clamped
      return { handled: true, params: { ...this.params, displacement: clamped } }
    }

    if (event.type === 'end' && this.isDragging) {
      this.isDragging = false
      this.time = 0
      this.trajectoryPoints = []
      return { handled: true }
    }

    return { handled: false }
  }

  destroy(): void {
    this.ctx = null
    this.trajectoryPoints = []
    this.time = 0
  }

  getData(): EngineData {
    return {
      time: this.time,
      primary: this.currentDisplacement,
      secondary: this.currentVelocity,
    }
  }

  getFormulaWithValues(params: Record<string, number>): string {
    const mass = params.mass ?? 1
    const k = params.stiffness ?? 20
    const damping = params.damping ?? 0.1
    const amplitude = params.displacement ?? 1
    const omega = Math.sqrt(k / mass)
    return `x(t) = ${amplitude.toFixed(2)} \\cdot e^{-${damping.toFixed(2)}t} \\cos(${omega.toFixed(2)} t)`
  }
}
