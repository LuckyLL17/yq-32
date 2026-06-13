import { create } from 'zustand'

export type PartType =
  | 'ball'
  | 'block'
  | 'ground'
  | 'wall'
  | 'spring'
  | 'pulley'
  | 'rope'
  | 'inclined-plane'

export interface BasePart {
  id: string
  type: PartType
  x: number
  y: number
  rotation: number
  locked: boolean
  draggable: boolean
  label?: string
}

export interface BallPart extends BasePart {
  type: 'ball'
  radius: number
  mass: number
  vx: number
  vy: number
  restitution: number
  color: string
}

export interface BlockPart extends BasePart {
  type: 'block'
  width: number
  height: number
  mass: number
  vx: number
  vy: number
  angularVel: number
  restitution: number
  color: string
}

export interface GroundPart extends BasePart {
  type: 'ground'
  width: number
  height: number
  color: string
}

export interface WallPart extends BasePart {
  type: 'wall'
  width: number
  height: number
  color: string
}

export interface SpringPart extends BasePart {
  type: 'spring'
  anchorId: string | null
  targetId: string | null
  restLength: number
  stiffness: number
  damping: number
  anchorOffsetX: number
  anchorOffsetY: number
  targetOffsetX: number
  targetOffsetY: number
}

export interface PulleyPart extends BasePart {
  type: 'pulley'
  radius: number
  connectedA: string | null
  connectedB: string | null
  ropeLength: number
}

export interface RopePart extends BasePart {
  type: 'rope'
  anchorId: string | null
  targetId: string | null
  length: number
  anchorOffsetX: number
  anchorOffsetY: number
  targetOffsetX: number
  targetOffsetY: number
}

export interface InclinedPlanePart extends BasePart {
  type: 'inclined-plane'
  width: number
  height: number
  angle: number
  friction: number
  color: string
}

export type Part =
  | BallPart
  | BlockPart
  | GroundPart
  | WallPart
  | SpringPart
  | PulleyPart
  | RopePart
  | InclinedPlanePart

export interface PartTemplate {
  type: PartType
  name: string
  description: string
  icon: string
  create: (x: number, y: number) => Part
}

