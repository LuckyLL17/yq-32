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
  formulaDerivation: FormulaDerivation
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

export interface VariableDefinition {
  symbol: string
  name: string
  dimension: string
  unit: string
  description: string
  relatedVariables?: string[]
  canvasElement?: string
}

export type HighlightElementType = 'mass' | 'spring' | 'wall' | 'displacement' | 'velocity' | 'force' | 'trajectory' | 'projectile' | 'ground' | 'velocity_vector' | 'angle' | 'wave_source' | 'wave_front' | 'interference_pattern' | 'slit' | 'screen' | 'function_curve' | 'coordinate_axis' | 'vertex' | 'atom' | 'bond' | 'molecule' | 'reactant_a' | 'reactant_b' | 'product' | 'container' | 'energy_barrier'

export interface HighlightElement {
  type: HighlightElementType
  active: boolean
  intensity: number
}

export interface VoiceConfig {
  rate: number
  pitch: number
  volume: number
  voiceName: string
}

export interface SpeechSegment {
  text: string
  variableSymbol?: string
  canvasElement?: HighlightElementType
  duration?: number
}

export interface FormulaSpeechData {
  formulaDescription: string
  variableSegments: SpeechSegment[]
  fullText: string
}

export interface DerivationStep {
  id: string
  formula: string
  explanation: string
  theorem: {
    name: string
    description: string
    formula?: string
  }
}

export interface FormulaDerivation {
  variables: VariableDefinition[]
  derivationSteps: DerivationStep[]
  relatedFormulas?: {
    name: string
    formula: string
    description: string
  }[]
}

export interface StrokeAnnotation {
  type: 'stroke'
  color: string
  lineWidth: number
  points: { x: number; y: number }[]
  isEraser?: boolean
}

export interface ArrowAnnotation {
  type: 'arrow'
  color: string
  from: { x: number; y: number }
  to: { x: number; y: number }
}

export interface CircleAnnotation {
  type: 'circle'
  color: string
  center: { x: number; y: number }
  radius: number
}

export interface TextAnnotation {
  type: 'text'
  color: string
  position: { x: number; y: number }
  content: string
}

export type Annotation = StrokeAnnotation | ArrowAnnotation | CircleAnnotation | TextAnnotation

export interface SavedNote {
  id: string
  name: string
  experimentId: string
  annotations: Annotation[]
  createdAt: number
  updatedAt: number
}

export type BrushTool = 'pen' | 'eraser' | 'arrow' | 'circle' | 'text'
export type PenColor = '#ef4444' | '#eab308' | '#3b82f6'

export type MeasureTool = 'none' | 'coordinate' | 'distance' | 'angle'

export interface Point {
  x: number
  y: number
}

export interface CoordinateMeasure {
  id: string
  type: 'coordinate'
  point: Point
  pinned: boolean
  color: string
}

export interface DistanceMeasure {
  id: string
  type: 'distance'
  from: Point
  to: Point
  distance: number
  pinned: boolean
  color: string
}

export interface AngleMeasure {
  id: string
  type: 'angle'
  vertex: Point
  point1: Point
  point2: Point
  angle: number
  pinned: boolean
  color: string
}

export type Measure = CoordinateMeasure | DistanceMeasure | AngleMeasure

export interface ExperimentEngine {
  init(canvas: HTMLCanvasElement, params: Record<string, number>, width?: number, height?: number): void
  update(dt: number, params: Record<string, number>): void
  render(): void
  handleDrag(event: DragEvent): DragResult
  getData(): EngineData
  getFormulaWithValues(params: Record<string, number>): string
  setHighlightElement(element: HighlightElementType | null): void
  destroy(): void
}

