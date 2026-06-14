import { useRef } from 'react'
import { useCollabStore } from '@/stores/collabStore'

interface ParamSliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
  onChange: (v: number) => void
  paramKey: string
}

export default function ParamSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  paramKey,
}: ParamSliderProps) {
  const {
    isConnected,
    isMyTurn,
    currentParamKey,
    sendParamChange,
    sendParamDragStart,
    sendParamDragEnd,
  } = useCollabStore()

  const isDraggingRef = useRef(false)

  const handleMouseDown = () => {
    if (isConnected && isMyTurn && !isDraggingRef.current) {
      isDraggingRef.current = true
      sendParamDragStart(paramKey, label)
    }
  }

  const handleMouseUp = () => {
    if (isConnected && isDraggingRef.current) {
      isDraggingRef.current = false
      sendParamDragEnd(paramKey)
    }
  }

  const handleTouchStart = () => {
    handleMouseDown()
  }

  const handleTouchEnd = () => {
    handleMouseUp()
  }

  const handleChange = (v: number) => {
    onChange(v)
    if (isConnected && isMyTurn) {
      sendParamChange(paramKey, v)
    }
  }

  const disabled = isConnected && !isMyTurn
  const isSomeoneElseDragging = isConnected && currentParamKey === paramKey && !isMyTurn

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-slate-300">{label}</span>
        <span className="text-sm font-mono" style={{ color: 'var(--color-neon-cyan)' }}>
          {value.toFixed(2)}
          {unit && <span className="ml-1">{unit}</span>}
        </span>
      </div>
      <input
        type="range"
        className={`slider-neon ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${isSomeoneElseDragging ? 'animate-pulse' : ''}`}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => handleChange(parseFloat(e.target.value))}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        disabled={disabled}
      />
      {disabled && (
        <p className="mt-1 text-xs text-slate-500">等待其他玩家操作完成...</p>
      )}
    </div>
  )
}
