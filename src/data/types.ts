export interface Experiment {
  id: string
  title: string
  category: 'physics' | 'math' | 'chemistry'
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
  icon: string
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

export interface ExperimentConfig {
  experiment: Experiment
  params: ParamConfig[]
  formula: string
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
  init(canvas: HTMLCanvasElement, params: Record<string, number>): void
  update(dt: number, params: Record<string, number>): void
  render(): void
  handleDrag(event: DragEvent): DragResult
  getData(): EngineData
  getFormulaWithValues(params: Record<string, number>): string
  destroy(): void
}

