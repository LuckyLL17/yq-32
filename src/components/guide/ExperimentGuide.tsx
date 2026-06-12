import { useEffect, useMemo, useRef, useState } from 'react'
import { useExperimentStore } from '@/stores/experimentStore'
import { X, ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react'

const stepIcons: Record<string, string> = {
  observe: '👁️',
  hypothesis: '💭',
  operate: '🔧',
  verify: '📊',
  conclusion: '✅',
}

export default function ExperimentGuide() {
  const {
    guideVisible,
    currentGuideStep,
    currentGuide,
    hideGuide,
    nextGuideStep,
    prevGuideStep,
    setCurrentGuideStep,
  } = useExperimentStore()

  const [cardPosition, setCardPosition] = useState({ top: 0, left: 0, arrow: 'bottom' as 'top' | 'bottom' | 'left' | 'right' })
  const cardRef = useRef<HTMLDivElement>(null)

  const currentStep = useMemo(() => {
    if (!currentGuide || currentGuideStep < 0 || currentGuideStep >= currentGuide.length) {
      return null
    }
    return currentGuide[currentGuideStep]
  }, [currentGuide, currentGuideStep])

  useEffect(() => {
    if (!guideVisible || !currentStep) return

    const updatePosition = () => {
      const targetSelector = `[data-guide-area="${currentStep.highlightArea}"]`
      const targetElement = document.querySelector(targetSelector) as HTMLElement

      if (!targetElement) {
        setCardPosition({ top: window.innerHeight / 2 - 150, left: window.innerWidth / 2 - 190, arrow: 'bottom' })
        return
      }

      const rect = targetElement.getBoundingClientRect()
      const cardWidth = 380
      const cardHeight = 320
      const gap = 20

      let top = 0
      let left = 0
      let arrow: 'top' | 'bottom' | 'left' | 'right' = 'bottom'

      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      const spaceRight = window.innerWidth - rect.right
      const spaceLeft = rect.left

      if (spaceBelow >= cardHeight + gap) {
        top = rect.bottom + gap
        left = rect.left + rect.width / 2 - cardWidth / 2
        arrow = 'top'
      } else if (spaceAbove >= cardHeight + gap) {
        top = rect.top - cardHeight - gap
        left = rect.left + rect.width / 2 - cardWidth / 2
        arrow = 'bottom'
      } else if (spaceRight >= cardWidth + gap) {
        top = rect.top + rect.height / 2 - cardHeight / 2
        left = rect.right + gap
        arrow = 'left'
      } else if (spaceLeft >= cardWidth + gap) {
        top = rect.top + rect.height / 2 - cardHeight / 2
        left = rect.left - cardWidth - gap
        arrow = 'right'
      } else {
        top = window.innerHeight / 2 - cardHeight / 2
        left = window.innerWidth / 2 - cardWidth / 2
        arrow = 'bottom'
      }

      left = Math.max(20, Math.min(left, window.innerWidth - cardWidth - 20))
      top = Math.max(20, Math.min(top, window.innerHeight - cardHeight - 20))

      setCardPosition({ top, left, arrow })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [guideVisible, currentStep])

  useEffect(() => {
    if (!guideVisible || !currentStep) return

    const highlightElements = document.querySelectorAll(`[data-guide-area="${currentStep.highlightArea}"]`)
    highlightElements.forEach((el) => {
      el.classList.add('guide-highlight')
    })

    return () => {
      highlightElements.forEach((el) => {
        el.classList.remove('guide-highlight')
      })
    }
  }, [guideVisible, currentStep])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!guideVisible) return
      if (e.key === 'Escape') {
        hideGuide()
      } else if (e.key === 'ArrowRight') {
        nextGuideStep()
      } else if (e.key === 'ArrowLeft') {
        prevGuideStep()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [guideVisible, hideGuide, nextGuideStep, prevGuideStep])

  if (!guideVisible || !currentStep || !currentGuide) {
    return null
  }

  const isFirstStep = currentGuideStep === 0
  const isLastStep = currentGuideStep === currentGuide.length - 1

  return (
    <>
      <div className="guide-overlay" />

      <div
        ref={cardRef}
        className={`guide-card arrow-${cardPosition.arrow}`}
        style={{ top: cardPosition.top, left: cardPosition.left }}
      >
        <button className="guide-btn-close" onClick={hideGuide} aria-label="关闭引导">
          <X className="w-4 h-4" />
        </button>

        <div className="guide-step-indicator">
          {currentGuide.map((_, index) => (
            <div
              key={index}
              className={`guide-step-dot ${index === currentGuideStep ? 'active' : index < currentGuideStep ? 'completed' : ''}`}
              onClick={() => setCurrentGuideStep(index)}
              title={`第 ${index + 1} 步`}
            />
          ))}
        </div>

        <div className="guide-title">
          {stepIcons[currentStep.type]} {currentStep.title}
        </div>

        <div className="guide-tip">
          <Lightbulb className="w-3 h-3 inline mr-1" />
          {currentStep.tip}
        </div>

        <div className="guide-explanation">
          {currentStep.explanation}
        </div>

        <div className="guide-actions">
          <button
            className="guide-btn"
            onClick={prevGuideStep}
            disabled={isFirstStep}
          >
            <ChevronLeft className="w-4 h-4 inline" /> 上一步
          </button>

          {isLastStep ? (
            <button
              className="guide-btn guide-btn-primary"
              onClick={hideGuide}
            >
              完成实验 ✨
            </button>
          ) : (
            <button
              className="guide-btn guide-btn-primary"
              onClick={nextGuideStep}
            >
              下一步 <ChevronRight className="w-4 h-4 inline" />
            </button>
          )}
        </div>

        <div className="guide-progress-text">
          步骤 {currentGuideStep + 1} / {currentGuide.length}
          {isLastStep && ' · 最后一步，加油！'}
        </div>
      </div>
    </>
  )
}
