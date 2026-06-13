import type { ExperimentEngine, DragEvent, DragResult, EngineData } from '../data/types'
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
    ctx.fillStyle = '#0f9b58'
    ctx.fillRect(0, groundY, width, height - groundY)
    ctx.strokeStyle = '#0f9b5880'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, groundY)
    ctx.lineTo(width, groundY)
    ctx.stroke()

    this.renderLauncher(ctx, v0, angleRad)

    drawLine(ctx, [this.maxHeightPoint, { x: this.maxHeightPoint.x, y: groundY }], 'rgba(251, 191, 36, 0.3)', 1)
    drawText(ctx, `H = ${projectileMaxHeight(v0, angleDeg, g).toFixed(1)}m`, this.maxHeightPoint.x + 6, this.maxHeightPoint.y - 6, '#fbbf24', 12)

    if (this.trail.length > 1) {
      drawTrail(ctx, this.trail, TRAIL_COLOR, 0.9)
    }

    drawCircle(ctx, this.currentPos.x, this.currentPos.y, 10, LAUNCH_COLOR, '#fff', LAUNCH_COLOR)

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

    const len = 30 + v0
    const tipX = lx + Math.cos(angle) * len
    const tipY = ly - Math.sin(angle) * len
    drawArrow(ctx, lx, ly, tipX, tipY, LAUNCH_COLOR, 3)

    ctx.save()
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(lx, ly, 35, -angle, 0)
    ctx.stroke()
    ctx.restore()

    drawText(ctx, `${this.params.angle ?? 45}°`, lx + 40, ly - 8, '#fbbf24', 12)
    drawText(ctx, `v₀`, tipX + 6, tipY - 6, LAUNCH_COLOR, 14)
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
