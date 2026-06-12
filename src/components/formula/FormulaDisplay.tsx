import { useEffect, useRef } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

interface FormulaDisplayProps {
  formula: string
  params?: Record<string, number>
}

export default function FormulaDisplay({ formula, params }: FormulaDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    try {
      katex.render(formula, container, {
        throwOnError: false,
        displayMode: true,
      })
    } catch {
      container.textContent = formula
    }
  }, [formula])

  return (
    <div className="glass-panel rounded-xl p-5">
      <h3
        className="text-sm font-orbitron mb-4 tracking-wider"
        style={{ color: 'var(--color-neon-cyan)' }}
      >
        物理公式
      </h3>
      <div ref={containerRef} className="text-center py-2 overflow-x-auto" />
      {params && Object.keys(params).length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(params).map(([key, value]) => (
              <div key={key} className="flex justify-between text-xs">
                <span className="text-slate-400">{key}</span>
                <span className="font-mono" style={{ color: 'var(--color-neon-cyan)' }}>
                  {value.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
