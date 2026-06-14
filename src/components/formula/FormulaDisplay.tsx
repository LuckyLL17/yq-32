import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { MousePointerClick, Volume2, VolumeX, Settings, Play, Pause, RotateCcw } from 'lucide-react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import FormulaDerivation from './FormulaDerivation'
import type { FormulaDerivation as FormulaDerivationType, SpeechSegment, VoiceConfig, HighlightElementType } from '@/data/types'
import { useExperimentStore } from '@/stores/experimentStore'

interface FormulaDisplayProps {
  formula: string
  formulaWithValues?: string
  params?: Record<string, number>
  derivation?: FormulaDerivationType
}

const symbolToReadable: Record<string, string> = {
  'x': 'x',
  'A': '振幅',
  '\\omega': '角频率',
  't': '时间',
  '\\varphi': '初相位',
  'k': '弹性系数',
  'm': '质量',
  'T': '周期',
  'y': 'y',
  'v_0': '初速度',
  '\\theta': '角度',
  'g': '重力加速度',
  'H': '射高',
  'I': '光强',
  'I_0': '单缝光强',
  '\\lambda': '波长',
  'f': '频率',
  '\\Delta x': '条纹间距',
  'a': '二次项系数',
  'b': '一次项系数',
  'c': '常数项',
  'x_0': '对称轴横坐标',
  'y_0': '顶点纵坐标',
  '\\Delta': '判别式',
  '[A]': '反应物A浓度',
  '[B]': '反应物B浓度',
  'E_a': '活化能',
  'n': '反应级数',
  '\\mu': '偶极矩',
}

const variableToCanvasElement: Record<string, HighlightElementType> = {
  'x': 'displacement',
  'A': 'displacement',
  '\\omega': 'trajectory',
  't': 'trajectory',
  'k': 'spring',
  'm': 'mass',
  'F': 'force',
  'v_0': 'velocity_vector',
  'g': 'ground',
  'H': 'projectile',
  'I': 'interference_pattern',
  '\\lambda': 'wave_front',
  'f': 'wave_front',
  'a': 'function_curve',
  'b': 'function_curve',
  'c': 'function_curve',
  'x_0': 'vertex',
  'y_0': 'vertex',
  '\\Delta': 'coordinate_axis',
  '[A]': 'reactant_a',
  '[B]': 'reactant_b',
  'E_a': 'energy_barrier',
}

const formulaDescriptions: Record<string, string> = {
  'x(t) = A \\cos(\\omega t + \\varphi)': '这是简谐运动的位移方程。x括号t等于A乘以cos括号内，角频率omega乘以t加上初相位phi。这个公式描述了弹簧振子的位移随时间的变化规律。',
  'y = x\\tan\\theta - \\frac{gx^2}{2v_0^2\\cos^2\\theta}': '这是抛体运动的轨迹方程。y等于x乘以tan theta，减去g乘以x的平方，除以2倍v0平方乘以cos平方theta。这个公式描述了抛射物体的运动轨迹是一条抛物线。',
  'I = 4I_0 \\cos^2\\left(\\frac{\\pi d \\sin\\theta}{\\lambda}\\right)': '这是双缝干涉的光强分布公式。I等于4倍I0乘以cos平方，括号内π乘以d乘以sin theta除以lambda。这个公式描述了双缝干涉图案的光强分布。',
  'y = ax^2 + bx + c': '这是二次函数的一般形式。y等于a乘以x的平方，加上b乘以x，再加上c。这个公式描述了一条抛物线，a决定开口方向和大小，b决定对称轴位置，c决定y轴截距。',
  '\\text{键角} = \\theta, \\quad \\text{键长} = d': '这是分子结构的基本参数。键角theta是同一原子上两个共价键之间的夹角，键长d是成键两原子核之间的平衡距离。这些参数决定了分子的空间构型。',
  'v = k [A]^m [B]^n, \\quad k = A e^{-\\frac{E_a}{RT}}': '这是化学反应速率方程。v等于k乘以中括号A的m次方乘以中括号B的n次方。速率常数k等于指前因子A乘以e的负Ea除以RT次方。这个公式描述了反应速率与反应物浓度、温度之间的关系。',
}

