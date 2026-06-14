import type { ExperimentEngine, DragEvent, DragResult, EngineData, HighlightElementType } from '../data/types'
import { clearCanvas, drawGrid, drawCircle, drawText, drawArrow } from '../utils/canvas'

const ATOM_COLORS: Record<string, { color: string; radius: number; label: string }> = {
  C: { color: '#1a1a1a', radius: 22, label: 'C' },
  H: { color: '#ffffff', radius: 14, label: 'H' },
  O: { color: '#ef4444', radius: 20, label: 'O' },
  N: { color: '#3b82f6', radius: 19, label: 'N' },
}

interface Atom3D {
  symbol: string
  x: number
  y: number
  z: number
}

const MOLECULE_PRESETS = [
  { name: 'H₂O', formula: 'H_2O', atoms: (len: number, angle: number): Atom3D[] => [
    { symbol: 'O', x: 0, y: 0, z: 0 },
    { symbol: 'H', x: Math.cos(angle / 2) * len, y: Math.sin(angle / 2) * len, z: 0 },
    { symbol: 'H', x: Math.cos(angle / 2) * len, y: -Math.sin(angle / 2) * len, z: 0 },
  ]},
  { name: 'CO₂', formula: 'CO_2', atoms: (len: number, angle: number): Atom3D[] => [
    { symbol: 'C', x: 0, y: 0, z: 0 },
    { symbol: 'O', x: len, y: 0, z: 0 },
    { symbol: 'O', x: -len, y: 0, z: 0 },
  ]},
  { name: 'CH₄', formula: 'CH_4', atoms: (len: number, angle: number): Atom3D[] => [
    { symbol: 'C', x: 0, y: 0, z: 0 },
    { symbol: 'H', x: len * 0.6, y: len * 0.6, z: len * 0.6 },
    { symbol: 'H', x: -len * 0.6, y: -len * 0.6, z: len * 0.6 },
    { symbol: 'H', x: len * 0.6, y: -len * 0.6, z: -len * 0.6 },
    { symbol: 'H', x: -len * 0.6, y: len * 0.6, z: -len * 0.6 },
  ]},
  { name: 'NH₃', formula: 'NH_3', atoms: (len: number, angle: number): Atom3D[] => [
    { symbol: 'N', x: 0, y: 0, z: 0 },
    { symbol: 'H', x: len, y: 0, z: 0 },
    { symbol: 'H', x: len * Math.cos(angle * Math.PI / 180), y: len * Math.sin(angle * Math.PI / 180), z: 0 },
    { symbol: 'H', x: len * Math.cos((360 - angle) * Math.PI / 180), y: len * Math.sin((360 - angle) * Math.PI / 180), z: 0 },
  ]},
]

export class MoleculeEngine implements ExperimentEngine {
  private ctx: CanvasRenderingContext2D | null = null
  private width = 0
  private height = 0
  private params: Record<string, number> = {}
  private time = 0
  private isDragging = false
  private lastX = 0
  private rotation = 0
  private atoms: Atom3D[] = []
  private highlightElement: HighlightElementType | null = null
  private highlightTime = 0

  init(canvas: HTMLCanvasElement, params: Record<string, number>, width?: number, height?: number): void {
    this.ctx = canvas.getContext('2d')!
    this.width = width ?? canvas.width
    this.height = height ?? canvas.height
    this.params = { ...params }
    this.updateAtoms()
  }

