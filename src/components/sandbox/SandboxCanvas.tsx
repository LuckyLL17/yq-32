import { useRef, useEffect, useCallback } from 'react'
import {
  type Part,
  type BallPart,
  type BlockPart,
  type GroundPart,
  type WallPart,
  type SpringPart,
  type RopePart,
  type PulleyPart,
  type InclinedPlanePart,
  type PartTemplate,
} from '@/stores/sandboxStore'
import { drawGrid, drawCircle, drawSpring, drawText, clearCanvas, drawArrow } from '@/utils/canvas'

interface SandboxCanvasProps {
  parts: Part[]
  gravity: number
  gravityEnabled: boolean
  isRunning: boolean
  selectedPartId: string | null
  connectingFrom: string | null
  connectingType: 'spring' | 'rope' | null
  onPartClick: (id: string | null) => void
  onPartDrag: (id: string, x: number, y: number) => void
  onDropPart: (template: PartTemplate, x: number, y: number) => void
  onConnectorLink: (connectorId: string, targetId: string) => void
  onUpdatePart: (id: string, updates: Partial<Part>) => void
  onEndConnecting: () => void
  onTick: () => void
}

interface PhysicsState {
  [id: string]: {
    vx: number
    vy: number
    angularVel: number
    x: number
    y: number
    rotation: number
  }
}

