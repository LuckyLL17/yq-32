interface ParamSliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
  onChange: (v: number) => void
}

export default function ParamSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: ParamSliderProps) {
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
        className="slider-neon"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  )
}
