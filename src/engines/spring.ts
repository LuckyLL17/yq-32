import type { ExperimentEngine, DragEvent, DragResult, EngineData } from '../data/types'
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

    ctx.fillStyle = '#475569'
    ctx.fillRect(wallX - wallW, centerY - wallH / 2, wallW, wallH)
    ctx.strokeStyle = '#64748b'
    ctx.lineWidth = 1
    for (let i = 0; i < wallH; i += 8) {
      const y0 = centerY - wallH / 2 + i
      ctx.beginPath()
      ctx.moveTo(wallX - wallW, y0)
      ctx.lineTo(wallX - wallW + Math.min(8, i), y0 - Math.min(8, i))
      ctx.stroke()
    }

    drawSpring(ctx, wallX, centerY, blockX - massRadius, centerY, 12, 14, '#00f0ff')

    drawCircle(ctx, blockX, centerY, massRadius, '#1e3a8a', '#3b82f6', '#3b82f680')

    ctx.font = 'bold 14px sans-serif'
    ctx.fillStyle = '#e2e8f0'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('m', blockX, centerY)

    if (Math.abs(this.currentDisplacement) > 0.02) {
      const arrowY = centerY + massRadius + 28
      drawArrow(ctx, equilibriumX, arrowY, blockX, arrowY, '#fbbf24', 1.5)
      drawText(
        ctx,
        `x = ${this.currentDisplacement.toFixed(2)} m`,
        (equilibriumX + blockX) / 2,
        arrowY + 16,
        '#fbbf24',
        12,
        'center'
      )
    }

    const k = this.params.stiffness ?? 20
    const force = -k * this.currentDisplacement
    if (Math.abs(force) > 0.5) {
      const forceScale = Math.min(Math.abs(force) * 1.5, 120) * Math.sign(force)
      drawArrow(
        ctx,
        blockX,
        centerY - massRadius - 18,
        blockX + forceScale,
        centerY - massRadius - 18,
        '#ef4444',
        2
      )
      drawText(ctx, 'F', blockX + forceScale / 2, centerY - massRadius - 34, '#ef4444', 13, 'center')
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
        drawLine(ctx, points, '#00f0ff', 1.5, true)
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