export default function SandboxCanvas({
  parts,
  gravity,
  gravityEnabled,
  isRunning,
  selectedPartId,
  connectingFrom,
  connectingType,
  onPartClick,
  onPartDrag,
  onDropPart,
  onConnectorLink,
  onUpdatePart,
  onEndConnecting,
  onTick,
}: SandboxCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const physicsStateRef = useRef<PhysicsState>({})
  const animFrameRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const draggingRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null)
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const hoverPartIdRef = useRef<string | null>(null)
  const syncCounterRef = useRef<number>(0)

  useEffect(() => {
    parts.forEach((p) => {
      const existing = physicsStateRef.current[p.id]
      if (!existing) {
        physicsStateRef.current[p.id] = {
          vx: 'vx' in p ? (p as BallPart | BlockPart).vx : 0,
          vy: 'vy' in p ? (p as BallPart | BlockPart).vy : 0,
          angularVel: 'angularVel' in p ? (p as BlockPart).angularVel : 0,
          x: p.x,
          y: p.y,
          rotation: p.rotation,
        }
      } else {
        if (!draggingRef.current || draggingRef.current.id !== p.id) {
          existing.x = p.x
          existing.y = p.y
          existing.rotation = p.rotation
        }
      }
    })
    Object.keys(physicsStateRef.current).forEach((id) => {
      if (!parts.find((p) => p.id === id)) {
        delete physicsStateRef.current[id]
      }
    })
  }, [parts])

  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    }
  }, [])

  const hitTest = useCallback((part: Part, x: number, y: number): boolean => {
    const state = physicsStateRef.current[part.id]
    const px = state?.x ?? part.x
    const py = state?.y ?? part.y

    switch (part.type) {
      case 'ball': {
        const dx = x - px
        const dy = y - py
        return Math.sqrt(dx * dx + dy * dy) <= part.radius + 8
      }
      case 'block': {
        const halfW = part.width / 2
        const halfH = part.height / 2
        return x >= px - halfW - 8 && x <= px + halfW + 8 && y >= py - halfH - 8 && y <= py + halfH + 8
      }
      case 'ground':
      case 'wall': {
        const halfW = part.width / 2
        const halfH = part.height / 2
        return x >= px - halfW - 8 && x <= px + halfW + 8 && y >= py - halfH - 8 && y <= py + halfH + 8
      }
      case 'pulley': {
        const dx = x - px
        const dy = y - py
        return Math.sqrt(dx * dx + dy * dy) <= part.radius + 8
      }
      case 'spring':
      case 'rope': {
        const dx = x - px
        const dy = y - py
        return Math.sqrt(dx * dx + dy * dy) <= 25
      }
      case 'inclined-plane': {
        const halfW = part.width / 2
        const halfH = part.height / 2
        return x >= px - halfW - 8 && x <= px + halfW + 8 && y >= py - halfH - 8 && y <= py + halfH + 8
      }
      default:
        return false
    }
  }, [])

  const resolveBallRectCollision = useCallback(
    (
      ball: { x: number; y: number; radius: number; restitution: number; mass: number },
      rect: { x: number; y: number; w: number; h: number; locked: boolean; restitution: number },
      ballState: { vx: number; vy: number },
      gravity: number,
      dt: number
    ) => {
      const halfW = rect.w / 2
      const halfH = rect.h / 2
      const rectLeft = rect.x - halfW
      const rectRight = rect.x + halfW
      const rectTop = rect.y - halfH
      const rectBot = rect.y + halfH

      const closestX = Math.max(rectLeft, Math.min(ball.x, rectRight))
      const closestY = Math.max(rectTop, Math.min(ball.y, rectBot))

      const dx = ball.x - closestX
      const dy = ball.y - closestY
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < ball.radius) {
        let nx: number, ny: number, overlap: number

        const ballInside = ball.x > rectLeft && ball.x < rectRight && ball.y > rectTop && ball.y < rectBot

        if (ballInside) {
          const penLeft = ball.x - rectLeft
          const penRight = rectRight - ball.x
          const penTop = ball.y - rectTop
          const penBot = rectBot - ball.y
          const minPen = Math.min(penLeft, penRight, penTop, penBot)
          if (minPen === penLeft) {
            nx = -1
            ny = 0
            overlap = ball.radius + penLeft
          } else if (minPen === penRight) {
            nx = 1
            ny = 0
            overlap = ball.radius + penRight
          } else if (minPen === penTop) {
            nx = 0
            ny = -1
            overlap = ball.radius + penTop
          } else {
            nx = 0
            ny = 1
            overlap = ball.radius + penBot
          }
        } else if (dist > 0.0001) {
          nx = dx / dist
          ny = dy / dist
          overlap = ball.radius - dist
        } else {
          const penLeft = ball.x - rectLeft
          const penRight = rectRight - ball.x
          const penTop = ball.y - rectTop
          const penBot = rectBot - ball.y
          const minPen = Math.min(penLeft, penRight, penTop, penBot)
          if (minPen === penLeft) {
            nx = -1
            ny = 0
          } else if (minPen === penRight) {
            nx = 1
            ny = 0
          } else if (minPen === penTop) {
            nx = 0
            ny = -1
          } else {
            nx = 0
            ny = 1
          }
          overlap = ball.radius
        }

        const combinedRest = (ball.restitution + rect.restitution) / 2
        const velAlongNormal = ballState.vx * nx + ballState.vy * ny

        if (velAlongNormal > 0) return

        const j = -(1 + combinedRest) * velAlongNormal
        const invMassA = 1 / ball.mass
        const invMassB = rect.locked ? 0 : 1
        const impulse = j / (invMassA + invMassB)

        ballState.vx += impulse * invMassA * nx
        ballState.vy += impulse * invMassA * ny

        const isCornerContact = Math.abs(nx) > 0.1 && Math.abs(ny) > 0.1
        const isTopOrBottom = Math.abs(ny) > 0.9
        const isLeftOrRight = Math.abs(nx) > 0.9

        if (!isCornerContact) {
          const friction = 0.25
          let tx: number, ty: number
          if (isTopOrBottom) {
            tx = 1
            ty = 0
          } else if (isLeftOrRight) {
            tx = 0
            ty = 1
          } else {
            tx = -ny
            ty = nx
          }

          const velAlongTangent = ballState.vx * tx + ballState.vy * ty
          const jt = -velAlongTangent * friction
          ballState.vx += jt * invMassA * tx
          ballState.vy += jt * invMassA * ty

          if (isTopOrBottom && gravity > 0) {
            ballState.vx *= 0.98
          }
        } else {
          ballState.vx *= 0.995
          ballState.vy *= 0.995
        }

        ball.x += nx * overlap * 1.01
        ball.y += ny * overlap * 1.01

        if (ny < -0.5 && ballState.vy < gravity * dt * 1.5) {
          ballState.vy = Math.min(ballState.vy, -gravity * dt * 0.5)
        }
      }
    },
    []
  )

  const resolveBallBallCollision = useCallback(
    (
      a: { x: number; y: number; radius: number; restitution: number; mass: number },
      b: { x: number; y: number; radius: number; restitution: number; mass: number },
      stateA: { vx: number; vy: number },
      stateB: { vx: number; vy: number }
    ) => {
      const dx = b.x - a.x
      const dy = b.y - a.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const minDist = a.radius + b.radius

      if (dist < minDist && dist > 0) {
        const nx = dx / dist
        const ny = dy / dist
        const overlap = minDist - dist

        const combinedRest = (a.restitution + b.restitution) / 2
        const rvx = stateB.vx - stateA.vx
        const rvy = stateB.vy - stateA.vy
        const velAlongNormal = rvx * nx + rvy * ny

        if (velAlongNormal > 0) return

        const j = -(1 + combinedRest) * velAlongNormal
        const invMassA = 1 / a.mass
        const invMassB = 1 / b.mass
        const impulse = j / (invMassA + invMassB)

        stateA.vx -= impulse * invMassA * nx
        stateA.vy -= impulse * invMassA * ny
        stateB.vx += impulse * invMassB * nx
        stateB.vy += impulse * invMassB * ny

        const totalInvMass = invMassA + invMassB
        a.x -= nx * overlap * (invMassA / totalInvMass)
        a.y -= ny * overlap * (invMassA / totalInvMass)
        b.x += nx * overlap * (invMassB / totalInvMass)
        b.y += ny * overlap * (invMassB / totalInvMass)
      }
    },
    []
  )

  const getPartWorldPos = useCallback((part: Part, offsetX = 0, offsetY = 0) => {
    const state = physicsStateRef.current[part.id]
    const px = state?.x ?? part.x
    const py = state?.y ?? part.y
    const rot = state?.rotation ?? part.rotation

    const cos = Math.cos(rot)
    const sin = Math.sin(rot)

    return {
      x: px + offsetX * cos - offsetY * sin,
      y: py + offsetX * sin + offsetY * cos,
    }
  }, [])

  const step = useCallback(
    (dt: number) => {
      if (!isRunning) return

      const state = physicsStateRef.current
      const draggingId = draggingRef.current?.id ?? null

      parts.forEach((part) => {
        const s = state[part.id]
        if (!s) return

        const isDragging = draggingId === part.id

        if (!part.locked && !isDragging && (part.type === 'ball' || part.type === 'block')) {
          if (gravityEnabled) {
            s.vy += gravity * dt
          }
          const airDrag = 0.9995
          s.vx *= airDrag
          s.vy *= airDrag
          s.x += s.vx * dt
          s.y += s.vy * dt

          if (part.type === 'block') {
            s.rotation = (s.rotation ?? 0) + (s.angularVel ?? 0) * dt
            s.angularVel = (s.angularVel ?? 0) * 0.995
          }
        } else if (!isDragging) {
          s.x = part.x
          s.y = part.y
          s.rotation = part.rotation
        }
      })

      const canvas = canvasRef.current
      const W = canvas?.width ?? 800
      const H = canvas?.height ?? 600

      parts.forEach((part) => {
        const s = state[part.id]
        if (!s || part.locked) return
        if (draggingId === part.id) return

        if (part.type === 'ball') {
          const r = part.radius
          const restitution = part.restitution
          const friction = 0.02

          if (s.x - r < 0) {
            s.x = r
            s.vx = -s.vx * restitution
          }
          if (s.x + r > W) {
            s.x = W - r
            s.vx = -s.vx * restitution
          }
          if (s.y - r < 0) {
            s.y = r
            s.vy = -s.vy * restitution
          }
          if (s.y + r > H) {
            s.y = H - r
            s.vy = -s.vy * restitution
            s.vx *= 1 - friction
          }
        } else if (part.type === 'block') {
          const halfW = part.width / 2
          const halfH = part.height / 2
          const restitution = part.restitution
          const friction = 0.05

          if (s.x - halfW < 0) {
            s.x = halfW
            s.vx = -s.vx * restitution
            s.angularVel = (s.angularVel ?? 0) * 0.8
          }
          if (s.x + halfW > W) {
            s.x = W - halfW
            s.vx = -s.vx * restitution
            s.angularVel = (s.angularVel ?? 0) * 0.8
          }
          if (s.y - halfH < 0) {
            s.y = halfH
            s.vy = -s.vy * restitution
          }
          if (s.y + halfH > H) {
            s.y = H - halfH
            s.vy = -s.vy * restitution
            s.vx *= 1 - friction
            s.angularVel = (s.angularVel ?? 0) * 0.7
          }
        }
      })

      const dynamics: (BallPart | BlockPart)[] = []
      const statics: (GroundPart | WallPart | InclinedPlanePart | PulleyPart)[] = []

      parts.forEach((p) => {
        if (p.type === 'ball' || p.type === 'block') {
          if (!p.locked) dynamics.push(p as BallPart | BlockPart)
        } else if (p.type === 'ground' || p.type === 'wall' || p.type === 'inclined-plane' || p.type === 'pulley') {
          statics.push(p as any)
        }
      })

      for (let i = 0; i < dynamics.length; i++) {
        const a = dynamics[i]
        const sa = state[a.id]
        if (!sa) continue
        if (draggingId === a.id) continue

        for (const s of statics) {
          const ss = state[s.id]
          if (!ss) continue

          if (a.type === 'ball') {
            if (s.type === 'pulley') {
              resolveBallBallCollision(
                { x: sa.x, y: sa.y, radius: a.radius, restitution: a.restitution, mass: a.mass },
                { x: ss.x, y: ss.y, radius: s.radius, restitution: 0.3, mass: 10000 },
                sa,
                { vx: 0, vy: 0 }
              )
            } else if (s.type === 'ground' || s.type === 'wall') {
              resolveBallRectCollision(
                { x: sa.x, y: sa.y, radius: a.radius, restitution: a.restitution, mass: a.mass },
                { x: ss.x, y: ss.y, w: s.width, h: s.height, locked: true, restitution: 0.3 },
                sa,
                gravityEnabled ? gravity : 0,
                dt
              )
            } else if (s.type === 'inclined-plane') {
              const angleRad = (s.angle * Math.PI) / 180
              const cos = Math.cos(angleRad)
              const sin = Math.sin(angleRad)
              const cx = ss.x
              const cy = ss.y + s.height / 2
              const halfW = s.width / 2

              const x1 = cx - halfW * cos
              const y1 = cy + halfW * sin
              const x2 = cx + halfW * cos
              const y2 = cy - halfW * sin

              const A = sa.x - x1
              const B = sa.y - y1
              const C = x2 - x1
              const D = y2 - y1
              const dot = A * C + B * D
              const lenSq = C * C + D * D
              const t = Math.max(0, Math.min(1, dot / lenSq))
              const closestX = x1 + t * C
              const closestY = y1 + t * D

              const dx = sa.x - closestX
              const dy = sa.y - closestY
              const dist = Math.sqrt(dx * dx + dy * dy)

              if (dist < a.radius && dist > 0) {
                let nx = -sin
                let ny = -cos
                const sideDot = (sa.x - cx) * -sin + (sa.y - (cy - s.height / 2)) * -cos
                if (sideDot < 0) {
                  nx = sin
                  ny = cos
                }

                const overlap = a.radius - dist
                sa.x += nx * overlap * 1.01
                sa.y += ny * overlap * 1.01

                const velAlongNormal = sa.vx * nx + sa.vy * ny
                if (velAlongNormal < 0) {
                  const e = (a.restitution + 0.3) / 2
                  const jn = -(1 + e) * velAlongNormal
                  sa.vx += jn * nx
                  sa.vy += jn * ny

                  const tx = cos
                  const ty = -sin
                  const velAlongTangent = sa.vx * tx + sa.vy * ty
                  const jt = -velAlongTangent * s.friction
                  sa.vx += jt * tx
                  sa.vy += jt * ty
                }
              }
            }
          } else if (a.type === 'block') {
            if (s.type === 'ground' || s.type === 'wall' || s.type === 'inclined-plane') {
              const halfW = a.width / 2
              const halfH = a.height / 2
              const sHalfW = s.width / 2
              const sHalfH = s.height / 2

              const ax1 = sa.x - halfW
              const ay1 = sa.y - halfH
              const ax2 = sa.x + halfW
              const ay2 = sa.y + halfH

              let bx1: number, by1: number, bx2: number, by2: number

              if (s.type === 'inclined-plane') {
                const topY = ss.y - sHalfH
                bx1 = ss.x - sHalfW
                by1 = topY + s.height
                bx2 = ss.x + sHalfW
                by2 = topY
              } else {
                bx1 = ss.x - sHalfW
                by1 = ss.y - sHalfH
                bx2 = ss.x + sHalfW
                by2 = ss.y + sHalfH
              }

              const overlapX1 = ax2 - bx1
              const overlapX2 = bx2 - ax1
              const overlapY1 = ay2 - by1
              const overlapY2 = by2 - ay1

              if (overlapX1 > 0 && overlapX2 > 0 && overlapY1 > 0 && overlapY2 > 0) {
                const minOverlap = Math.min(overlapX1, overlapX2, overlapY1, overlapY2)
                const restitution = (a.restitution + 0.3) / 2

                if (minOverlap === overlapY1) {
                  sa.y -= overlapY1 * 1.01
                  if (sa.vy > 0) {
                    sa.vy = -sa.vy * restitution
                    sa.vx *= 0.95
                    sa.angularVel = (sa.angularVel ?? 0) * 0.8
                  }
                } else if (minOverlap === overlapY2) {
                  sa.y += overlapY2 * 1.01
                  if (sa.vy < 0) sa.vy = -sa.vy * restitution
                } else if (minOverlap === overlapX1) {
                  sa.x -= overlapX1 * 1.01
                  if (sa.vx > 0) {
                    sa.vx = -sa.vx * restitution
                    sa.angularVel = (sa.angularVel ?? 0) * 0.8
                  }
                } else {
                  sa.x += overlapX2 * 1.01
                  if (sa.vx < 0) {
                    sa.vx = -sa.vx * restitution
                    sa.angularVel = (sa.angularVel ?? 0) * 0.8
                  }
                }
              }
            } else if (s.type === 'pulley') {
              const halfDiag = Math.sqrt(a.width * a.width + a.height * a.height) / 2
              const dx = sa.x - ss.x
              const dy = sa.y - ss.y
              const dist = Math.sqrt(dx * dx + dy * dy)
              const minDist = s.radius + halfDiag * 0.7
              if (dist < minDist && dist > 0) {
                const nx = dx / dist
                const ny = dy / dist
                const overlap = minDist - dist
                sa.x += nx * overlap * 1.01
                sa.y += ny * overlap * 1.01
                const vn = sa.vx * nx + sa.vy * ny
                if (vn < 0) {
                  const e = (a.restitution + 0.3) / 2
                  sa.vx -= (1 + e) * vn * nx
                  sa.vy -= (1 + e) * vn * ny
                }
              }
            }
          }
        }

        for (let j = i + 1; j < dynamics.length; j++) {
          const b = dynamics[j]
          const sb = state[b.id]
          if (!sb) continue
          if (draggingId === b.id) continue

          if (a.type === 'ball' && b.type === 'ball') {
            resolveBallBallCollision(
              { x: sa.x, y: sa.y, radius: (a as BallPart).radius, restitution: a.restitution, mass: a.mass },
              { x: sb.x, y: sb.y, radius: (b as BallPart).radius, restitution: b.restitution, mass: b.mass },
              sa,
              sb
            )
          } else if (a.type === 'ball' && b.type === 'block') {
            resolveBallRectCollision(
              { x: sa.x, y: sa.y, radius: (a as BallPart).radius, restitution: a.restitution, mass: a.mass },
              { x: sb.x, y: sb.y, w: (b as BlockPart).width, h: (b as BlockPart).height, locked: false, restitution: b.restitution },
              sa,
              gravityEnabled ? gravity : 0,
              dt
            )
          } else if (a.type === 'block' && b.type === 'ball') {
            resolveBallRectCollision(
              { x: sb.x, y: sb.y, radius: (b as BallPart).radius, restitution: b.restitution, mass: b.mass },
              { x: sa.x, y: sa.y, w: (a as BlockPart).width, h: (a as BlockPart).height, locked: false, restitution: a.restitution },
              sb,
              gravityEnabled ? gravity : 0,
              dt
            )
          } else if (a.type === 'block' && b.type === 'block') {
            const aHalfW = a.width / 2
            const aHalfH = a.height / 2
            const bHalfW = b.width / 2
            const bHalfH = b.height / 2

            const overlapX1 = sa.x + aHalfW - (sb.x - bHalfW)
            const overlapX2 = sb.x + bHalfW - (sa.x - aHalfW)
            const overlapY1 = sa.y + aHalfH - (sb.y - bHalfH)
            const overlapY2 = sb.y + bHalfH - (sa.y - aHalfH)

            if (overlapX1 > 0 && overlapX2 > 0 && overlapY1 > 0 && overlapY2 > 0) {
              const restitution = (a.restitution + b.restitution) / 2
              const minOverlap = Math.min(overlapX1, overlapX2, overlapY1, overlapY2)
              const ratio = b.mass / (a.mass + b.mass)

              if (minOverlap === overlapY1) {
                sa.y -= overlapY1 * ratio * 1.01
                sb.y += overlapY1 * (1 - ratio) * 1.01
                const rv = sa.vy - sb.vy
                if (rv > 0) {
                  const imp = (1 + restitution) * rv / (1 / a.mass + 1 / b.mass)
                  sa.vy -= imp / a.mass
                  sb.vy += imp / b.mass
                }
              } else if (minOverlap === overlapY2) {
                sa.y += overlapY2 * ratio * 1.01
                sb.y -= overlapY2 * (1 - ratio) * 1.01
                const rv = sb.vy - sa.vy
                if (rv > 0) {
                  const imp = (1 + restitution) * rv / (1 / a.mass + 1 / b.mass)
                  sb.vy -= imp / b.mass
                  sa.vy += imp / a.mass
                }
              } else if (minOverlap === overlapX1) {
                sa.x -= overlapX1 * ratio * 1.01
                sb.x += overlapX1 * (1 - ratio) * 1.01
                const rv = sa.vx - sb.vx
                if (rv > 0) {
                  const imp = (1 + restitution) * rv / (1 / a.mass + 1 / b.mass)
                  sa.vx -= imp / a.mass
                  sb.vx += imp / b.mass
                }
              } else {
                sa.x += overlapX2 * ratio * 1.01
                sb.x -= overlapX2 * (1 - ratio) * 1.01
                const rv = sb.vx - sa.vx
                if (rv > 0) {
                  const imp = (1 + restitution) * rv / (1 / a.mass + 1 / b.mass)
                  sb.vx -= imp / b.mass
                  sa.vx += imp / a.mass
                }
              }
            }
          }
        }
      }

      parts.forEach((part) => {
        if (part.type !== 'spring' && part.type !== 'rope') return
        const s = state[part.id]
        if (!s) return

        const anchor = part.anchorId ? parts.find((p) => p.id === part.anchorId) : null
        const target = part.targetId ? parts.find((p) => p.id === part.targetId) : null

        if (!anchor && !target) {
          s.x = part.x
          s.y = part.y
          return
        }

        let anchorPos: { x: number; y: number } | null = null
        let targetPos: { x: number; y: number } | null = null

        if (anchor) {
          anchorPos = getPartWorldPos(anchor, (part as SpringPart).anchorOffsetX, (part as SpringPart).anchorOffsetY)
          const as = state[anchor.id]
          if (!anchorPos) anchorPos = { x: as?.x ?? anchor.x, y: as?.y ?? anchor.y }
        }
        if (target) {
          targetPos = getPartWorldPos(target, (part as SpringPart).targetOffsetX, (part as SpringPart).targetOffsetY)
          const ts = state[target.id]
          if (!targetPos) targetPos = { x: ts?.x ?? target.x, y: ts?.y ?? target.y }
        }

        if (anchorPos && targetPos) {
          s.x = (anchorPos.x + targetPos.x) / 2
          s.y = (anchorPos.y + targetPos.y) / 2

          const dx = targetPos.x - anchorPos.x
          const dy = targetPos.y - anchorPos.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (part.type === 'spring') {
            const sp = part as SpringPart
            const restLen = sp.restLength
            if (dist > 0) {
              const nx = dx / dist
              const ny = dy / dist
              const extension = dist - restLen

              const anchorState = anchor ? state[anchor.id] : null
              const targetState = target ? state[target.id] : null

              let anchorVelAlongSpring = 0
              let targetVelAlongSpring = 0
              if (anchorState && 'vx' in anchorState) anchorVelAlongSpring = anchorState.vx * nx + anchorState.vy * ny
              if (targetState && 'vx' in targetState) targetVelAlongSpring = targetState.vx * nx + targetState.vy * ny
              const relVel = targetVelAlongSpring - anchorVelAlongSpring

              const forceMag = -sp.stiffness * extension - sp.damping * relVel

              if (anchorState && anchor && !anchor.locked && 'vx' in anchorState && (anchor as any).mass) {
                const ax = (forceMag / (anchor as any).mass) * nx * dt
                const ay = (forceMag / (anchor as any).mass) * ny * dt
                if (draggingId !== anchor.id) {
                  anchorState.vx += ax
                  anchorState.vy += ay
                }
              }
              if (targetState && target && !target.locked && 'vx' in targetState && (target as any).mass) {
                const tx = (-forceMag / (target as any).mass) * nx * dt
                const ty = (-forceMag / (target as any).mass) * ny * dt
                if (draggingId !== target.id) {
                  targetState.vx += tx
                  targetState.vy += ty
                }
              }
            }
          } else if (part.type === 'rope') {
            const rp = part as RopePart
            const maxLen = rp.length
            if (dist > maxLen && dist > 0) {
              const nx = dx / dist
              const ny = dy / dist
              const excess = dist - maxLen

              const anchorState = anchor ? state[anchor.id] : null
              const targetState = target ? state[target.id] : null

              const hasAnchor = !!(anchorState && anchor && !anchor.locked && draggingId !== anchor.id)
              const hasTarget = !!(targetState && target && !target.locked && draggingId !== target.id)

              let correctionA = 0
              let correctionB = 0
              if (hasAnchor && hasTarget) {
                correctionA = excess * 0.5
                correctionB = excess * 0.5
              } else if (hasAnchor) {
                correctionA = excess
              } else if (hasTarget) {
                correctionB = excess
              }

              if (hasAnchor && anchorState) {
                anchorState.x += nx * correctionA
                anchorState.y += ny * correctionA
                if ('vx' in anchorState) {
                  const vn = anchorState.vx * nx + anchorState.vy * ny
                  if (vn > 0) {
                    anchorState.vx -= vn * nx
                    anchorState.vy -= vn * ny
                  }
                }
              }
              if (hasTarget && targetState) {
                targetState.x -= nx * correctionB
                targetState.y -= ny * correctionB
                if ('vx' in targetState) {
                  const vn = targetState.vx * nx + targetState.vy * ny
                  if (vn < 0) {
                    targetState.vx -= vn * nx
                    targetState.vy -= vn * ny
                  }
                }
              }
            }
          }
        } else if (anchorPos) {
          s.x = anchorPos.x
          s.y = anchorPos.y
        } else if (targetPos) {
          s.x = targetPos.x
          s.y = targetPos.y
        }
      })

      syncCounterRef.current += 1
      if (syncCounterRef.current >= 6) {
        syncCounterRef.current = 0
        parts.forEach((part) => {
          const s = state[part.id]
          if (!s || part.locked) return
          if (draggingId === part.id) return
          onUpdatePart(part.id, {
            x: s.x,
            y: s.y,
            rotation: s.rotation ?? 0,
            ...('vx' in s ? { vx: s.vx, vy: s.vy } : {}),
            ...('angularVel' in s ? { angularVel: s.angularVel ?? 0 } : {}),
          } as Partial<Part>)
        })
      }

      onTick()
    },
    [isRunning, parts, gravity, gravityEnabled, resolveBallRectCollision, resolveBallBallCollision, getPartWorldPos, onUpdatePart, onTick]
  )

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const H = canvas.height

    clearCanvas(ctx, W, H, '#0a0e17')
    drawGrid(ctx, W, H, 40, 'rgba(0, 240, 255, 0.05)')

    const state = physicsStateRef.current

    parts.forEach((part) => {
      if (part.type === 'spring' || part.type === 'rope') {
        const s = state[part.id]
        if (!s) return

        const anchor = part.anchorId ? parts.find((p) => p.id === part.anchorId) : null
        const target = part.targetId ? parts.find((p) => p.id === part.targetId) : null

        let anchorPos: { x: number; y: number } | null = null
        let targetPos: { x: number; y: number } | null = null

        if (anchor) {
          const as = state[anchor.id]
          anchorPos = getPartWorldPos(anchor, (part as SpringPart).anchorOffsetX, (part as SpringPart).anchorOffsetY)
          if (!anchorPos) anchorPos = { x: as?.x ?? anchor.x, y: as?.y ?? anchor.y }
        }
        if (target) {
          const ts = state[target.id]
          targetPos = getPartWorldPos(target, (part as SpringPart).targetOffsetX, (part as SpringPart).targetOffsetY)
          if (!targetPos) targetPos = { x: ts?.x ?? target.x, y: ts?.y ?? target.y }
        }

        const isSelected = selectedPartId === part.id
        const isConnecting = connectingFrom === part.id

        if (anchorPos && targetPos) {
          if (part.type === 'spring') {
            drawSpring(ctx, anchorPos.x, anchorPos.y, targetPos.x, targetPos.y, 12, 10, isConnecting ? '#ff6b2b' : isSelected ? '#fbbf24' : '#00f0ff')
          } else {
            ctx.strokeStyle = isConnecting ? '#ff6b2b' : isSelected ? '#fbbf24' : '#a78bfa'
            ctx.lineWidth = 3
            ctx.beginPath()
            ctx.moveTo(anchorPos.x, anchorPos.y)
            const midX = (anchorPos.x + targetPos.x) / 2
            const midY = (anchorPos.y + targetPos.y) / 2 + 20
            ctx.quadraticCurveTo(midX, midY, targetPos.x, targetPos.y)
            ctx.stroke()
          }
          drawCircle(ctx, anchorPos.x, anchorPos.y, 6, isConnecting ? '#ff6b2b' : '#fbbf24')
          drawCircle(ctx, targetPos.x, targetPos.y, 6, isConnecting ? '#ff6b2b' : '#fbbf24')
        } else {
          const px = s.x
          const py = s.y
          drawCircle(ctx, px, py, 15, 'rgba(0, 240, 255, 0.2)', isConnecting ? '#ff6b2b' : isSelected ? '#fbbf24' : '#00f0ff')
          drawText(ctx, part.type === 'spring' ? '∿' : '⌇', px, py, isSelected ? '#fbbf24' : '#00f0ff', 18, 'center')

          if (connectingFrom === part.id) {
            ctx.strokeStyle = '#ff6b2b'
            ctx.lineWidth = 2
            ctx.setLineDash([6, 6])
            ctx.beginPath()
            ctx.moveTo(px, py)
            ctx.lineTo(mousePosRef.current.x, mousePosRef.current.y)
            ctx.stroke()
            ctx.setLineDash([])
          }
        }
        return
      }

      const s = state[part.id]
      if (!s) return

      const px = s.x
      const py = s.y
      const rot = s.rotation ?? 0
      const isSelected = selectedPartId === part.id
      const isHovered = hoverPartIdRef.current === part.id
      const strokeColor = isSelected ? '#fbbf24' : isHovered ? '#00f0ff' : undefined
      const glowColor = isSelected ? 'rgba(251, 191, 36, 0.4)' : isHovered ? 'rgba(0, 240, 255, 0.3)' : undefined

      ctx.save()
      ctx.translate(px, py)
      ctx.rotate(rot)

      switch (part.type) {
        case 'ball': {
          ctx.restore()
          drawCircle(ctx, px, py, part.radius, part.color, strokeColor, glowColor)
          const velMag = Math.sqrt(s.vx * s.vx + s.vy * s.vy)
          if (velMag > 20) {
            const scale = Math.min(velMag / 300, 1)
            drawArrow(ctx, px, py, px + s.vx * scale * 0.3, py + s.vy * scale * 0.3, '#ef4444', 2)
          }
          break
        }
        case 'block': {
          const halfW = part.width / 2
          const halfH = part.height / 2
          if (glowColor) {
            ctx.shadowColor = glowColor
            ctx.shadowBlur = 20
          }
          ctx.fillStyle = part.color
          ctx.fillRect(-halfW, -halfH, part.width, part.height)
          ctx.shadowBlur = 0
          if (strokeColor) {
            ctx.strokeStyle = strokeColor
            ctx.lineWidth = 2.5
            ctx.strokeRect(-halfW, -halfH, part.width, part.height)
          }
          ctx.strokeStyle = 'rgba(255,255,255,0.2)'
          ctx.lineWidth = 1
          ctx.strokeRect(-halfW, -halfH, part.width, part.height)
          ctx.restore()
          break
        }
        case 'ground':
        case 'wall': {
          const halfW = part.width / 2
          const halfH = part.height / 2
          if (glowColor) {
            ctx.shadowColor = glowColor
            ctx.shadowBlur = 15
          }
          const grad = ctx.createLinearGradient(0, -halfH, 0, halfH)
          grad.addColorStop(0, part.color)
          grad.addColorStop(1, '#1e293b')
          ctx.fillStyle = grad
          ctx.fillRect(-halfW, -halfH, part.width, part.height)
          ctx.shadowBlur = 0
          if (strokeColor) {
            ctx.strokeStyle = strokeColor
            ctx.lineWidth = 2.5
            ctx.strokeRect(-halfW, -halfH, part.width, part.height)
          }
          ctx.strokeStyle = 'rgba(255,255,255,0.15)'
          ctx.lineWidth = 1
          for (let i = 0; i < (part.type === 'ground' ? part.width : part.height); i += 12) {
            ctx.beginPath()
            if (part.type === 'ground') {
              ctx.moveTo(-halfW + i, -halfH)
              ctx.lineTo(-halfW + i - Math.min(8, i), -halfH + Math.min(8, i))
            } else {
              ctx.moveTo(-halfW, -halfH + i)
              ctx.lineTo(-halfW + Math.min(8, i), -halfH + i - Math.min(8, i))
            }
            ctx.stroke()
          }
          ctx.restore()
          break
        }
        case 'pulley': {
          ctx.restore()
          drawCircle(ctx, px, py, part.radius, '#1e293b', strokeColor || '#64748b', glowColor)
          ctx.beginPath()
          ctx.arc(px, py, part.radius * 0.4, 0, Math.PI * 2)
          ctx.fillStyle = '#334155'
          ctx.fill()
          ctx.strokeStyle = '#475569'
          ctx.lineWidth = 2
          ctx.stroke()
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2
            ctx.beginPath()
            ctx.moveTo(px + Math.cos(a) * part.radius * 0.4, py + Math.sin(a) * part.radius * 0.4)
            ctx.lineTo(px + Math.cos(a) * part.radius * 0.85, py + Math.sin(a) * part.radius * 0.85)
            ctx.strokeStyle = '#64748b'
            ctx.lineWidth = 2
            ctx.stroke()
          }
          break
        }
        case 'inclined-plane': {
          const halfW = part.width / 2
          const halfH = part.height / 2
          if (glowColor) {
            ctx.shadowColor = glowColor
            ctx.shadowBlur = 15
          }
          ctx.beginPath()
          ctx.moveTo(-halfW, halfH)
          ctx.lineTo(halfW, halfH)
          ctx.lineTo(halfW, -halfH)
          ctx.closePath()
          const grad = ctx.createLinearGradient(0, -halfH, 0, halfH)
          grad.addColorStop(0, part.color)
          grad.addColorStop(1, '#422006')
          ctx.fillStyle = grad
          ctx.fill()
          ctx.shadowBlur = 0
          if (strokeColor) {
            ctx.strokeStyle = strokeColor
            ctx.lineWidth = 2.5
            ctx.stroke()
          }
          ctx.strokeStyle = 'rgba(255,255,255,0.2)'
          ctx.lineWidth = 1
          const lines = 5
          for (let i = 1; i <= lines; i++) {
            const t = i / (lines + 1)
            ctx.beginPath()
            ctx.moveTo(-halfW + halfW * 2 * t, halfH)
            ctx.lineTo(halfW, -halfH + halfH * 2 * t)
            ctx.stroke()
          }
          ctx.restore()
          break
        }
      }
    })

    if (connectingFrom) {
      const connector = parts.find((p) => p.id === connectingFrom)
      if (connector) {
        const cs = state[connector.id]
        const cx = cs?.x ?? connector.x
        const cy = cs?.y ?? connector.y
        ctx.strokeStyle = 'rgba(255, 107, 43, 0.6)'
        ctx.lineWidth = 2
        ctx.setLineDash([8, 8])
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(mousePosRef.current.x, mousePosRef.current.y)
        ctx.stroke()
        ctx.setLineDash([])
        drawCircle(ctx, mousePosRef.current.x, mousePosRef.current.y, 12, 'rgba(255, 107, 43, 0.2)', '#ff6b2b')
      }
    }
  }, [parts, selectedPartId, connectingFrom, getPartWorldPos])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const resize = () => {
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
      canvas.style.width = rect.width + 'px'
      canvas.style.height = rect.height + 'px'
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  useEffect(() => {
    const loop = (t: number) => {
      const last = lastTimeRef.current || t
      const dt = Math.min((t - last) / 1000, 0.033)
      lastTimeRef.current = t

      const subSteps = 3
      for (let i = 0; i < subSteps; i++) {
        step(dt / subSteps)
      }
      render()

      animFrameRef.current = requestAnimationFrame(loop)
    }

    animFrameRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [step, render])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const { x, y } = getCanvasCoords(e.clientX, e.clientY)
      mousePosRef.current = { x, y }

      let clickedPart: Part | null = null
      for (let i = parts.length - 1; i >= 0; i--) {
        if (hitTest(parts[i], x, y)) {
          clickedPart = parts[i]
          break
        }
      }

      if (connectingFrom && clickedPart && clickedPart.id !== connectingFrom) {
        const connector = parts.find((p) => p.id === connectingFrom)
        if (connector && (connector.type === 'spring' || connector.type === 'rope')) {
          const anchorPart = connector.anchorId ? parts.find((p) => p.id === connector.anchorId) : null
          const anyState = physicsStateRef.current

          if (!connector.anchorId) {
            const firstPos = anyState[clickedPart.id] ?? { x: clickedPart.x, y: clickedPart.y }
            onUpdatePart(connectingFrom, {
              anchorId: clickedPart.id,
              anchorOffsetX: 0,
              anchorOffsetY: 0,
              x: firstPos.x,
              y: firstPos.y,
            } as Partial<Part>)
            onPartClick(clickedPart.id)
            return
          } else if (!connector.targetId) {
            const anchorState = anchorPart ? (anyState[anchorPart.id] ?? { x: anchorPart.x, y: anchorPart.y }) : null
            const targetState = anyState[clickedPart.id] ?? { x: clickedPart.x, y: clickedPart.y }
            if (anchorState && targetState) {
              const dx = targetState.x - anchorState.x
              const dy = targetState.y - anchorState.y
              const dist = Math.sqrt(dx * dx + dy * dy)
              const updates: Partial<Part> = {
                targetId: clickedPart.id,
                targetOffsetX: 0,
                targetOffsetY: 0,
              }
              if (connector.type === 'rope') {
                ;(updates as any).length = Math.max(30, dist)
              } else {
                ;(updates as any).restLength = Math.max(30, dist)
              }
              onUpdatePart(connectingFrom, updates)
            }
            onEndConnecting()
            onPartClick(clickedPart.id)
            return
          }
        }
      }

      if (clickedPart) {
        onPartClick(clickedPart.id)
        if (clickedPart.draggable) {
          const s = physicsStateRef.current[clickedPart.id]
          const px = s?.x ?? clickedPart.x
          const py = s?.y ?? clickedPart.y
          draggingRef.current = {
            id: clickedPart.id,
            offsetX: x - px,
            offsetY: y - py,
          }
          if (!clickedPart.locked) {
            if (physicsStateRef.current[clickedPart.id]) {
              physicsStateRef.current[clickedPart.id].vx = 0
              physicsStateRef.current[clickedPart.id].vy = 0
              if ('angularVel' in physicsStateRef.current[clickedPart.id]) {
                physicsStateRef.current[clickedPart.id].angularVel = 0
              }
            }
          }
        }

        if ((clickedPart.type === 'spring' || clickedPart.type === 'rope') && !clickedPart.anchorId) {
          const s = physicsStateRef.current[clickedPart.id]
          if (s) {
            s.x = clickedPart.x
            s.y = clickedPart.y
          }
        }
      } else {
        onPartClick(null)
      }
    },
    [parts, getCanvasCoords, hitTest, connectingFrom, onPartClick, onConnectorLink, onUpdatePart, onEndConnecting]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const { x, y } = getCanvasCoords(e.clientX, e.clientY)
      mousePosRef.current = { x, y }

      let foundHover: string | null = null
      for (let i = parts.length - 1; i >= 0; i--) {
        if (hitTest(parts[i], x, y)) {
          foundHover = parts[i].id
          break
        }
      }
      hoverPartIdRef.current = foundHover

      if (draggingRef.current) {
        const { id, offsetX, offsetY } = draggingRef.current
        const newX = x - offsetX
        const newY = y - offsetY
        onPartDrag(id, newX, newY)
        const s = physicsStateRef.current[id]
        if (s) {
          s.x = newX
          s.y = newY
          if ('vx' in s) s.vx = 0
          if ('vy' in s) s.vy = 0
          if ('angularVel' in s) s.angularVel = 0
        }
      }
    },
    [parts, getCanvasCoords, hitTest, onPartDrag]
  )

  const handleMouseUp = useCallback(() => {
    draggingRef.current = null
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const data = e.dataTransfer.getData('application/x-part-template')
      if (!data) return
      try {
        const typeName = JSON.parse(data) as string
        const template = (window as any).__partTemplateCache?.[typeName] as PartTemplate | undefined
        if (template) {
          const { x, y } = getCanvasCoords(e.clientX, e.clientY)
          onDropPart(template, x, y)
        }
      } catch {
        // ignore
      }
    },
    [getCanvasCoords, onDropPart]
  )

  return (
    <div ref={containerRef} className="relative h-full w-full canvas-grid overflow-hidden">
      <canvas
        ref={canvasRef}
        className="h-full w-full cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      />
      {parts.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-3 animate-pulse">
            <div className="text-6xl opacity-20">🔬</div>
            <p className="font-orbitron text-xl text-neon-cyan/40 tracking-wider">开始你的实验</p>
            <p className="text-sm text-slate-500">将左侧零件拖拽到此处自由组合</p>
            <p className="text-xs text-slate-600">点击零件可选中，再次点击取消选中</p>
          </div>
        </div>
      )}
      {connectingFrom && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-lg border border-neon-orange/50 bg-neon-orange/10 px-4 py-2 backdrop-blur-md">
          <p className="text-xs text-neon-orange font-medium">
            {(() => {
              const p = parts.find(pp => pp.id === connectingFrom)
              const hasAnchor = p && ('anchorId' in p) && (p as any).anchorId
              return hasAnchor ? '请选择第二个要连接的物体' : '请选择第一个要连接的物体'
            })()}
          </p>
        </div>
      )}
    </div>
  )
}
