import type { ExperimentEngine, DragEvent, DragResult, EngineData } from '../data/types'
import { clearCanvas, drawGrid, drawCircle, drawText } from '../utils/canvas'

interface Particle {
  type: 'A' | 'B' | 'C'
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
}

const GAS_CONSTANT = 8.314

export class ReactionEngine implements ExperimentEngine {
  private ctx: CanvasRenderingContext2D | null = null
  private width = 0
  private height = 0
  private params: Record<string, number> = {}
  private time = 0
  private particles: Particle[] = []
  private reactionCount = 0
  private reactionRate = 0
  private lastReactionTime = 0
  private rateHistory: { x: number; y: number }[] = []

  init(canvas: HTMLCanvasElement, params: Record<string, number>, width?: number, height?: number): void {
    this.ctx = canvas.getContext('2d')!
    this.width = width ?? canvas.width
    this.height = height ?? canvas.height
    this.params = { ...params }
    this.reactionCount = 0
    this.reactionRate = 0
    this.lastReactionTime = 0
    this.rateHistory = []
    this.initParticles()
  }

  private initParticles(): void {
    this.particles = []
    const countA = Math.floor(this.params.concentrationA ?? 20)
    const countB = Math.floor(this.params.concentrationB ?? 20)

    for (let i = 0; i < countA; i++) {
      this.particles.push(this.createParticle('A'))
    }
    for (let i = 0; i < countB; i++) {
      this.particles.push(this.createParticle('B'))
    }
  }

  private createParticle(type: 'A' | 'B' | 'C'): Particle {
    const temp = this.params.temperature ?? 300
    const speed = Math.sqrt((2 * temp) / 10) * 1.5
    const angle = Math.random() * Math.PI * 2
    const colorA = '#3b82f6'
    const colorB = '#ef4444'
    const colorC = '#22c55e'
    return {
      type,
      x: 60 + Math.random() * (this.width - 120),
      y: 60 + Math.random() * (this.height - 120),
      vx: Math.cos(angle) * speed * (0.5 + Math.random()),
      vy: Math.sin(angle) * speed * (0.5 + Math.random()),
      radius: type === 'C' ? 14 : 10,
      color: type === 'A' ? colorA : type === 'B' ? colorB : colorC,
    }
  }

