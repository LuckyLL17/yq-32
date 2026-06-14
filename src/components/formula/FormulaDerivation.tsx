import { useState, useEffect, useRef } from 'react'
import { ChevronDown, ChevronRight, HelpCircle, X, ArrowDown, BookOpen, Ruler, Link2 } from 'lucide-react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import type { FormulaDerivation as FormulaDerivationType, VariableDefinition, DerivationStep } from '@/data/types'
import { cn } from '@/lib/utils'

interface FormulaDerivationProps {
  derivation: FormulaDerivationType
  selectedVariable?: string | null
  onVariableSelect?: (symbol: string | null) => void
}

function KaTeXRenderer({ formula, displayMode = false, onClick }: { formula: string; displayMode?: boolean; onClick?: () => void }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!ref.current) return
    try {
      katex.render(formula, ref.current, { throwOnError: false, displayMode })
    } catch {
      ref.current.textContent = formula
    }
  }, [formula, displayMode])
  return <span ref={ref} onClick={onClick} className={onClick ? 'cursor-pointer hover:text-neon-cyan transition-colors' : ''} />
}

function VariableTooltip({ variable, relatedVariables, onClose, onRelatedClick }: {
  variable: VariableDefinition
  relatedVariables: VariableDefinition[]
  onClose: () => void
  onRelatedClick: (symbol: string) => void
}) {
  return (
    <div className="mt-3 p-4 rounded-lg border border-neon-cyan/30 bg-space-900/80 animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="px-2 py-1 rounded bg-neon-cyan/10 border border-neon-cyan/40">
            <KaTeXRenderer formula={variable.symbol} />
          </div>
          <span className="font-orbitron text-lg font-bold text-neon-cyan">{variable.name}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-700/50 text-slate-400 hover:text-neon-orange transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex items-start gap-2">
          <BookOpen className="w-4 h-4 mt-0.5 text-neon-green flex-shrink-0" />
          <div>
            <span className="text-slate-400 font-medium">定义：</span>
            <span className="text-slate-200">{variable.description}</span>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Ruler className="w-4 h-4 mt-0.5 text-neon-orange flex-shrink-0" />
          <div>
            <span className="text-slate-400 font-medium">量纲：</span>
            <span className="text-slate-200 font-mono">{variable.dimension}</span>
            <span className="mx-2 text-slate-500">|</span>
            <span className="text-slate-400 font-medium">单位：</span>
            <span className="text-neon-orange font-mono">{variable.unit}</span>
          </div>
        </div>

        {relatedVariables.length > 0 && (
          <div className="flex items-start gap-2">
            <Link2 className="w-4 h-4 mt-0.5 text-neon-purple flex-shrink-0" />
            <div className="flex-1">
              <span className="text-slate-400 font-medium">关联变量：</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {relatedVariables.map((rv) => (
                  <button
                    key={rv.symbol}
                    onClick={() => onRelatedClick(rv.symbol)}
                    className="px-2 py-0.5 rounded text-xs border border-neon-purple/30 bg-neon-purple/10 text-neon-purple hover:bg-neon-purple/20 hover:border-neon-purple/60 transition-all"
                  >
                    <KaTeXRenderer formula={rv.symbol} />
                    <span className="ml-1 text-slate-300">{rv.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function TheoremModal({ step, onClose }: { step: DerivationStep; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="glass-panel rounded-2xl p-6 max-w-lg w-[90vw] border-2 border-neon-orange/50 glow-border-orange"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-neon-orange" />
            <h3 className="font-orbitron text-lg font-bold text-neon-orange">所用定理</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-700/50 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <div className="font-orbitron text-sm text-neon-cyan mb-2">
            {step.theorem.name}
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            {step.theorem.description}
          </p>
        </div>

        {step.theorem.formula && (
          <div className="p-4 rounded-lg bg-space-900/80 border border-neon-cyan/20 overflow-x-auto">
            <div className="text-center text-lg">
              <KaTeXRenderer formula={step.theorem.formula} displayMode />
            </div>
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-slate-700/50">
          <div className="text-xs text-slate-400 mb-2">当前步骤：</div>
          <div className="p-3 rounded bg-space-900/50 overflow-x-auto">
            <KaTeXRenderer formula={step.formula} displayMode />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FormulaDerivation({ derivation, selectedVariable, onVariableSelect }: FormulaDerivationProps) {
  const [showDerivation, setShowDerivation] = useState(false)
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())
  const [activeTheoremStep, setActiveTheoremStep] = useState<DerivationStep | null>(null)

  const selectedVarData = selectedVariable
    ? derivation.variables.find((v) => v.symbol === selectedVariable || v.symbol.replace(/[{}]/g, '') === selectedVariable)
    : null

  const relatedVarsData = selectedVarData?.relatedVariables
    ? derivation.variables.filter((v) => selectedVarData.relatedVariables!.includes(v.symbol))
    : []

  const toggleStep = (id: string) => {
    const newSet = new Set(expandedSteps)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setExpandedSteps(newSet)
  }

  const expandAllSteps = () => {
    setExpandedSteps(new Set(derivation.derivationSteps.map((s) => s.id)))
  }

  const collapseAllSteps = () => {
    setExpandedSteps(new Set())
  }

  return (
    <div className="space-y-3">
      {selectedVarData && (
        <VariableTooltip
          variable={selectedVarData}
          relatedVariables={relatedVarsData}
          onClose={() => onVariableSelect?.(null)}
          onRelatedClick={(symbol) => onVariableSelect?.(symbol)}
        />
      )}

      <div>
        <button
          onClick={() => setShowDerivation(!showDerivation)}
          className={cn(
            'w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all',
            showDerivation
              ? 'border-neon-green/50 bg-neon-green/10 text-neon-green'
              : 'border-neon-cyan/30 bg-space-800/50 text-slate-300 hover:border-neon-cyan/60 hover:bg-neon-cyan/5'
          )}
        >
          <span className="flex items-center gap-2 font-orbitron text-sm">
            <BookOpen className="w-4 h-4" />
            展开推导过程
          </span>
          {showDerivation ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>

        {showDerivation && (
          <div className="mt-3 space-y-3 animate-slide-down">
            <div className="flex gap-2 mb-3">
              <button
                onClick={expandAllSteps}
                className="px-3 py-1.5 text-xs rounded border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10 transition-all"
              >
                全部展开
              </button>
              <button
                onClick={collapseAllSteps}
                className="px-3 py-1.5 text-xs rounded border border-slate-600 text-slate-400 hover:bg-slate-700/50 transition-all"
              >
                全部收起
              </button>
            </div>

            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-neon-cyan/50 via-neon-purple/50 to-neon-orange/50" />

              {derivation.derivationSteps.map((step, index) => (
                <div key={step.id} className="relative pl-12 pb-4 last:pb-0">
                  <div className={cn(
                    'absolute left-3 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center font-orbitron text-xs font-bold z-10',
                    expandedSteps.has(step.id)
                      ? 'border-neon-green bg-neon-green text-space-900'
                      : 'border-neon-cyan bg-space-800 text-neon-cyan'
                  )}>
                    {index + 1}
                  </div>

                  <div className={cn(
                    'rounded-lg border transition-all overflow-hidden',
                    expandedSteps.has(step.id)
                      ? 'border-neon-green/40 bg-neon-green/5'
                      : 'border-slate-700/50 bg-space-900/30 hover:border-neon-cyan/30'
                  )}>
                    <button
                      onClick={() => toggleStep(step.id)}
                      className="w-full px-4 py-3 flex items-start justify-between text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="overflow-x-auto">
                          <KaTeXRenderer formula={step.formula} displayMode={false} />
                        </div>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex items-center gap-1">
                        {expandedSteps.has(step.id) ? (
                          <ChevronDown className="w-4 h-4 text-neon-green" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                    </button>

                    {expandedSteps.has(step.id) && (
                      <div className="px-4 pb-4 space-y-3 animate-fade-in">
                        {index > 0 && (
                          <div className="flex items-center gap-2 text-neon-purple/80 text-xs">
                            <ArrowDown className="w-3 h-3" />
                            <span className="font-orbitron tracking-wider">从第 {index} 步推导</span>
                          </div>
                        )}

                        <p className="text-sm text-slate-300 leading-relaxed">
                          {step.explanation}
                        </p>

                        <button
                          onClick={() => setActiveTheoremStep(step)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neon-orange/40 bg-neon-orange/10 text-neon-orange text-xs hover:bg-neon-orange/20 hover:border-neon-orange/60 transition-all"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          为什么？查看所用定理
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {derivation.relatedFormulas && derivation.relatedFormulas.length > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-700/50">
                <h4 className="font-orbitron text-sm text-neon-purple mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  相关公式
                </h4>
                <div className="space-y-2">
                  {derivation.relatedFormulas.map((rf, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg border border-neon-purple/20 bg-neon-purple/5 hover:border-neon-purple/40 transition-all"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-orbitron text-neon-purple">{rf.name}</span>
                      </div>
                      <div className="overflow-x-auto text-sm mb-1">
                        <KaTeXRenderer formula={rf.formula} />
                      </div>
                      <p className="text-xs text-slate-400">{rf.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {activeTheoremStep && (
        <TheoremModal step={activeTheoremStep} onClose={() => setActiveTheoremStep(null)} />
      )}
    </div>
  )
}
