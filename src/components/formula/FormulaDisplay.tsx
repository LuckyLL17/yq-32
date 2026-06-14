import { useEffect, useRef, useState, useCallback } from 'react'
import { MousePointerClick } from 'lucide-react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import FormulaDerivation from './FormulaDerivation'
import type { FormulaDerivation as FormulaDerivationType } from '@/data/types'

interface FormulaDisplayProps {
  formula: string
  formulaWithValues?: string
  params?: Record<string, number>
  derivation?: FormulaDerivationType
}

export default function FormulaDisplay({ formula, formulaWithValues, params, derivation }: FormulaDisplayProps) {
  const formulaRef = useRef<HTMLDivElement>(null)
  const valuesFormulaRef = useRef<HTMLDivElement>(null)
  const [selectedVariable, setSelectedVariable] = useState<string | null>(null)
  const [hoveredVariable, setHoveredVariable] = useState<string | null>(null)

  useEffect(() => {
    const el = formulaRef.current
    if (!el) return
    try {
      katex.render(formula, el, { throwOnError: false, displayMode: true })
      if (derivation) {
        attachVariableListeners(el, derivation)
      }
    } catch {
      el.textContent = formula
    }
  }, [formula, derivation])

  useEffect(() => {
    const el = valuesFormulaRef.current
    if (!el || !formulaWithValues) return
    try {
      katex.render(formulaWithValues, el, { throwOnError: false, displayMode: true })
    } catch {
      el.textContent = formulaWithValues
    }
  }, [formulaWithValues])

  const attachVariableListeners = useCallback((container: HTMLElement, drv: FormulaDerivationType) => {
    const variableSymbols = drv.variables.map(v => v.symbol)
    const symbolToName: Record<string, string> = {}
    drv.variables.forEach(v => {
      symbolToName[v.symbol] = v.symbol
      const cleaned = v.symbol.replace(/[{}]/g, '')
      symbolToName[cleaned] = v.symbol
    })

    const miElements = container.querySelectorAll('.mord.mit, .mord, .mbin, .mrel')
    miElements.forEach((el) => {
      const htmlEl = el as HTMLElement
      const text = htmlEl.textContent?.trim() || ''
      
      let matchedSymbol: string | null = null
      for (const sym of variableSymbols) {
        const cleanSym = sym.replace(/[{}]/g, '').replace(/\\/g, '')
        const cleanText = text.replace(/[{}]/g, '').replace(/\\/g, '')
        if (text === sym || text === cleanSym || 
            cleanText === cleanSym || 
            cleanText === cleanSym.toLowerCase() ||
            cleanText === cleanSym.toUpperCase()) {
          matchedSymbol = sym
          break
        }
        if (sym.includes(text) || text.includes(cleanSym)) {
          matchedSymbol = sym
        }
      }
      
      if (!matchedSymbol) {
        for (const sym of variableSymbols) {
          const symParts = sym.match(/[a-zA-Z]+/)
          if (symParts && symParts[0] === text) {
            matchedSymbol = sym
            break
          }
        }
      }

      if (matchedSymbol) {
        htmlEl.style.cursor = 'pointer'
        htmlEl.style.transition = 'all 0.2s ease'
        htmlEl.style.position = 'relative'
        
        const handleMouseEnter = () => {
          setHoveredVariable(matchedSymbol!)
          htmlEl.style.color = 'var(--color-neon-cyan)'
          htmlEl.style.textShadow = '0 0 8px var(--color-neon-cyan)'
        }
        const handleMouseLeave = () => {
          setHoveredVariable(null)
          if (selectedVariable !== matchedSymbol) {
            htmlEl.style.color = ''
            htmlEl.style.textShadow = ''
          } else {
            htmlEl.style.color = 'var(--color-neon-green)'
            htmlEl.style.textShadow = '0 0 10px var(--color-neon-green)'
          }
        }
        const handleClick = (e: Event) => {
          e.stopPropagation()
          setSelectedVariable(prev => prev === matchedSymbol ? null : matchedSymbol!)
        }

        htmlEl.addEventListener('mouseenter', handleMouseEnter)
        htmlEl.addEventListener('mouseleave', handleMouseLeave)
        htmlEl.addEventListener('click', handleClick)
      }
    })
  }, [selectedVariable])

  useEffect(() => {
    if (!formulaRef.current || !derivation) return
    const allElements = formulaRef.current.querySelectorAll('.mord.mit, .mord, .mbin, .mrel')
    allElements.forEach((el) => {
      const htmlEl = el as HTMLElement
      if (selectedVariable && derivation.variables.some(v => v.symbol === selectedVariable)) {
        const varData = derivation.variables.find(v => v.symbol === selectedVariable)
        const text = htmlEl.textContent?.trim() || ''
        const cleanSym = selectedVariable.replace(/[{}]/g, '').replace(/\\/g, '')
        const cleanText = text.replace(/[{}]/g, '').replace(/\\/g, '')
        const isMatch = text === selectedVariable || 
          text === cleanSym || 
          cleanText === cleanSym ||
          cleanText === cleanSym.toLowerCase() ||
          cleanText === cleanSym.toUpperCase() ||
          (varData && varData.symbol.match(/[a-zA-Z]+/)?.[0] === text)
        
        if (isMatch) {
          htmlEl.style.color = 'var(--color-neon-green)'
          htmlEl.style.textShadow = '0 0 10px var(--color-neon-green)'
        } else if (hoveredVariable !== selectedVariable) {
          htmlEl.style.color = ''
          htmlEl.style.textShadow = ''
        }
      } else {
        htmlEl.style.color = ''
        htmlEl.style.textShadow = ''
      }
    })
  }, [selectedVariable, hoveredVariable, derivation, formula])

  const handleVariableTagClick = (symbol: string) => {
    setSelectedVariable(prev => prev === symbol ? null : symbol)
  }

  return (
    <div className="glass-panel rounded-xl p-5">
      <h3
        className="text-sm font-orbitron mb-4 tracking-wider flex items-center justify-between"
        style={{ color: 'var(--color-neon-cyan)' }}
      >
        <span>物理公式</span>
        {derivation && (
          <span className="text-[10px] font-normal flex items-center gap-1 text-slate-400">
            <MousePointerClick className="w-3 h-3" />
            点击变量查看详情
          </span>
        )}
      </h3>
      <div 
        ref={formulaRef} 
        className="text-center py-2 overflow-x-auto"
        onClick={() => {}}
      />

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

      {derivation && (
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <div className="text-xs text-slate-500 mb-2">变量速查（点击查看）</div>
          <div className="flex flex-wrap gap-1.5">
            {derivation.variables.map((v) => (
              <button
                key={v.symbol}
                onClick={() => handleVariableTagClick(v.symbol)}
                className={`
                  px-2 py-1 rounded text-xs transition-all
                  border flex items-center gap-1
                  ${selectedVariable === v.symbol
                    ? 'border-neon-green bg-neon-green/20 text-neon-green'
                    : hoveredVariable === v.symbol
                    ? 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan'
                    : 'border-slate-600/50 bg-space-900/30 text-slate-400 hover:border-neon-cyan/50 hover:text-neon-cyan'
                  }
                `}
                onMouseEnter={() => setHoveredVariable(v.symbol)}
                onMouseLeave={() => setHoveredVariable(null)}
              >
                <span className="font-mono text-[11px]">{v.symbol.replace(/\\/g, '').replace(/[{}]/g, '')}</span>
                <span className="text-slate-300/80">{v.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {derivation && (
        <div className="mt-4 pt-3 border-t border-slate-700/50">
          <FormulaDerivation
            derivation={derivation}
            selectedVariable={selectedVariable}
            onVariableSelect={setSelectedVariable}
          />
        </div>
      )}
    </div>
  )
}