  update(dt: number, params: Record<string, number>): void {
    this.time += dt
    this.params = { ...params }
    if (this.highlightElement) {
      this.highlightTime += dt
    } else {
      this.highlightTime = 0
    }
    this.rotation = (params.rotationY ?? 0) * Math.PI / 180
    this.updateAtoms()
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

  private updateAtoms(): void {
    const type = Math.floor(this.params.moleculeType ?? 0)
    const len = this.params.bondLength ?? 80
    const angle = (this.params.bondAngle ?? 104.5) * Math.PI / 180
    const preset = MOLECULE_PRESETS[Math.max(0, Math.min(MOLECULE_PRESETS.length - 1, type))]
    this.atoms = preset.atoms(len, angle)
  }

  private project(atom: Atom3D): { x: number; y: number; depth: number } {
    const cosR = Math.cos(this.rotation)
    const sinR = Math.sin(this.rotation)
    const rx = atom.x * cosR - atom.z * sinR
    const rz = atom.x * sinR + atom.z * cosR
    const scale = 800 / (800 + rz)
    return {
      x: this.width / 2 + rx * scale,
      y: this.height / 2 + atom.y * scale,
      depth: rz,
    }
  }

  render(): void {
    if (!this.ctx) return
    const ctx = this.ctx

    clearCanvas(ctx, this.width, this.height)
    drawGrid(ctx, this.width, this.height)

    const projected = this.atoms.map((a) => ({ ...this.project(a), atom: a }))
    projected.sort((a, b) => a.depth - b.depth)

    const bondHighlighted = this.isHighlighted('bond') || this.isHighlighted('molecule')
    const bondPulse = bondHighlighted ? this.getHighlightPulse() : 0
    const atomHighlighted = this.isHighlighted('atom') || this.isHighlighted('molecule')
    const atomPulse = atomHighlighted ? this.getHighlightPulse() : 0

    for (let i = 0; i < this.atoms.length; i++) {
      for (let j = i + 1; j < this.atoms.length; j++) {
        const p1 = projected.find((p) => p.atom === this.atoms[i])!
        const p2 = projected.find((p) => p.atom === this.atoms[j])!
        const avgDepth = (p1.depth + p2.depth) / 2
        const alpha = Math.max(0.3, Math.min(1, 800 / (800 + avgDepth)))
        ctx.save()
        ctx.strokeStyle = bondHighlighted ? `rgb(${0 + bondPulse * 255}, ${240 + bondPulse * 15}, ${255})` : `rgba(148, 163, 184, ${alpha})`
        ctx.lineWidth = bondHighlighted ? Math.max(2, 6 * alpha) + bondPulse * 4 : Math.max(2, 6 * alpha)
        if (bondHighlighted) {
          ctx.shadowColor = '#00f0ff'
          ctx.shadowBlur = 15 + bondPulse * 25
        }
        ctx.beginPath()
        ctx.moveTo(p1.x, p1.y)
        ctx.lineTo(p2.x, p2.y)
        ctx.stroke()
        ctx.restore()
      }
    }

    projected.forEach(({ x, y, depth, atom }) => {
      const atomDef = ATOM_COLORS[atom.symbol]
      const scale = Math.max(0.6, Math.min(1.2, 800 / (800 + depth)))
      const r = atomDef.radius * scale + (atomHighlighted ? atomPulse * 5 : 0)
      const color = atomHighlighted ? `rgb(${59 + atomPulse * 100}, ${130 + atomPulse * 100}, ${246})` : (depth < 0 ? atomDef.color : atomDef.color)
      const glowColor = atomHighlighted ? `rgba(59, 130, 246, ${0.5 + atomPulse * 0.5})` : (depth < 0 ? `rgba(255,255,255,0.5)` : `rgba(0,0,0,0.3)`)
      ctx.save()
      ctx.shadowColor = glowColor
      ctx.shadowBlur = atomHighlighted ? 25 + atomPulse * 35 : 15 * scale
      drawCircle(ctx, x, y, r, color, atomHighlighted ? `rgb(${59 + atomPulse * 100}, ${130 + atomPulse * 100}, ${246})` : 'rgba(255,255,255,0.2)')
      ctx.restore()
      if (atomHighlighted) {
        ctx.save()
        ctx.shadowColor = '#3b82f6'
        ctx.shadowBlur = 25 + atomPulse * 35
        ctx.beginPath()
        ctx.arc(x, y, r + atomPulse * 8, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(59, 130, 246, ${0.6 + atomPulse * 0.4})`
        ctx.lineWidth = 3 + atomPulse * 3
        ctx.stroke()
        ctx.restore()
      }
      drawText(ctx, atomDef.label, x, y, atom.symbol === 'H' ? '#000' : '#fff', Math.max(10, 14 * scale), 'center')
    })

    const preset = MOLECULE_PRESETS[Math.max(0, Math.min(MOLECULE_PRESETS.length - 1, Math.floor(this.params.moleculeType ?? 0)))]
    drawText(ctx, preset.name, this.width / 2, 60, '#00f0ff', 28, 'center')
    drawText(ctx, `键长: ${this.params.bondLength ?? 80} px`, 30, 40, '#94a3b8', 14)
    drawText(ctx, `键角: ${(this.params.bondAngle ?? 104.5).toFixed(1)}°`, 30, 65, '#94a3b8', 14)
    drawText(ctx, `旋转: ${(this.params.rotationY ?? 0).toFixed(0)}°`, 30, 90, '#94a3b8', 14)
    drawText(ctx, `拖拽分子可旋转`, this.width / 2, this.height - 30, '#64748b', 12, 'center')
  }

  handleDrag(event: DragEvent): DragResult {
    if (event.type === 'start') {
      const cx = this.width / 2
      const cy = this.height / 2
      const d = Math.hypot(event.x - cx, event.y - cy)
      if (d < 250) {
        this.isDragging = true
        this.lastX = event.x
        return { handled: true }
      }
      return { handled: false }
    }

    if (event.type === 'move' && this.isDragging) {
      const dx = event.x - this.lastX
      this.lastX = event.x
      let newRot = (this.params.rotationY ?? 0) + dx * 0.5
      newRot = ((newRot % 360) + 360) % 360
      return {
        handled: true,
        params: { ...this.params, rotationY: parseFloat(newRot.toFixed(1)) }
      }
    }

    if (event.type === 'end') {
      this.isDragging = false
    }

    return { handled: false }
  }

  getData(): EngineData {
    return {
      time: this.time,
      primary: this.params.bondAngle ?? 104.5,
      secondary: this.params.bondLength ?? 80,
    }
  }

  getFormulaWithValues(params: Record<string, number>): string {
    const len = params.bondLength ?? 80
    const angle = params.bondAngle ?? 104.5
    return `d = ${len.toFixed(0)} \\text{ px}, \\quad \\theta = ${angle.toFixed(1)}°`
  }

  destroy(): void {
    this.ctx = null
    this.atoms = []
    this.isDragging = false
  }
}
