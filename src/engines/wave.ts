import type { ExperimentEngine, DragEvent, DragResult, EngineData, HighlightElementType } from '@/data/types'
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
  private highlightElement: HighlightElementType | null = null
  private highlightTime = 0
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
    if (this.highlightElement) {
      this.highlightTime += dt
    } else {
      this.highlightTime = 0
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

    const waveSourceHighlighted = this.isHighlighted('wave_source')
    const waveSourcePulse = waveSourceHighlighted ? this.getHighlightPulse() : 0
    if (waveSourceHighlighted) {
      ctx.save()
      ctx.shadowColor = '#00f0ff'
      ctx.shadowBlur = 20 + waveSourcePulse * 30
      ctx.fillStyle = `rgba(0, 240, 255, ${0.1 + waveSourcePulse * 0.2})`
      ctx.fillRect(0, 0, bx - bw / 2, height)
      ctx.restore()
      ctx.save()
      ctx.shadowColor = '#00f0ff'
      ctx.shadowBlur = 15 + waveSourcePulse * 25
      ctx.strokeStyle = `rgba(0, 240, 255, ${0.5 + waveSourcePulse * 0.5})`
      ctx.lineWidth = 3 + waveSourcePulse * 3
      ctx.strokeRect(0, 0, bx - bw / 2, height)
      ctx.restore()
    }

    const slitHighlighted = this.isHighlighted('slit')
    const slitPulse = slitHighlighted ? this.getHighlightPulse() : 0
    ctx.fillStyle = slitHighlighted ? `rgb(${74 + slitPulse * 100}, ${85 + slitPulse * 100}, ${104 + slitPulse * 100})` : '#4a5568'
    ctx.fillRect(bx - bw / 2, 0, bw, slit1Y - sw)
    ctx.fillRect(bx - bw / 2, slit1Y + sw, bw, (slit2Y - sw) - (slit1Y + sw))
    ctx.fillRect(bx - bw / 2, slit2Y + sw, bw, height - (slit2Y + sw))
    if (slitHighlighted) {
      ctx.save()
      ctx.shadowColor = '#00f0ff'
      ctx.shadowBlur = 20 + slitPulse * 30
      ctx.strokeStyle = `rgba(0, 240, 255, ${0.5 + slitPulse * 0.5})`
      ctx.lineWidth = 3 + slitPulse * 2
      ctx.strokeRect(bx - bw / 2, 0, bw, slit1Y - sw)
      ctx.strokeRect(bx - bw / 2, slit1Y + sw, bw, (slit2Y - sw) - (slit1Y + sw))
      ctx.strokeRect(bx - bw / 2, slit2Y + sw, bw, height - (slit2Y + sw))
      ctx.restore()
    }

    const slitCircleColor = slitHighlighted ? `rgb(${0 + slitPulse * 255}, ${240 + slitPulse * 15}, ${255})` : '#00f0ff'
    const slitCircleGlow = slitHighlighted ? `rgba(0, 240, 255, ${0.5 + slitPulse * 0.5})` : '#00f0ff'
    drawCircle(ctx, bx, slit1Y, 5 + (slitHighlighted ? slitPulse * 3 : 0), slitCircleColor, undefined, slitCircleGlow)
    drawCircle(ctx, bx, slit2Y, 5 + (slitHighlighted ? slitPulse * 3 : 0), slitCircleColor, undefined, slitCircleGlow)
    const slitTextColor = slitHighlighted ? `rgb(${0 + slitPulse * 255}, ${240 + slitPulse * 15}, ${255})` : '#00f0ff'
    const slitTextSize = slitHighlighted ? 11 + slitPulse * 2 : 11
    drawText(ctx, '缝1', bx + 12, slit1Y - 10, slitTextColor, slitTextSize)
    drawText(ctx, '缝2', bx + 12, slit2Y + 10, slitTextColor, slitTextSize)

    const waveSpeed = wavelength * frequency
    const phase = (this.time * waveSpeed) % wavelength

    const waveFrontHighlighted = this.isHighlighted('wave_front')
    const waveFrontPulse = waveFrontHighlighted ? this.getHighlightPulse() : 0
    const waveFrontColor = waveFrontHighlighted ? `rgba(0, 240, 255, ${0.3 + waveFrontPulse * 0.5})` : 'rgba(0, 240, 255, 0.3)'
    const waveFrontLineWidth = waveFrontHighlighted ? 1.5 + waveFrontPulse * 3 : 1.5
    if (waveFrontHighlighted) {
      ctx.save()
      ctx.shadowColor = '#00f0ff'
      ctx.shadowBlur = 15 + waveFrontPulse * 25
      ctx.strokeStyle = `rgba(0, 240, 255, ${0.6 + waveFrontPulse * 0.4})`
      ctx.lineWidth = waveFrontLineWidth + 2
      for (let x = phase; x < bx - bw / 2; x += wavelength) {
        if (x < 0) continue
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }
      ctx.restore()
    }
    ctx.strokeStyle = waveFrontColor
    ctx.lineWidth = waveFrontLineWidth
    for (let x = phase; x < bx - bw / 2; x += wavelength) {
      if (x < 0) continue
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    const screenHighlighted = this.isHighlighted('screen')
    const screenPulse = screenHighlighted ? this.getHighlightPulse() : 0
    if (screenHighlighted) {
      ctx.save()
      ctx.shadowColor = '#00f0ff'
      ctx.shadowBlur = 20 + screenPulse * 30
      ctx.strokeStyle = `rgba(0, 240, 255, ${0.5 + screenPulse * 0.5})`
      ctx.lineWidth = 3 + screenPulse * 3
      ctx.strokeRect(this.halfW, 0, width - this.halfW, height)
      ctx.restore()
    }

    const interferenceHighlighted = this.isHighlighted('interference_pattern')
    const interferencePulse = interferenceHighlighted ? this.getHighlightPulse() : 0
    this.renderInterferencePattern(wavelength, slitDistance, interferenceHighlighted, interferencePulse)

    this.renderIntensityCurve(wavelength, slitDistance)

    drawText(ctx, `λ = ${wavelength} px`, 10, 20, '#00f0ff', 12)
    drawText(ctx, `d = ${slitDistance} px`, 10, 40, '#00f0ff', 12)
  }

  private renderInterferencePattern(wavelength: number, slitDistance: number, highlighted: boolean, pulse: number): void {
    if (!this.ctx || !this.imageData) return
    const { halfW, barrierX: bx, centerY: cy } = this
    const data = this.imageData.data
    const breathe = 0.95 + 0.05 * Math.sin(this.time * 1.5)
    const { x: scaleX, y: scaleY } = this._pixelScale
    const imgW = this._imgDataWidth
    const imgH = this._imgDataHeight

    const intensityBoost = highlighted ? 1 + pulse * 0.5 : 1
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
        const intensity = Math.min(1, waveInterference(wavelength, slitDistance, screenX, screenY) * breathe * intensityBoost)
        data[idx] = Math.round(10 * (1 - intensity))
        data[idx + 1] = Math.round(14 + (240 - 14) * intensity)
        data[idx + 2] = Math.round(23 + (255 - 23) * intensity)
        data[idx + 3] = 255
      }
    }

    this.ctx.putImageData(this.imageData, halfW * scaleX, 0)

    if (highlighted) {
      const ctx = this.ctx
      ctx.save()
      ctx.shadowColor = '#00f0ff'
      ctx.shadowBlur = 25 + pulse * 35
      ctx.fillStyle = `rgba(0, 240, 255, ${0.05 + pulse * 0.1})`
      ctx.fillRect(halfW, 0, this.width - halfW, this.height)
      ctx.restore()
      ctx.save()
      ctx.shadowColor = '#00f0ff'
      ctx.shadowBlur = 15 + pulse * 25
      ctx.strokeStyle = `rgba(0, 240, 255, ${0.6 + pulse * 0.4})`
      ctx.lineWidth = 2 + pulse * 3
      for (let i = 0; i < 3; i++) {
        const offset = pulse * 10 + i * 8
        ctx.globalAlpha = 0.5 - i * 0.15
        ctx.strokeRect(halfW + offset, offset, this.width - halfW - offset * 2, this.height - offset * 2)
      }
      ctx.restore()
    }
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
