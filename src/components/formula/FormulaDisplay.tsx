import { useEffect, useRef } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

interface FormulaDisplayProps {
  formula: string
  formulaWithValues?: string
  params?: Record<string, number>
}

export default function FormulaDisplay({ formula, formulaWithValues, params }: FormulaDisplayProps) {
  const formulaRef = useRef<HTMLDivElement>(null)
  const valuesFormulaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = formulaRef.current
    if (!el) return
    try {
      katex.render(formula, el, { throwOnError: false, displayMode: true })
    } catch {
      el.textContent = formula
    }
  }, [formula])

  useEffect(() => {
    const el = valuesFormulaRef.current
    if (!el || !formulaWithValues) return
    try {
      katex.render(formulaWithValues, el, { throwOnError: false, displayMode: true })
    } catch {
      el.textContent = formulaWithValues
    }
  }, [formulaWithValues])

  return (
    <div className="glass-panel rounded-xl p-5">
      <h3
        className="text-sm font-orbitron mb-4 tracking-wider"
        style={{ color: 'var(--color-neon-cyan)' }}
      >
        物理公式
      </h3>
      <div ref={formulaRef} className="text-center py-2 overflow-x-auto" />

      {formulaWithValues && (
        <>
          <div className="mt-3 pt-3 border-t border-slate-700/50">
            <span className="text-xs text-slate-500 mb-2 block">代入数值</span>
            <div ref={valuesFormulaRef} className="text-center py-1 overflow-x-auto" style={{ color: 'var(--color-neon-orange)' }} />
          </div>
        </>
      )}

      {params && Object.keys(params).length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-700/50">
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
