import type { ExperimentEngine, DragEvent, DragResult, EngineData, HighlightElementType } from '../data/types'
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
  private highlightElement: HighlightElementType | null = null
  private highlightTime = 0

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
    if (this.highlightElement) {
      this.highlightTime += dt
    } else {
      this.highlightTime = 0
    }
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

    clearCanvas(ctx, this.width, this.height)
    drawGrid(ctx, this.width, this.height)

    const containerHighlighted = this.isHighlighted('container')
    const containerPulse = containerHighlighted ? this.getHighlightPulse() : 0
    ctx.save()
    ctx.strokeStyle = containerHighlighted ? `rgba(255, 255, 255, ${0.3 + containerPulse * 0.5})` : 'rgba(255,255,255,0.3)'
    ctx.lineWidth = containerHighlighted ? 2 + containerPulse * 3 : 2
    ctx.strokeRect(50, 50, this.width - 100, this.height - 100)
    if (containerHighlighted) {
      ctx.shadowColor = '#ffffff'
      ctx.shadowBlur = 15 + containerPulse * 25
      ctx.strokeRect(50, 50, this.width - 100, this.height - 100)
    }
    ctx.restore()

    const reactantAHighlighted = this.isHighlighted('reactant_a')
    const reactantAPulse = reactantAHighlighted ? this.getHighlightPulse() : 0
    const reactantBHighlighted = this.isHighlighted('reactant_b')
    const reactantBPulse = reactantBHighlighted ? this.getHighlightPulse() : 0
    const productHighlighted = this.isHighlighted('product')
    const productPulse = productHighlighted ? this.getHighlightPulse() : 0

    this.particles.forEach(p => {
      let fillColor = p.color
      let strokeColor = 'rgba(255,255,255,0.4)'
      let glowColor = p.color
      let radius = p.radius

      if (p.type === 'A' && reactantAHighlighted) {
        fillColor = `rgb(${59 + reactantAPulse * 100}, ${130 + reactantAPulse * 100}, ${246})`
        strokeColor = `rgba(59, 130, 246, ${0.5 + reactantAPulse * 0.5})`
        glowColor = `rgba(59, 130, 246, ${0.5 + reactantAPulse * 0.5})`
        radius = p.radius + reactantAPulse * 5
      } else if (p.type === 'B' && reactantBHighlighted) {
        fillColor = `rgb(${239 + reactantBPulse * 16}, ${68 + reactantBPulse * 68}, ${68})`
        strokeColor = `rgba(239, 68, 68, ${0.5 + reactantBPulse * 0.5})`
        glowColor = `rgba(239, 68, 68, ${0.5 + reactantBPulse * 0.5})`
        radius = p.radius + reactantBPulse * 5
      } else if (p.type === 'C' && productHighlighted) {
        fillColor = `rgb(${34 + productPulse * 100}, ${197 + productPulse * 58}, ${94})`
        strokeColor = `rgba(34, 197, 94, ${0.5 + productPulse * 0.5})`
        glowColor = `rgba(34, 197, 94, ${0.5 + productPulse * 0.5})`
        radius = p.radius + productPulse * 5
      }

      drawCircle(ctx, p.x, p.y, radius, fillColor, strokeColor, glowColor)

      if ((p.type === 'A' && reactantAHighlighted) || (p.type === 'B' && reactantBHighlighted) || (p.type === 'C' && productHighlighted)) {
        const pulse = p.type === 'A' ? reactantAPulse : p.type === 'B' ? reactantBPulse : productPulse
        const shadowColor = p.type === 'A' ? '#3b82f6' : p.type === 'B' ? '#ef4444' : '#22c55e'
        ctx.save()
        ctx.shadowColor = shadowColor
        ctx.shadowBlur = 20 + pulse * 30
        ctx.beginPath()
        ctx.arc(p.x, p.y, radius + pulse * 8, 0, Math.PI * 2)
        ctx.strokeStyle = `${shadowColor}${Math.floor((0.6 + pulse * 0.4) * 255).toString(16).padStart(2, '0')}`
        ctx.lineWidth = 3 + pulse * 3
        ctx.stroke()
        ctx.restore()
      }
    })

    const energyBarrierHighlighted = this.isHighlighted('energy_barrier')
    const energyBarrierPulse = energyBarrierHighlighted ? this.getHighlightPulse() : 0
    const ebX = this.width - 180
    const ebY = this.height - 160
    const ebW = 130
    const ebH = 70
    const activationEnergy = this.params.activationEnergy ?? 50
    const ebPeakHeight = (activationEnergy / 100) * ebH * 0.8 + ebH * 0.2

    ctx.save()
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)'
    ctx.fillRect(ebX - 10, ebY - 25, ebW + 20, ebH + 40)
    ctx.strokeStyle = energyBarrierHighlighted ? `rgba(168, 85, 247, ${0.3 + energyBarrierPulse * 0.4})` : 'rgba(168, 85, 247, 0.2)'
    ctx.lineWidth = energyBarrierHighlighted ? 1 + energyBarrierPulse : 1
    ctx.strokeRect(ebX - 10, ebY - 25, ebW + 20, ebH + 40)
    ctx.restore()

    drawText(ctx, '能量势垒', ebX + ebW / 2, ebY - 10, energyBarrierHighlighted ? `rgb(${168 + energyBarrierPulse * 87}, ${85 + energyBarrierPulse * 100}, ${247})` : '#a855f7', 11, 'center')

    ctx.save()
    const ebColor = energyBarrierHighlighted ? `rgb(${168 + energyBarrierPulse * 87}, ${85 + energyBarrierPulse * 100}, ${247})` : '#a855f7'
    const ebLineWidth = energyBarrierHighlighted ? 2 + energyBarrierPulse * 2 : 2
    ctx.strokeStyle = ebColor
    ctx.lineWidth = ebLineWidth
    ctx.beginPath()
    ctx.moveTo(ebX, ebY + ebH - 10)
    ctx.quadraticCurveTo(ebX + ebW * 0.5, ebY + ebH - ebPeakHeight - 10, ebX + ebW, ebY + ebH - 20)
    ctx.stroke()

    ctx.fillStyle = energyBarrierHighlighted ? `rgba(59, 130, 247, ${0.6 + energyBarrierPulse * 0.4})` : 'rgba(59, 130, 247, 0.6)'
    ctx.fillRect(ebX - 5, ebY + ebH - 15, 15, 15)
    ctx.fillStyle = energyBarrierHighlighted ? `rgba(34, 197, 94, ${0.6 + energyBarrierPulse * 0.4})` : 'rgba(34, 197, 94, 0.6)'
    ctx.fillRect(ebX + ebW - 10, ebY + ebH - 25, 15, 15)

    if (energyBarrierHighlighted) {
      ctx.shadowColor = '#a855f7'
      ctx.shadowBlur = 15 + energyBarrierPulse * 25
      ctx.strokeStyle = `rgba(168, 85, 247, ${0.6 + energyBarrierPulse * 0.4})`
      ctx.lineWidth = ebLineWidth + 2
      ctx.beginPath()
      ctx.moveTo(ebX, ebY + ebH - 10)
      ctx.quadraticCurveTo(ebX + ebW * 0.5, ebY + ebH - ebPeakHeight - 10, ebX + ebW, ebY + ebH - 20)
      ctx.stroke()
    }
    ctx.restore()

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
