import { useEffect, useRef } from 'react'
import { useCollabStore } from '@/stores/collabStore'

interface CollabCursorsProps {
  containerRef: React.RefObject<HTMLDivElement>
}

export default function CollabCursors({ containerRef }: CollabCursorsProps) {
  const { userId, collaborators, isConnected, sendCursorPosition } = useCollabStore()
  const lastSentRef = useRef(0)
  const containerPosRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (!isConnected || !containerRef.current) return

    const container = containerRef.current

    const updateContainerPos = () => {
      const rect = container.getBoundingClientRect()
      containerPosRef.current = { x: rect.left, y: rect.top }
    }

    updateContainerPos()
    window.addEventListener('resize', updateContainerPos)

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now()
      if (now - lastSentRef.current < 50) return

      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        sendCursorPosition(x, y)
        lastSentRef.current = now
      }
    }

    container.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('resize', updateContainerPos)
      container.removeEventListener('mousemove', handleMouseMove)
    }
  }, [isConnected, containerRef, sendCursorPosition])

  if (!isConnected) return null

  const otherCollaborators = collaborators.filter((c) => c.id !== userId)

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {otherCollaborators.map((c) => (
        <div
          key={c.id}
          className="absolute transition-transform duration-75 ease-out"
          style={{
            left: c.x,
            top: c.y,
            transform: 'translate(-2px, -2px)',
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            style={{ filter: `drop-shadow(0 0 6px ${c.color})` }}
          >
            <path
              d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L6.35 2.86a.5.5 0 0 0-.85.35z"
              fill={c.color}
              stroke="white"
              strokeWidth="1.5"
            />
          </svg>
          <div
            className="absolute left-5 top-5 px-2 py-1 rounded-md text-xs font-medium text-white whitespace-nowrap"
            style={{
              backgroundColor: c.color,
              boxShadow: `0 0 12px ${c.color}66`,
            }}
          >
            {c.nickname}
          </div>
        </div>
      ))}
    </div>
  )
}