  update(dt: number, params: Record<string, number>): void {
    this.time += dt
    this.params = { ...params }

    const countA = this.particles.filter(p => p.type === 'A').length
    const countB = this.particles.filter(p => p.type === 'B').length
    const targetA = Math.floor(params.concentrationA ?? 20)
    const targetB = Math.floor(params.concentrationB ?? 20)

    if (countA < targetA) {
      for (let i = countA; i < targetA; i++) {
        this.particles.push(this.createParticle('A'))
      }
    } else if (countA > targetA) {
      this.particles = this.particles.filter(p => p.type !== 'A').concat(
        this.particles.filter(p => p.type === 'A').slice(0, targetA),
        this.particles.filter(p => p.type === 'C')
      )
    }

    if (countB < targetB) {
      for (let i = countB; i < targetB; i++) {
        this.particles.push(this.createParticle('B'))
      }
    } else if (countB > targetB) {
      const aParticles = this.particles.filter(p => p.type === 'A')
      this.particles = aParticles.concat(
        this.particles.filter(p => p.type === 'B').slice(0, targetB),
        this.particles.filter(p => p.type === 'C')
      )
    }

    const temp = params.temperature ?? 300
    const speedFactor = Math.sqrt(temp / 300)
    const activationEnergy = params.activationEnergy ?? 50

    this.particles.forEach(p => {
      p.x += p.vx * dt * 60
      p.y += p.vy * dt * 60

      if (p.x - p.radius < 50) { p.x = 50 + p.radius; p.vx = Math.abs(p.vx) }
      if (p.x + p.radius > this.width - 50) { p.x = this.width - 50 - p.radius; p.vx = -Math.abs(p.vx) }
      if (p.y - p.radius < 50) { p.y = 50 + p.radius; p.vy = Math.abs(p.vy) }
      if (p.y + p.radius > this.height - 50) { p.y = this.height - 50 - p.radius; p.vy = -Math.abs(p.vy) }
    })

    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const p1 = this.particles[i]
        const p2 = this.particles[j]
        const dx = p2.x - p1.x
        const dy = p2.y - p1.y
        const dist = Math.hypot(dx, dy)
        const minDist = p1.radius + p2.radius

        if (dist < minDist && dist > 0) {
          if ((p1.type === 'A' && p2.type === 'B') || (p1.type === 'B' && p2.type === 'A')) {
            const relSpeed = Math.hypot(p1.vx - p2.vx, p1.vy - p2.vy)
            const kineticEnergy = 0.5 * relSpeed * relSpeed * 1000
            const arrheniusFactor = Math.exp(-activationEnergy / (GAS_CONSTANT * temp / 1000))

            if (Math.random() < arrheniusFactor * 0.3 * speedFactor) {
              const cx = (p1.x + p2.x) / 2
              const cy = (p1.y + p2.y) / 2
              this.particles = this.particles.filter(p => p !== p1 && p !== p2)
              const cParticle = this.createParticle('C')
              cParticle.x = cx
              cParticle.y = cy
              this.particles.push(cParticle)
              this.reactionCount++
              break
            }
          }

          const nx = dx / dist
          const ny = dy / dist
          const overlap = (minDist - dist) / 2
          p1.x -= nx * overlap
          p1.y -= ny * overlap
          p2.x += nx * overlap
          p2.y += ny * overlap

          const dvx = p1.vx - p2.vx
          const dvy = p1.vy - p2.vy
          const dvn = dvx * nx + dvy * ny
          if (dvn > 0) {
            p1.vx -= dvn * nx
            p1.vy -= dvn * ny
            p2.vx += dvn * nx
            p2.vy += dvn * ny
          }
        }
      }
    }

    if (this.time - this.lastReactionTime >= 0.5) {
      const rate = this.reactionCount / (this.time - this.lastReactionTime)
      this.reactionRate = rate
      this.rateHistory.push({ x: this.time, y: rate })
      if (this.rateHistory.length > 100) this.rateHistory = this.rateHistory.slice(-100)
      this.lastReactionTime = this.time
    }
  }

  render(): void {
    if (!this.ctx) return
    const ctx = this.ctx

    clearCanvas(ctx, this.width, this.height)
    drawGrid(ctx, this.width, this.height)

    ctx.save()
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'
    ctx.lineWidth = 2
    ctx.strokeRect(50, 50, this.width - 100, this.height - 100)
    ctx.restore()

    this.particles.forEach(p => {
      drawCircle(ctx, p.x, p.y, p.radius, p.color, 'rgba(255,255,255,0.4)', p.color)
    })

    const countA = this.particles.filter(p => p.type === 'A').length
    const countB = this.particles.filter(p => p.type === 'B').length
    const countC = this.particles.filter(p => p.type === 'C').length

    drawText(ctx, `[A] = ${countA}`, this.width - 130, 40, '#3b82f6', 14)
    drawText(ctx, `[B] = ${countB}`, this.width - 130, 65, '#ef4444', 14)
    drawText(ctx, `[C] = ${countC}`, this.width - 130, 90, '#22c55e', 14)
    drawText(ctx, `T = ${this.params.temperature ?? 300} K`, 30, 40, '#fbbf24', 14)
    drawText(ctx, `Ea = ${this.params.activationEnergy ?? 50} kJ/mol`, 30, 65, '#fbbf24', 14)
    drawText(ctx, `速率 v = ${this.reactionRate.toFixed(2)} /s`, 30, 90, '#00f0ff', 14)
    drawText(ctx, `A + B → C`, this.width / 2, 40, '#ffffff', 18, 'center')

    const maxY = Math.max(0.5, ...this.rateHistory.map(p => p.y))
    if (this.rateHistory.length > 1) {
      ctx.save()
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)'
      ctx.lineWidth = 2
      ctx.beginPath()
      const chartY = this.height - 80
      const chartHeight = 60
      const chartWidth = this.width - 120
      this.rateHistory.forEach((pt, i) => {
        const x = 60 + (i / (this.rateHistory.length - 1 || 1)) * chartWidth
        const y = chartY - (pt.y / maxY) * chartHeight
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()
      ctx.restore()
      drawText(ctx, `反应速率曲线`, this.width / 2, this.height - 30, '#22c55e', 12, 'center')
    }

    drawText(ctx, `点击容器切换反应`, this.width / 2, this.height - 50, '#64748b', 11, 'center')
  }

  handleDrag(event: DragEvent): DragResult {
    if (event.type === 'start') {
      if (event.x > 50 && event.x < this.width - 50 && event.y > 50 && event.y < this.height - 50) {
        this.reactionCount = 0
        this.lastReactionTime = this.time
        this.initParticles()
        return { handled: true }
      }
    }
    return { handled: false }
  }

  getData(): EngineData {
    return {
      time: this.time,
      primary: this.reactionRate,
      secondary: this.particles.filter(p => p.type === 'C').length,
    }
  }

  getFormulaWithValues(params: Record<string, number>): string {
    const T = params.temperature ?? 300
    const Ea = params.activationEnergy ?? 50
    const R = GAS_CONSTANT / 1000
    const k = Math.exp(-Ea / (R * T)).toFixed(4)
    return `v = ${k} \\cdot [A] \\cdot [B]`
  }

  destroy(): void {
    this.ctx = null
    this.particles = []
    this.rateHistory = []
  }
}
