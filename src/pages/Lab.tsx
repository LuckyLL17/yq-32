import { useEffect, useMemo, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Play, Pause, RotateCcw, GraduationCap } from 'lucide-react'
import { experiments } from '@/data/experiments'
import type { ExperimentEngine, EngineData, Template } from '@/data/types'
import { useExperimentStore } from '@/stores/experimentStore'
import ExperimentCanvas from '@/components/canvas/ExperimentCanvas'
import ParamSlider from '@/components/controls/ParamSlider'
import TemplateSelector from '@/components/controls/TemplateSelector'
import FormulaDisplay from '@/components/formula/FormulaDisplay'
import DataChart from '@/components/charts/DataChart'
import Sidebar from '@/components/layout/Sidebar'
import ExperimentGuide from '@/components/guide/ExperimentGuide'
import { SpringEngine } from '@/engines/spring'
import { ProjectileEngine } from '@/engines/projectile'
import { WaveEngine } from '@/engines/wave'
import { FunctionEngine } from '@/engines/function'
import { MoleculeEngine } from '@/engines/molecule'
import { ReactionEngine } from '@/engines/reaction'

const difficultyLabels: Record<string, { text: string; color: string }> = {
  beginner: { text: '入门', color: 'var(--color-neon-green)' },
  intermediate: { text: '进阶', color: 'var(--color-neon-orange)' },
  advanced: { text: '高级', color: 'var(--color-neon-purple)' },
}

export default function Lab() {
  const { experimentId } = useParams<{ experimentId: string }>()
  const config = useMemo(() => experiments.find((e) => e.experiment.id === experimentId), [experimentId])

  const {
    params,
    isRunning,
    chartData,
    guideVisible,
    savedTemplates,
    selectedTemplateId,
    setCurrentExperiment,
    setParam,
    setParams,
    setIsRunning,
    addChartData,
    clearChartData,
    resetParams,
    resetAll,
    showGuide,
    applyTemplate,
    saveTemplate,
    deleteSavedTemplate,
  } = useExperimentStore()

  const engine = useMemo<ExperimentEngine | null>(() => {
    if (!experimentId) return null
    switch (experimentId) {
      case 'spring':
        return new SpringEngine()
      case 'projectile':
        return new ProjectileEngine()
      case 'wave':
        return new WaveEngine()
      case 'function':
        return new FunctionEngine()
      case 'molecule':
        return new MoleculeEngine()
      case 'reaction':
        return new ReactionEngine()
      default:
        return null
    }
  }, [experimentId])

  useEffect(() => {
    if (!config) return
    setCurrentExperiment(config.experiment.id)
    const defaultParams: Record<string, number> = {}
    config.params.forEach((p) => {
      defaultParams[p.key] = p.defaultValue
    })
    setParams(defaultParams)
    setIsRunning(true)
    clearChartData()
  }, [config, setCurrentExperiment, setParams, setIsRunning, clearChartData])

  useEffect(() => {
    return () => {
      resetAll()
    }
  }, [resetAll])

  const handleDataUpdate = useCallback((data: EngineData) => {
    addChartData({ x: data.time, y: data.primary })
  }, [addChartData])

  if (!config || !engine) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-space-900">
        <div className="text-center">
          <h1 className="font-orbitron text-4xl font-bold text-neon-cyan glow-text mb-4">实验不存在</h1>
          <p className="text-slate-400">请返回实验库选择其他实验</p>
        </div>
      </div>
    )
  }

  const defaultParams: Record<string, number> = {}
  config.params.forEach((p) => {
    defaultParams[p.key] = p.defaultValue
  })

  const handleReset = () => {
    resetParams(defaultParams)
    clearChartData()
  }

  const formulaWithValues = engine.getFormulaWithValues(params)

  const handleStartGuide = () => {
    if (config?.experiment.guide) {
      showGuide(config.experiment.guide)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-space-900">
      <Sidebar />
      <div className="flex-1 ml-16 flex h-full">
        <div className="flex-1 relative overflow-hidden" data-guide-area="canvas">
          <ExperimentCanvas
            engine={engine}
            params={params}
            onParamChange={(newParams) => setParams(newParams)}
            onDataUpdate={handleDataUpdate}
            running={isRunning}
          />
          {!guideVisible && config?.experiment.guide && (
            <button
              onClick={handleStartGuide}
              className="guide-start-btn absolute top-4 left-4 z-10"
            >
              <GraduationCap className="w-4 h-4" />
              开始实验引导
            </button>
          )}
        </div>
        <div className="w-[320px] flex-shrink-0 border-l border-neon-cyan/20 bg-space-800/50 backdrop-blur-xl overflow-y-auto p-4 space-y-4">
          <div className="glass-panel rounded-xl p-5" data-guide-area="info">
            <h1 className="font-orbitron text-xl font-bold text-white mb-2">{config.experiment.title}</h1>
            <p className="text-sm text-slate-400 leading-relaxed mb-3">{config.experiment.description}</p>
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-medium"
              style={{
                borderColor: difficultyLabels[config.experiment.difficulty].color,
                border: `1px solid ${difficultyLabels[config.experiment.difficulty].color}`,
                color: difficultyLabels[config.experiment.difficulty].color,
              }}
            >
              {difficultyLabels[config.experiment.difficulty].text}
            </span>
          </div>

          <div className="glass-panel rounded-xl p-5" data-guide-area="controls">
            <h3 className="text-sm font-orbitron mb-4 tracking-wider" style={{ color: 'var(--color-neon-cyan)' }}>
              运行控制
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="neon-btn flex-1 flex items-center justify-center gap-2"
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isRunning ? '暂停' : '播放'}
              </button>
              <button
                onClick={handleReset}
                className="neon-btn neon-btn-orange flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                重置
              </button>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-5 space-y-5" data-guide-area="params">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-orbitron tracking-wider" style={{ color: 'var(--color-neon-cyan)' }}>
                参数调节
              </h3>
            </div>
            {config.templates && config.templates.length > 0 && (
              <TemplateSelector
                builtInTemplates={config.templates}
                savedTemplates={savedTemplates.filter((t) => t.experimentId === experimentId)}
                selectedTemplateId={selectedTemplateId}
                onSelectTemplate={(template: Template) => {
                  applyTemplate(template.params, template.id)
                }}
                onSaveTemplate={(name) => {
                  if (experimentId) {
                    saveTemplate(name, experimentId, params)
                  }
                }}
                onDeleteSavedTemplate={deleteSavedTemplate}
              />
            )}
            {config.params.map((p) => (
              <ParamSlider
                key={p.key}
                label={p.label}
                value={params[p.key] ?? p.defaultValue}
                min={p.min}
                max={p.max}
                step={p.step}
                unit={p.unit}
                onChange={(v) => setParam(p.key, v)}
              />
            ))}
          </div>

          <div data-guide-area="formula">
            <FormulaDisplay formula={config.formula} formulaWithValues={formulaWithValues} params={params} />
          </div>

          <div className="h-56" data-guide-area="chart">
            <DataChart data={chartData} xLabel="时间 (s)" yLabel="值" />
          </div>
        </div>
      </div>
      <ExperimentGuide />
    </div>
  )
}
