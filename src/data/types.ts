export type GuideStepType = 'observe' | 'hypothesis' | 'operate' | 'verify' | 'conclusion'

export interface GuideStep {
  type: GuideStepType
  title: string
  tip: string
  explanation: string
  highlightArea: 'canvas' | 'params' | 'formula' | 'chart' | 'controls' | 'info'
}

export interface Experiment {
  id: string
  title: string
  category: 'physics' | 'math' | 'chemistry'
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
  icon: string
  guide: GuideStep[]
}

export interface ParamConfig {
  key: string
  label: string
  defaultValue: number
  min: number
  max: number
  step: number
  unit: string
}

export type TemplateCategory = 'classic' | 'extreme' | 'counterintuitive'

export interface Template {
  id: string
  name: string
  category: TemplateCategory
  params: Record<string, number>
}

export interface SavedTemplate extends Template {
  experimentId: string
  createdAt: number
}

export interface ExperimentConfig {
  experiment: Experiment
  params: ParamConfig[]
  formula: string
  templates: Template[]
}

export interface DragEvent {
  type: 'start' | 'move' | 'end'
  x: number
  y: number
}

export interface DragResult {
  handled: boolean
  params?: Record<string, number>
}

export interface EngineData {
  time: number
  primary: number
  secondary: number
}

export interface ExperimentEngine {
  init(canvas: HTMLCanvasElement, params: Record<string, number>, width?: number, height?: number): void
  update(dt: number, params: Record<string, number>): void
  render(): void
  handleDrag(event: DragEvent): DragResult
  getData(): EngineData
  getFormulaWithValues(params: Record<string, number>): string
  destroy(): void
}

