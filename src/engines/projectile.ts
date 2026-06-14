import type { ExperimentEngine, DragEvent, DragResult, EngineData, HighlightElementType } from '../data/types'
import { clearCanvas, drawGrid, drawArrow, drawCircle, drawText, drawTrail, drawLine } from '../utils/canvas'
import { projectilePosition, projectileMaxHeight, projectileRange } from '../utils/physics'

const SCALE = 5
const LAUNCH_COLOR = '#ff6b2b'
const TRAIL_COLOR = '#00f0ff'

export class ProjectileEngine implements ExperimentEngine {
  private ctx: CanvasRenderingContext2D | null = null
  private width = 0
  private height = 0
  private params: Record<string, number> = {}
  private time = 0
  private trail: { x: number; y: number }[] = []
  private currentPos = { x: 0, y: 0 }
  private isDragging = false
  private isLaunched = false
  private maxHeightPoint = { x: 0, y: 0 }
  private rangePoint = { x: 0, y: 0 }
  private highlightElement: HighlightElementType | null = null
  private highlightTime = 0

  private get launchX() { return 100 }
  private get launchY() { return this.height - 50 }

  init(canvas: HTMLCanvasElement, params: Record<string, number>, width?: number, height?: number): void {
    this.ctx = canvas.getContext('2d')!
    this.width = width ?? canvas.width
    this.height = height ?? canvas.height
    this.params = { ...params }
    this.time = 0
    this.trail = []
    this.isLaunched = false
    const v0 = params.velocity ?? 20
    const angleDeg = params.angle ?? 45
    const g = params.gravity ?? 9.8
    const maxH = projectileMaxHeight(v0, angleDeg, g)
    const range = projectileRange(v0, angleDeg, g)
    this.maxHeightPoint = { x: this.launchX + (range / 2) * SCALE, y: this.launchY - maxH * SCALE }
    this.rangePoint = { x: this.launchX + range * SCALE, y: this.launchY }
    this.currentPos = { x: this.launchX, y: this.launchY }
  }

