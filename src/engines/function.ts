import type { ExperimentEngine, DragEvent, DragResult, EngineData } from '../data/types'
import { clearCanvas, drawGrid, drawArrow, drawLine, drawCircle, drawText, drawTrail } from '../utils/canvas'
import { quadraticValue, quadraticVertex } from '../utils/physics'

const UNIT = 40
const CURVE_COLOR = '#00ffcc'
const VERTEX_COLOR = '#ff8c00'
const AXIS_X_INTERSECT_COLOR = '#00ff88'
const AXIS_Y_INTERSECT_COLOR = '#ffdd00'

export class FunctionEngine implements ExperimentEngine {
  private ctx: CanvasRenderingContext2D | null = null
  private width: number = 0
  private height: number = 0
  private originX: number = 0
  private originY: number = 0
  private params: Record<string, number> = { a: 1, b: 0, c: 0 }
  private dragging: boolean = false
  private curvePoints: { x: number; y: number }[] = []
  private vertexCanvas: { x: number; y: number } = { x: 0, y: 0 }
  private vertexMath: { x: number; y: number } = { x: 0, y: 0 }
  private xIntersects: { x: number; y: number }[] = []
  private yIntersect: { x: number; y: number } = { x: 0, y: 0 }
  private discriminant: number = 0

  init(canvas: HTMLCanvasElement, params: Record<string, number>, width?: number, height?: number): void {
    this.ctx = canvas.getContext('2d')!
    this.width = width ?? canvas.width
    this.height = height ?? canvas.height
    this.originX = this.width / 2
    this.originY = this.height / 2
    this.params = { ...params }
  }

  update(_dt: number, params: Record<string, number>): void {
    this.params = { ...params }
    const a = params.a ?? 1
    const b = params.b ?? 0
    const c = params.c ?? 0

    if (a === 0) {
      this.curvePoints = []
      this.vertexMath = { x: 0, y: 0 }
      this.vertexCanvas = { x: 0, y: 0 }
      this.xIntersects = []
      this.yIntersect = this.toCanvas(0, c)
      this.discriminant = 0
      return
    }

    this.vertexMath = quadraticVertex(a, b, c)
    this.vertexCanvas = this.toCanvas(this.vertexMath.x, this.vertexMath.y)

    this.discriminant = b * b - 4 * a * c

    this.xIntersects = []
    if (this.discriminant >= 0) {
      const sqrtD = Math.sqrt(this.discriminant)
      const x1 = (-b + sqrtD) / (2 * a)
      const x2 = (-b - sqrtD) / (2 * a)
      this.xIntersects.push(this.toCanvas(x1, 0), this.toCanvas(x2, 0))
      if (Math.abs(x1 - x2) < 1e-9) {
        this.xIntersects = [this.toCanvas(x1, 0)]
      }
    }

    this.yIntersect = this.toCanvas(0, c)

    this.curvePoints = []
    for (let x = -10; x <= 10; x += 0.1) {
      const y = quadraticValue(a, b, c, x)
      this.curvePoints.push(this.toCanvas(x, y))
    }
  }

  render(): void {
    if (!this.ctx) return
    const ctx = this.ctx

    clearCanvas(ctx, this.width, this.height)
    drawGrid(ctx, this.width, this.height, UNIT)

    this.renderAxes(ctx)
    this.renderTicks(ctx)
    this.renderSymmetryAxis(ctx)
    this.renderCurve(ctx)
    this.renderXIntersects(ctx)
    this.renderYIntersect(ctx)
    this.renderVertex(ctx)
    this.renderInfo(ctx)
  }

  private renderAxes(ctx: CanvasRenderingContext2D): void {
    drawArrow(ctx, 0, this.originY, this.width, this.originY, '#ffffff', 2)
    drawArrow(ctx, this.originX, this.height, this.originX, 0, '#ffffff', 2)
  }

  private renderTicks(ctx: CanvasRenderingContext2D): void {
    const xMin = -Math.floor(this.originX / UNIT)
    const xMax = Math.floor((this.width - this.originX) / UNIT)
    const yMin = -Math.floor((this.height - this.originY) / UNIT)
    const yMax = Math.floor(this.originY / UNIT)

    ctx.strokeStyle = 'rgba(255,255,255,0.3)'
    ctx.lineWidth = 1
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'

    for (let i = xMin; i <= xMax; i++) {
      if (i === 0) continue
      const cx = this.originX + i * UNIT
      ctx.beginPath()
      ctx.moveTo(cx, this.originY - 4)
      ctx.lineTo(cx, this.originY + 4)
      ctx.stroke()
      ctx.fillText(String(i), cx, this.originY + 8)
    }

    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    for (let i = yMin; i <= yMax; i++) {
      if (i === 0) continue
      const cy = this.originY - i * UNIT
      ctx.beginPath()
      ctx.moveTo(this.originX - 4, cy)
      ctx.lineTo(this.originX + 4, cy)
      ctx.stroke()
      ctx.fillText(String(i), this.originX - 8, cy)
    }

    drawText(ctx, 'O', this.originX - 8, this.originY + 12, 'rgba(255,255,255,0.5)', 12, 'right')
    drawText(ctx, 'x', this.width - 12, this.originY + 14, '#ffffff', 14, 'right')
    drawText(ctx, 'y', this.originX + 14, 12, '#ffffff', 14, 'left')
  }

