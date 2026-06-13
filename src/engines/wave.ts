import type { ExperimentEngine, DragEvent, DragResult, EngineData } from '@/data/types'
import { drawGrid, clearCanvas, drawText, drawLine, drawCircle } from '@/utils/canvas'
import { waveInterference } from '@/utils/physics'

export class WaveEngine implements ExperimentEngine {
  private ctx: CanvasRenderingContext2D | null = null
  private width = 0
  private height = 0
  private params: Record<string, number> = {}
  private time = 0
  private imageData: ImageData | null = null
  private dragging: 'top' | 'bottom' | null = null
  private halfW = 0
  private static readonly SLIT_HALF = 3
  private static readonly BARRIER_W = 8

  private get barrierX() { return this.width * 0.35 }
  private get centerY() { return this.height / 2 }

  init(canvas: HTMLCanvasElement, params: Record<string, number>, width?: number, height?: number): void {
    this.ctx = canvas.getContext('2d')!
    const cssW = width ?? canvas.width
    const cssH = height ?? canvas.height
    this.width = cssW
    this.height = cssH
    this.params = { ...params }
    const scaleX = canvas.width / cssW
    const scaleY = canvas.height / cssH
    this.halfW = Math.floor(cssW / 2)
    this._imgDataWidth = Math.floor(this.halfW * scaleX)
    this._imgDataHeight = Math.floor(cssH * scaleY)
    this.imageData = this.ctx.createImageData(this._imgDataWidth, this._imgDataHeight)
    this._pixelScale = { x: scaleX, y: scaleY }
  }

  private _pixelScale: { x: number; y: number } = { x: 1, y: 1 }
  private _imgDataWidth = 0
  private _imgDataHeight = 0

  update(dt: number, params: Record<string, number>): void {
    this.time += dt
    this.params = { ...params }
  }

  render(): void {
    if (!this.ctx) return
    const ctx = this.ctx
    const { width, height } = this
    const wavelength = this.params.wavelength ?? 50
    const slitDistance = this.params.slitDistance ?? 150
    const frequency = this.params.frequency ?? 2

    clearCanvas(ctx, width, height)
    drawGrid(ctx, width, height)

    const bx = this.barrierX
    const bw = WaveEngine.BARRIER_W
    const sw = WaveEngine.SLIT_HALF
    const slit1Y = this.centerY - slitDistance / 2
    const slit2Y = this.centerY + slitDistance / 2

    ctx.fillStyle = '#4a5568'
    ctx.fillRect(bx - bw / 2, 0, bw, slit1Y - sw)
    ctx.fillRect(bx - bw / 2, slit1Y + sw, bw, (slit2Y - sw) - (slit1Y + sw))
    ctx.fillRect(bx - bw / 2, slit2Y + sw, bw, height - (slit2Y + sw))

    drawCircle(ctx, bx, slit1Y, 5, '#00f0ff', undefined, '#00f0ff')
    drawCircle(ctx, bx, slit2Y, 5, '#00f0ff', undefined, '#00f0ff')
    drawText(ctx, '缝1', bx + 12, slit1Y - 10, '#00f0ff', 11)
    drawText(ctx, '缝2', bx + 12, slit2Y + 10, '#00f0ff', 11)

    const waveSpeed = wavelength * frequency
    const phase = (this.time * waveSpeed) % wavelength
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)'
    ctx.lineWidth = 1.5
    for (let x = phase; x < bx - bw / 2; x += wavelength) {
      if (x < 0) continue
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    this.renderInterferencePattern(wavelength, slitDistance)

    this.renderIntensityCurve(wavelength, slitDistance)

    drawText(ctx, `λ = ${wavelength} px`, 10, 20, '#00f0ff', 12)
    drawText(ctx, `d = ${slitDistance} px`, 10, 40, '#00f0ff', 12)
  }

  private renderInterferencePattern(wavelength: number, slitDistance: number): void {
    if (!this.ctx || !this.imageData) return
    const { halfW, barrierX: bx, centerY: cy } = this
    const data = this.imageData.data
    const breathe = 0.95 + 0.05 * Math.sin(this.time * 1.5)
    const { x: scaleX, y: scaleY } = this._pixelScale
    const imgW = this._imgDataWidth
    const imgH = this._imgDataHeight

    for (let py = 0; py < imgH; py++) {
      const screenY = (py / scaleY) - cy
      for (let px = 0; px < imgW; px++) {
        const screenX = (px / scaleX) + halfW - bx
        const idx = (py * imgW + px) * 4
        if (screenX <= 0) {
          data[idx] = 10
          data[idx + 1] = 14
          data[idx + 2] = 23
          data[idx + 3] = 255
          continue
        }
        const intensity = waveInterference(wavelength, slitDistance, screenX, screenY) * breathe
        data[idx] = Math.round(10 * (1 - intensity))
        data[idx + 1] = Math.round(14 + (240 - 14) * intensity)
        data[idx + 2] = Math.round(23 + (255 - 23) * intensity)
        data[idx + 3] = 255
      }
    }

    this.ctx.putImageData(this.imageData, halfW * scaleX, 0)
  }

  private renderIntensityCurve(wavelength: number, slitDistance: number): void {
    if (!this.ctx) return
    const { height, barrierX: bx, halfW } = this
    const screenX = halfW - bx + halfW * 0.5
    const curveBase = this.width - 35
    const points: { x: number; y: number }[] = []

    for (let py = 0; py < height; py += 2) {
      const screenY = py - this.centerY
      const intensity = waveInterference(wavelength, slitDistance, screenX, screenY)
      points.push({ x: curveBase - intensity * 30, y: py })
    }

    drawLine(this.ctx, points, '#ff6b6b', 2, true)
  }

  handleDrag(event: DragEvent): DragResult {
    const slitDistance = this.params.slitDistance ?? 150
    const slit1Y = this.centerY - slitDistance / 2
    const slit2Y = this.centerY + slitDistance / 2
    const bx = this.barrierX

    if (event.type === 'start') {
      const d1 = Math.hypot(event.x - bx, event.y - slit1Y)
      const d2 = Math.hypot(event.x - bx, event.y - slit2Y)
      if (d1 < 25) this.dragging = 'top'
      else if (d2 < 25) this.dragging = 'bottom'
      return { handled: this.dragging !== null }
    } else if (event.type === 'move' && this.dragging) {
      const offset = this.dragging === 'top'
        ? 2 * (this.centerY - event.y)
        : 2 * (event.y - this.centerY)
      const newDist = Math.max(50, Math.min(300, Math.abs(offset)))
      this.params.slitDistance = newDist
      return { handled: true, params: { ...this.params, slitDistance: newDist } }
    } else if (event.type === 'end') {
      this.dragging = null
    }
    return { handled: false }
  }

  destroy(): void {
    this.ctx = null
    this.imageData = null
    this.dragging = null
  }

  getData(): EngineData {
    const frequency = this.params.frequency ?? 2
    const amplitude = this.params.amplitude ?? 40
    const intensity = Math.sin(2 * Math.PI * frequency * this.time) * amplitude
    return {
      time: this.time,
      primary: intensity,
      secondary: Math.abs(intensity),
    }
  }

  getFormulaWithValues(params: Record<string, number>): string {
    const wavelength = params.wavelength ?? 50
    const slitDistance = params.slitDistance ?? 150
    return `I = 4I_0 \\cos^2\\left(\\frac{\\pi \\times ${slitDistance} \\times \\sin\\theta}{${wavelength}}\\right)`
  }
}