  update(dt: number, params: Record<string, number>): void {
    this.params = { ...params }
    if (this.highlightElement) {
      this.highlightTime += dt
    } else {
      this.highlightTime = 0
    }
    const v0 = params.velocity ?? 20
    const angleDeg = params.angle ?? 45
    const g = params.gravity ?? 9.8

    if (!this.isLaunched && !this.isDragging) {
      const pos = projectilePosition(v0, angleDeg, g, this.time)
      this.currentPos = {
        x: this.launchX + pos.x * SCALE,
        y: this.launchY - pos.y * SCALE,
      }
      if (pos.y >= 0 || this.time < 0.05) {
        this.trail.push({ ...this.currentPos })
        if (this.trail.length > 400) this.trail = this.trail.slice(-400)
      }
      if (pos.y < 0) {
        this.isLaunched = true
      }
      this.time += dt
    }

    const maxH = projectileMaxHeight(v0, angleDeg, g)
    const range = projectileRange(v0, angleDeg, g)
    this.maxHeightPoint = { x: this.launchX + (range / 2) * SCALE, y: this.launchY - maxH * SCALE }
    this.rangePoint = { x: this.launchX + range * SCALE, y: this.launchY }
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
    const v0 = this.params.velocity ?? 20
    const angleDeg = this.params.angle ?? 45
    const angleRad = angleDeg * Math.PI / 180
    const g = this.params.gravity ?? 9.8

    clearCanvas(ctx, width, height)
    drawGrid(ctx, width, height)

    const groundY = this.launchY + 1
    const groundHighlighted = this.isHighlighted('ground')
    const groundPulse = groundHighlighted ? this.getHighlightPulse() : 0
    ctx.fillStyle = groundHighlighted ? `rgb(${15 + groundPulse * 50}, ${155 + groundPulse * 100}, ${88 + groundPulse * 50})` : '#0f9b58'
    ctx.fillRect(0, groundY, width, height - groundY)
    ctx.strokeStyle = groundHighlighted ? `rgba(${15 + groundPulse * 100}, ${155 + groundPulse * 100}, ${88 + groundPulse * 100}, ${0.5 + groundPulse * 0.5})` : '#0f9b5880'
    ctx.lineWidth = groundHighlighted ? 2 + groundPulse * 3 : 2
    ctx.beginPath()
    ctx.moveTo(0, groundY)
    ctx.lineTo(width, groundY)
    ctx.stroke()
    if (groundHighlighted) {
      ctx.save()
      ctx.shadowColor = '#10b981'
      ctx.shadowBlur = 15 + groundPulse * 25
      ctx.strokeStyle = `rgba(16, 185, 129, ${0.6 + groundPulse * 0.4})`
      ctx.lineWidth = 3 + groundPulse * 2
      ctx.beginPath()
      ctx.moveTo(0, groundY)
      ctx.lineTo(width, groundY)
      ctx.stroke()
      ctx.restore()
    }

    this.renderLauncher(ctx, v0, angleRad)

    drawLine(ctx, [this.maxHeightPoint, { x: this.maxHeightPoint.x, y: groundY }], 'rgba(251, 191, 36, 0.3)', 1)
    drawText(ctx, `H = ${projectileMaxHeight(v0, angleDeg, g).toFixed(1)}m`, this.maxHeightPoint.x + 6, this.maxHeightPoint.y - 6, '#fbbf24', 12)

    const trajHighlighted = this.isHighlighted('trajectory')
    const trajPulse = trajHighlighted ? this.getHighlightPulse() : 0
    if (this.trail.length > 1) {
      const trajColor = trajHighlighted ? `rgb(${0 + trajPulse * 100}, ${240 + trajPulse * 15}, ${255})` : TRAIL_COLOR
      if (trajHighlighted) {
        ctx.save()
        ctx.shadowColor = '#00f0ff'
        ctx.shadowBlur = 15 + trajPulse * 25
        ctx.strokeStyle = `rgba(0, 240, 255, ${0.6 + trajPulse * 0.4})`
        ctx.lineWidth = 4 + trajPulse * 3
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(this.trail[0].x, this.trail[0].y)
        for (let i = 1; i < this.trail.length; i++) {
          ctx.lineTo(this.trail[i].x, this.trail[i].y)
        }
        ctx.stroke()
        ctx.restore()
      }
      drawTrail(ctx, this.trail, trajColor, 0.9)
    }

    const projHighlighted = this.isHighlighted('projectile')
    const projPulse = projHighlighted ? this.getHighlightPulse() : 0
    const projGlowColor = projHighlighted ? `rgba(255, 107, 43, ${0.5 + projPulse * 0.5})` : `${LAUNCH_COLOR}80`
    const projStrokeColor = projHighlighted ? `rgb(${255 + projPulse * 0}, ${107 + projPulse * 100}, ${43 + projPulse * 100})` : '#fff'
    const projRadius = 10 + (projHighlighted ? projPulse * 5 : 0)
    drawCircle(ctx, this.currentPos.x, this.currentPos.y, projRadius, LAUNCH_COLOR, projStrokeColor, projGlowColor)
    if (projHighlighted) {
      ctx.save()
      ctx.shadowColor = '#ff6b2b'
      ctx.shadowBlur = 20 + projPulse * 30
      ctx.beginPath()
      ctx.arc(this.currentPos.x, this.currentPos.y, projRadius + projPulse * 8, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(255, 107, 43, ${0.6 + projPulse * 0.4})`
      ctx.lineWidth = 3 + projPulse * 3
      ctx.stroke()
      ctx.restore()
    }

    const range = projectileRange(v0, angleDeg, g)
    drawText(ctx, `R = ${range.toFixed(1)}m`, this.rangePoint.x, groundY + 24, '#fbbf24', 12, 'center')

    const infoX = width - 16
    drawText(ctx, `速度: ${v0.toFixed(1)} m/s`, infoX, 20, '#e2e8f0', 13, 'right')
    drawText(ctx, `角度: ${angleDeg}°`, infoX, 40, '#e2e8f0', 13, 'right')
    drawText(ctx, `高度: ${((this.launchY - this.currentPos.y) / SCALE).toFixed(1)} m`, infoX, 60, '#34d399', 13, 'right')
    drawText(ctx, `时间: ${this.time.toFixed(2)} s`, infoX, 80, '#00f0ff', 13, 'right')
  }

  private renderLauncher(ctx: CanvasRenderingContext2D, v0: number, angle: number): void {
    const lx = this.launchX
    const ly = this.launchY

    ctx.fillStyle = '#475569'
    ctx.fillRect(lx - 20, ly - 5, 40, 10)

    const velHighlighted = this.isHighlighted('velocity_vector')
    const velPulse = velHighlighted ? this.getHighlightPulse() : 0
    const len = 30 + v0
    const tipX = lx + Math.cos(angle) * len
    const tipY = ly - Math.sin(angle) * len
    const velColor = velHighlighted ? `rgb(${255 + velPulse * 0}, ${107 + velPulse * 100}, ${43 + velPulse * 100})` : LAUNCH_COLOR
    const velLineWidth = velHighlighted ? 3 + velPulse * 3 : 3
    if (velHighlighted) {
      ctx.save()
      ctx.shadowColor = '#ff6b2b'
      ctx.shadowBlur = 15 + velPulse * 25
      drawArrow(ctx, lx, ly, tipX, tipY, `rgba(255, 107, 43, ${0.6 + velPulse * 0.4})`, velLineWidth + 2)
      ctx.restore()
    }
    drawArrow(ctx, lx, ly, tipX, tipY, velColor, velLineWidth)

    const angleHighlighted = this.isHighlighted('angle')
    const anglePulse = angleHighlighted ? this.getHighlightPulse() : 0
    const angleColor = angleHighlighted ? `rgb(${251 + anglePulse * 4}, ${191 + anglePulse * 64}, ${36})` : 'rgba(251, 191, 36, 0.5)'
    const angleLineWidth = angleHighlighted ? 1.5 + anglePulse * 3 : 1.5
    const angleRadius = 35 + (angleHighlighted ? anglePulse * 5 : 0)
    if (angleHighlighted) {
      ctx.save()
      ctx.shadowColor = '#fbbf24'
      ctx.shadowBlur = 15 + anglePulse * 25
      ctx.strokeStyle = `rgba(251, 191, 36, ${0.6 + anglePulse * 0.4})`
      ctx.lineWidth = angleLineWidth + 2
      ctx.beginPath()
      ctx.arc(lx, ly, angleRadius + 3, -angle, 0)
      ctx.stroke()
      ctx.restore()
    }
    ctx.save()
    ctx.strokeStyle = angleColor
    ctx.lineWidth = angleLineWidth
    ctx.beginPath()
    ctx.arc(lx, ly, angleRadius, -angle, 0)
    ctx.stroke()
    ctx.restore()

    drawText(ctx, `${this.params.angle ?? 45}°`, lx + 40, ly - 8, angleHighlighted ? `rgb(${251 + anglePulse * 4}, ${191 + anglePulse * 64}, ${36})` : '#fbbf24', angleHighlighted ? 12 + anglePulse * 2 : 12)
    drawText(ctx, `v₀`, tipX + 6, tipY - 6, velColor, velHighlighted ? 14 + velPulse * 2 : 14)
  }

  handleDrag(event: DragEvent): DragResult {
    const lx = this.launchX
    const ly = this.launchY

    if (event.type === 'start') {
      const d = Math.hypot(event.x - lx, event.y - ly)
      if (d < 80) {
        this.isDragging = true
        return { handled: true }
      }
      return { handled: false }
    }

    if (event.type === 'move' && this.isDragging) {
      const dx = event.x - lx
      const dy = ly - event.y
      const newAngle = Math.max(0, Math.min(90, (Math.atan2(dy, Math.max(dx, 0)) * 180) / Math.PI))
      const newV0 = Math.max(1, Math.min(50, Math.hypot(dx, dy) / 2.5))
      return {
        handled: true,
        params: { ...this.params, angle: parseFloat(newAngle.toFixed(1)), velocity: parseFloat(newV0.toFixed(1)) }
      }
    }

    if (event.type === 'end' && this.isDragging) {
      this.isDragging = false
      this.time = 0
      this.trail = []
      this.isLaunched = false
      return { handled: true }
    }

    return { handled: false }
  }

  destroy(): void {
    this.ctx = null
    this.trail = []
  }

  getData(): EngineData {
    const v0 = this.params.velocity ?? 20
    const angle = (this.params.angle ?? 45) * Math.PI / 180
    const g = this.params.gravity ?? 9.8
    const pos = projectilePosition(v0, angle, g, this.time)
    return {
      time: this.time,
      primary: pos.y,
      secondary: pos.x,
    }
  }

  getFormulaWithValues(params: Record<string, number>): string {
    const v0 = params.velocity ?? 20
    const angle = params.angle ?? 45
    const g = params.gravity ?? 9.8
    const rad = angle * Math.PI / 180
    return `y = x \\tan(${angle}°) - \\frac{${g.toFixed(1)} x^2}{2 \\times ${v0.toFixed(1)}^2 \\cos^2(${angle}°)}`
  }
}