  private renderSymmetryAxis(ctx: CanvasRenderingContext2D): void {
    const a = this.params.a ?? 1
    if (a === 0) return
    const vx = this.vertexMath.x
    const cx = this.originX + vx * UNIT
    ctx.save()
    ctx.setLineDash([6, 4])
    ctx.strokeStyle = 'rgba(255,140,0,0.4)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(cx, 0)
    ctx.lineTo(cx, this.height)
    ctx.stroke()
    ctx.restore()
  }

  private renderCurve(ctx: CanvasRenderingContext2D): void {
    if (this.curvePoints.length < 2) return
    drawLine(ctx, this.curvePoints, CURVE_COLOR, 2.5, true)
  }

  private renderVertex(ctx: CanvasRenderingContext2D): void {
    const a = this.params.a ?? 1
    if (a === 0) return
    drawCircle(ctx, this.vertexCanvas.x, this.vertexCanvas.y, 6, VERTEX_COLOR, '#fff', VERTEX_COLOR)
    const label = `(${this.vertexMath.x.toFixed(2)}, ${this.vertexMath.y.toFixed(2)})`
    drawText(ctx, label, this.vertexCanvas.x + 12, this.vertexCanvas.y - 12, VERTEX_COLOR, 13, 'left')
  }

  private renderXIntersects(ctx: CanvasRenderingContext2D): void {
    for (const pt of this.xIntersects) {
      drawCircle(ctx, pt.x, pt.y, 5, AXIS_X_INTERSECT_COLOR, '#fff', AXIS_X_INTERSECT_COLOR)
    }
  }

  private renderYIntersect(ctx: CanvasRenderingContext2D): void {
    drawCircle(ctx, this.yIntersect.x, this.yIntersect.y, 5, AXIS_Y_INTERSECT_COLOR, '#fff', AXIS_Y_INTERSECT_COLOR)
  }

  private renderInfo(ctx: CanvasRenderingContext2D): void {
    const a = this.params.a ?? 1
    const b = this.params.b ?? 0
    const c = this.params.c ?? 0
    const padding = 16
    const lineHeight = 22
    const x = this.width - padding
    let y = padding + lineHeight

    ctx.save()
    ctx.fillStyle = 'rgba(10, 14, 23, 0.75)'
    ctx.beginPath()
    if (ctx.roundRect) {
      ctx.roundRect(x - 200, padding - 4, 208, lineHeight * 5 + 8, 6)
    }
    ctx.fill()
    ctx.restore()

    drawText(ctx, `y = ${a}x² + ${b}x + ${c}`, x - 8, y, '#e2e8f0', 13, 'right')
    y += lineHeight
    drawText(ctx, `a = ${a}`, x - 8, y, CURVE_COLOR, 13, 'right')
    y += lineHeight
    drawText(ctx, `b = ${b}`, x - 8, y, CURVE_COLOR, 13, 'right')
    y += lineHeight
    drawText(ctx, `c = ${c}`, x - 8, y, CURVE_COLOR, 13, 'right')
    y += lineHeight
    const dColor = this.discriminant > 0 ? '#00ff88' : this.discriminant === 0 ? '#ffdd00' : '#ff5555'
    drawText(ctx, `Δ = ${this.discriminant.toFixed(2)}`, x - 8, y, dColor, 13, 'right')
  }

  handleDrag(event: DragEvent): DragResult {
    if (event.type === 'start') {
      const dx = event.x - this.vertexCanvas.x
      const dy = event.y - this.vertexCanvas.y
      if (Math.sqrt(dx * dx + dy * dy) < 20) {
        this.dragging = true
        return { handled: true }
      }
      return { handled: false }
    }

    if (event.type === 'move' && this.dragging) {
      const mathPos = this.toMath(event.x, event.y)
      const a = this.params.a ?? 1
      if (Math.abs(a) < 0.01) return { handled: true }
      const newB = -2 * a * mathPos.x
      const newC = mathPos.y + (newB * newB) / (4 * a)
      return { handled: true, params: { ...this.params, b: parseFloat(newB.toFixed(2)), c: parseFloat(newC.toFixed(2)) } }
    }

    if (event.type === 'end') {
      this.dragging = false
    }

    return { handled: false }
  }

  destroy(): void {
    this.ctx = null
    this.curvePoints = []
    this.xIntersects = []
    this.dragging = false
  }

  getData(): EngineData {
    const a = this.params.a ?? 1
    const b = this.params.b ?? 0
    const c = this.params.c ?? 0
    return {
      time: 0,
      primary: this.vertexMath.y,
      secondary: this.discriminant,
    }
  }

  getFormulaWithValues(params: Record<string, number>): string {
    const a = params.a ?? 1
    const b = params.b ?? 0
    const c = params.c ?? 0
    const bStr = b >= 0 ? `+ ${b.toFixed(2)}` : `- ${Math.abs(b).toFixed(2)}`
    const cStr = c >= 0 ? `+ ${c.toFixed(2)}` : `- ${Math.abs(c).toFixed(2)}`
    return `y = ${a.toFixed(2)}x^2 ${bStr}x ${cStr}`
  }

  private toCanvas(mathX: number, mathY: number): { x: number; y: number } {
    return {
      x: this.originX + mathX * UNIT,
      y: this.originY - mathY * UNIT,
    }
  }

  private toMath(canvasX: number, canvasY: number): { x: number; y: number } {
    return {
      x: (canvasX - this.originX) / UNIT,
      y: (this.originY - canvasY) / UNIT,
    }
  }
}