const generateId = () => `part-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

export const PART_TEMPLATES: PartTemplate[] = [
  {
    type: 'ball',
    name: '小球',
    description: '受重力影响的弹性小球',
    icon: '●',
    create: (x, y) => ({
      id: generateId(),
      type: 'ball',
      x,
      y,
      rotation: 0,
      locked: false,
      draggable: true,
      radius: 25,
      mass: 1,
      vx: 0,
      vy: 0,
      restitution: 0.7,
      color: '#3b82f6',
    }),
  },
  {
    type: 'block',
    name: '方块',
    description: '可碰撞的刚体方块',
    icon: '■',
    create: (x, y) => ({
      id: generateId(),
      type: 'block',
      x,
      y,
      rotation: 0,
      locked: false,
      draggable: true,
      width: 60,
      height: 60,
      mass: 2,
      vx: 0,
      vy: 0,
      angularVel: 0,
      restitution: 0.3,
      color: '#8b5cf6',
    }),
  },
  {
    type: 'ground',
    name: '地面',
    description: '固定不动的地面平台',
    icon: '▬',
    create: (x, y) => ({
      id: generateId(),
      type: 'ground',
      x,
      y,
      rotation: 0,
      locked: true,
      draggable: true,
      width: 300,
      height: 20,
      color: '#475569',
    }),
  },
  {
    type: 'wall',
    name: '墙壁',
    description: '固定的竖直墙面',
    icon: '▮',
    create: (x, y) => ({
      id: generateId(),
      type: 'wall',
      x,
      y,
      rotation: 0,
      locked: true,
      draggable: true,
      width: 20,
      height: 200,
      color: '#64748b',
    }),
  },
  {
    type: 'spring',
    name: '弹簧',
    description: '连接两个物体的弹簧',
    icon: '∿',
    create: (x, y) => ({
      id: generateId(),
      type: 'spring',
      x,
      y,
      rotation: 0,
      locked: false,
      draggable: true,
      anchorId: null,
      targetId: null,
      restLength: 100,
      stiffness: 30,
      damping: 2,
      anchorOffsetX: 0,
      anchorOffsetY: 0,
      targetOffsetX: 0,
      targetOffsetY: 0,
    }),
  },
  {
    type: 'pulley',
    name: '滑轮',
    description: '定滑轮，可连接绳索',
    icon: '◯',
    create: (x, y) => ({
      id: generateId(),
      type: 'pulley',
      x,
      y,
      rotation: 0,
      locked: true,
      draggable: true,
      radius: 30,
      connectedA: null,
      connectedB: null,
      ropeLength: 200,
    }),
  },
  {
    type: 'rope',
    name: '绳索',
    description: '连接两个物体的刚性绳索',
    icon: '⌇',
    create: (x, y) => ({
      id: generateId(),
      type: 'rope',
      x,
      y,
      rotation: 0,
      locked: false,
      draggable: true,
      anchorId: null,
      targetId: null,
      length: 150,
      anchorOffsetX: 0,
      anchorOffsetY: 0,
      targetOffsetX: 0,
      targetOffsetY: 0,
    }),
  },
  {
    type: 'inclined-plane',
    name: '斜面',
    description: '带摩擦系数的斜面',
    icon: '◣',
    create: (x, y) => ({
      id: generateId(),
      type: 'inclined-plane',
      x,
      y,
      rotation: 0,
      locked: true,
      draggable: true,
      width: 200,
      height: 120,
      angle: 30,
      friction: 0.3,
      color: '#a16207',
    }),
  },
]

interface SandboxState {
  parts: Part[]
  selectedPartId: string | null
  gravity: number
  gravityEnabled: boolean
  isRunning: boolean
  time: number
  connectingFrom: string | null
  connectingType: 'spring' | 'rope' | null

  addPart: (part: Part) => void
  removePart: (id: string) => void
  updatePart: (id: string, updates: Partial<Part>) => void
  clearAll: () => void
  setSelectedPartId: (id: string | null) => void
  setGravity: (g: number) => void
  setGravityEnabled: (enabled: boolean) => void
  setIsRunning: (running: boolean) => void
  setTime: (t: number) => void
  resetTime: () => void
  startConnecting: (fromId: string, type: 'spring' | 'rope') => void
  endConnecting: () => void
  connectParts: (connectorId: string, anchorId: string, targetId: string) => void
}

export const useSandboxStore = create<SandboxState>((set, get) => ({
  parts: [],
  selectedPartId: null,
  gravity: 300,
  gravityEnabled: true,
  isRunning: true,
  time: 0,
  connectingFrom: null,
  connectingType: null,

  addPart: (part) => set((state) => ({ parts: [...state.parts, part] })),
  removePart: (id) =>
    set((state) => ({
      parts: state.parts.filter((p) => p.id !== id),
      selectedPartId: state.selectedPartId === id ? null : state.selectedPartId,
    })),
  updatePart: (id, updates) =>
    set((state) => ({
      parts: state.parts.map((p) => (p.id === id ? ({ ...p, ...updates } as Part) : p)),
    })),
  clearAll: () => set({ parts: [], selectedPartId: null, time: 0 }),
  setSelectedPartId: (id) => set({ selectedPartId: id }),
  setGravity: (g) => set({ gravity: g }),
  setGravityEnabled: (enabled) => set({ gravityEnabled: enabled }),
  setIsRunning: (running) => set({ isRunning: running }),
  setTime: (t) => set({ time: t }),
  resetTime: () => set({ time: 0 }),
  startConnecting: (fromId, type) => set({ connectingFrom: fromId, connectingType: type }),
  endConnecting: () => set({ connectingFrom: null, connectingType: null }),
  connectParts: (connectorId, anchorId, targetId) => {
    const { parts } = get()
    const connector = parts.find((p) => p.id === connectorId)
    if (!connector) return
    if (connector.type === 'spring' || connector.type === 'rope') {
      if (targetId) {
        get().updatePart(connectorId, { anchorId, targetId } as Partial<Part>)
        set({ connectingFrom: null, connectingType: null })
      } else {
        get().updatePart(connectorId, { anchorId } as Partial<Part>)
      }
    }
  },
}))