export default function FormulaDisplay({ formula, formulaWithValues, params, derivation }: FormulaDisplayProps) {
  const formulaRef = useRef<HTMLDivElement>(null)
  const valuesFormulaRef = useRef<HTMLDivElement>(null)
  const [selectedVariable, setSelectedVariable] = useState<string | null>(null)
  const [hoveredVariable, setHoveredVariable] = useState<string | null>(null)
  const [showVoiceSettings, setShowVoiceSettings] = useState(false)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null)
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const isPausedRef = useRef(false)

  const {
    isSpeaking,
    speakingSegmentIndex,
    voiceConfig,
    setHighlightElement,
    setVoiceConfig,
    setIsSpeaking,
    setSpeakingSegmentIndex,
  } = useExperimentStore()

  useEffect(() => {
    speechSynthesisRef.current = window.speechSynthesis
    const loadVoices = () => {
      const voices = speechSynthesisRef.current?.getVoices() || []
      setAvailableVoices(voices.filter(v => v.lang.startsWith('zh')))
    }
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [])

  const getCanvasElementForSymbol = useCallback((symbol: string, formulaText: string): HighlightElementType | undefined => {
    if (formulaText.includes('x(t)') || formulaText.includes('\\cos')) {
      const springMap: Record<string, HighlightElementType> = {
        'x': 'displacement', 'A': 'displacement', '\\omega': 'trajectory',
        't': 'trajectory', '\\varphi': 'trajectory', 'k': 'spring',
        'm': 'mass', 'T': 'trajectory', 'F': 'force', 'v': 'velocity',
      }
      return springMap[symbol]
    }
    if (formulaText.includes('\\tan') || formulaText.includes('\\cos^2')) {
      const projectileMap: Record<string, HighlightElementType> = {
        'x': 'projectile', 'y': 'projectile', 'v_0': 'velocity_vector',
        '\\theta': 'angle', 'g': 'ground', 'R': 'projectile', 'H': 'projectile',
        't': 'trajectory',
      }
      return projectileMap[symbol]
    }
    if (formulaText.includes('\\cos^2\\left') || formulaText.includes('I = 4')) {
      const waveMap: Record<string, HighlightElementType> = {
        'I': 'interference_pattern', 'I_0': 'interference_pattern',
        'd': 'slit', '\\theta': 'interference_pattern', '\\lambda': 'wave_front',
        'f': 'wave_front', '\\Delta x': 'interference_pattern', 'L': 'screen',
      }
      return waveMap[symbol]
    }
    if (formulaText.includes('ax^2') || formulaText.includes('y = ax')) {
      const functionMap: Record<string, HighlightElementType> = {
        'x': 'coordinate_axis', 'y': 'function_curve', 'a': 'function_curve',
        'b': 'function_curve', 'c': 'function_curve', 'x_0': 'vertex',
        'y_0': 'vertex', '\\Delta': 'coordinate_axis',
      }
      return functionMap[symbol]
    }
    if (formulaText.includes('\\text{键角}') || formulaText.includes('\\text{键长}')) {
      const moleculeMap: Record<string, HighlightElementType> = {
        '\\theta': 'bond', 'd': 'bond', 'n': 'atom', 'E_b': 'atom',
        'r_A': 'atom', 'r_B': 'atom', '\\mu': 'molecule', 'Z^*': 'atom',
      }
      return moleculeMap[symbol]
    }
    if (formulaText.includes('[A]^m') || formulaText.includes('e^{-\\frac{E_a}{RT}}')) {
      const reactionMap: Record<string, HighlightElementType> = {
        'v': 'product', 'k': 'energy_barrier', '[A]': 'reactant_a',
        '[B]': 'reactant_b', 'm': 'reactant_a', 'n': 'reactant_b',
        'A': 'energy_barrier', 'E_a': 'energy_barrier', 'R': 'energy_barrier',
        'T': 'energy_barrier',
      }
      return reactionMap[symbol]
    }
    return variableToCanvasElement[symbol]
  }, [])

  const speechSegments = useMemo<SpeechSegment[]>(() => {
    if (!derivation) return []
    const segments: SpeechSegment[] = []
    const formulaDesc = formulaDescriptions[formula] || `现在讲解公式：${formula.replace(/\\/g, '')}`
    
    let introCanvasElement: HighlightElementType = 'trajectory'
    if (formula.includes('x(t)') || formula.includes('\\cos')) introCanvasElement = 'trajectory'
    else if (formula.includes('\\tan') || formula.includes('\\cos^2')) introCanvasElement = 'projectile'
    else if (formula.includes('I = 4')) introCanvasElement = 'interference_pattern'
    else if (formula.includes('ax^2')) introCanvasElement = 'function_curve'
    else if (formula.includes('\\text{键角}')) introCanvasElement = 'molecule'
    else if (formula.includes('[A]^m')) introCanvasElement = 'container'
    
    segments.push({
      text: formulaDesc,
      canvasElement: introCanvasElement,
    })
    derivation.variables.forEach((v) => {
      const readableName = symbolToReadable[v.symbol] || v.name
      const canvasElement = getCanvasElementForSymbol(v.symbol, formula) || v.canvasElement as HighlightElementType
      segments.push({
        text: `${readableName}。${v.description}。单位是${v.unit}。`,
        variableSymbol: v.symbol,
        canvasElement,
      })
    })
    return segments
  }, [formula, derivation, getCanvasElementForSymbol])

  const stopSpeech = useCallback(() => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel()
    }
    currentUtteranceRef.current = null
    isPausedRef.current = false
    setIsSpeaking(false)
    setSpeakingSegmentIndex(-1)
    setHighlightElement(null)
  }, [setIsSpeaking, setSpeakingSegmentIndex, setHighlightElement])

  const speakSegment = useCallback((segmentIndex: number) => {
    if (!speechSynthesisRef.current || segmentIndex >= speechSegments.length) {
      stopSpeech()
      return
    }

    const segment = speechSegments[segmentIndex]
    const utterance = new SpeechSynthesisUtterance(segment.text)
    
    utterance.rate = voiceConfig.rate
    utterance.pitch = voiceConfig.pitch
    utterance.volume = voiceConfig.volume
    
    if (voiceConfig.voiceName && availableVoices.length > 0) {
      const voice = availableVoices.find(v => v.name === voiceConfig.voiceName)
      if (voice) {
        utterance.voice = voice
      }
    } else if (availableVoices.length > 0) {
      utterance.voice = availableVoices[0]
    }

    utterance.lang = 'zh-CN'

    utterance.onstart = () => {
      setIsSpeaking(true)
      setSpeakingSegmentIndex(segmentIndex)
      if (segment.canvasElement) {
        setHighlightElement(segment.canvasElement)
      }
      if (segment.variableSymbol) {
        setSelectedVariable(segment.variableSymbol)
      }
    }

    utterance.onend = () => {
      if (!isPausedRef.current) {
        setTimeout(() => {
          speakSegment(segmentIndex + 1)
        }, 500)
      }
    }

    utterance.onerror = () => {
      stopSpeech()
    }

    currentUtteranceRef.current = utterance
    speechSynthesisRef.current.speak(utterance)
  }, [speechSegments, voiceConfig, availableVoices, setIsSpeaking, setSpeakingSegmentIndex, setHighlightElement, stopSpeech])

  const handleStartSpeech = useCallback(() => {
    if (isPausedRef.current && speechSynthesisRef.current) {
      speechSynthesisRef.current.resume()
      isPausedRef.current = false
      return
    }
    
    if (speechSynthesisRef.current?.speaking) {
      stopSpeech()
    }
    
    isPausedRef.current = false
    speakSegment(0)
  }, [speakSegment, stopSpeech])

  const handlePauseSpeech = useCallback(() => {
    if (speechSynthesisRef.current) {
      if (isPausedRef.current) {
        speechSynthesisRef.current.resume()
        isPausedRef.current = false
      } else {
        speechSynthesisRef.current.pause()
        isPausedRef.current = true
      }
    }
  }, [])

  useEffect(() => {
    return () => {
      stopSpeech()
    }
  }, [stopSpeech])

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

  const currentSegmentText = speakingSegmentIndex >= 0 && speakingSegmentIndex < speechSegments.length
    ? speechSegments[speakingSegmentIndex].text
    : ''

  return (
    <div className="glass-panel rounded-xl p-5">
      <h3
        className="text-sm font-orbitron mb-4 tracking-wider flex items-center justify-between"
        style={{ color: 'var(--color-neon-cyan)' }}
      >
        <span>物理公式</span>
        <div className="flex items-center gap-2">
          {derivation && (
            <span className="text-[10px] font-normal flex items-center gap-1 text-slate-400">
              <MousePointerClick className="w-3 h-3" />
              点击变量查看详情
            </span>
          )}
        </div>
      </h3>

      {derivation && (
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <button
            onClick={isSpeaking ? handlePauseSpeech : handleStartSpeech}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all
              ${isSpeaking 
                ? 'bg-neon-green/20 text-neon-green border border-neon-green/50' 
                : 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/20'
              }
            `}
          >
            {isSpeaking && !isPausedRef.current ? (
              <><Pause className="w-3.5 h-3.5" /> 暂停讲解</>
            ) : isSpeaking && isPausedRef.current ? (
              <><Play className="w-3.5 h-3.5" /> 继续讲解</>
            ) : (
              <><Volume2 className="w-3.5 h-3.5" /> 朗读讲解</>
            )}
          </button>

          {isSpeaking && (
            <button
              onClick={stopSpeech}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all
                bg-slate-700/50 text-slate-300 border border-slate-600/50 hover:bg-slate-600/50"
            >
              <RotateCcw className="w-3.5 h-3.5" /> 停止
            </button>
          )}

          <button
            onClick={() => setShowVoiceSettings(!showVoiceSettings)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all
              ${showVoiceSettings 
                ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/50' 
                : 'bg-slate-700/50 text-slate-300 border border-slate-600/50 hover:bg-slate-600/50'
              }
            `}
          >
            <Settings className="w-3.5 h-3.5" /> 语音设置
          </button>
        </div>
      )}

      {showVoiceSettings && (
        <div className="mb-4 p-4 rounded-lg bg-space-900/50 border border-neon-purple/30 space-y-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">语速: {voiceConfig.rate.toFixed(1)}x</label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={voiceConfig.rate}
              onChange={(e) => setVoiceConfig({ rate: parseFloat(e.target.value) })}
              className="w-full accent-neon-purple"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">音调: {voiceConfig.pitch.toFixed(1)}</label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={voiceConfig.pitch}
              onChange={(e) => setVoiceConfig({ pitch: parseFloat(e.target.value) })}
              className="w-full accent-neon-purple"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">音量: {voiceConfig.volume.toFixed(1)}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={voiceConfig.volume}
              onChange={(e) => setVoiceConfig({ volume: parseFloat(e.target.value) })}
              className="w-full accent-neon-purple"
            />
          </div>
          {availableVoices.length > 0 && (
            <div>
              <label className="text-xs text-slate-400 mb-1 block">音色</label>
              <select
                value={voiceConfig.voiceName}
                onChange={(e) => setVoiceConfig({ voiceName: e.target.value })}
                className="w-full bg-space-800 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-200"
              >
                <option value="">默认语音</option>
                {availableVoices.map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {isSpeaking && currentSegmentText && (
        <div className="mb-4 p-3 rounded-lg bg-neon-green/10 border border-neon-green/30">
          <div className="flex items-start gap-2">
            <Volume2 className="w-4 h-4 text-neon-green mt-0.5 animate-pulse" />
            <p className="text-xs text-neon-green leading-relaxed">
              {currentSegmentText}
            </p>
          </div>
          <div className="mt-2 flex gap-1">
            {speechSegments.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all ${
                  i < speakingSegmentIndex
                    ? 'bg-neon-green/60'
                    : i === speakingSegmentIndex
                    ? 'bg-neon-green animate-pulse'
                    : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>
      )}

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
                  ${speakingSegmentIndex >= 0 && speechSegments[speakingSegmentIndex]?.variableSymbol === v.symbol
                    ? 'border-neon-green bg-neon-green/20 text-neon-green animate-pulse'
                    : selectedVariable === v.symbol
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
