import { create } from 'zustand'
import type { GuideStep, SavedTemplate, HighlightElementType, VoiceConfig, MeasureTool, Measure } from '@/data/types'

const SAVED_TEMPLATES_KEY = 'lab_saved_templates'

const loadSavedTemplates = (): SavedTemplate[] => {
  try {
    const stored = localStorage.getItem(SAVED_TEMPLATES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

const saveSavedTemplates = (templates: SavedTemplate[]) => {
  try {
    localStorage.setItem(SAVED_TEMPLATES_KEY, JSON.stringify(templates))
  } catch {
    // ignore
  }
}

interface ExperimentState {
  currentExperimentId: string | null
  params: Record<string, number>
  isRunning: boolean
  chartData: { x: number; y: number }[]
  guideVisible: boolean
  currentGuideStep: number
  currentGuide: GuideStep[] | null
  savedTemplates: SavedTemplate[]
  selectedTemplateId: string | null

  brushMode: boolean
  setBrushMode: (mode: boolean) => void

  highlightElement: HighlightElementType | null
  setHighlightElement: (element: HighlightElementType | null) => void

  isSpeaking: boolean
  speakingSegmentIndex: number
  voiceConfig: VoiceConfig
  setVoiceConfig: (config: Partial<VoiceConfig>) => void
  setIsSpeaking: (speaking: boolean) => void
  setSpeakingSegmentIndex: (index: number) => void

  setCurrentExperiment: (id: string) => void
  setParam: (key: string, value: number) => void
  setParams: (params: Record<string, number>) => void
  setIsRunning: (running: boolean) => void
  addChartData: (point: { x: number; y: number }) => void
  clearChartData: () => void
  resetParams: (defaultParams: Record<string, number>) => void
  resetAll: () => void
  showGuide: (guide: GuideStep[]) => void
  hideGuide: () => void
  setCurrentGuideStep: (step: number) => void
  nextGuideStep: () => void
  prevGuideStep: () => void
  applyTemplate: (templateParams: Record<string, number>, templateId: string) => void
  saveTemplate: (name: string, experimentId: string, params: Record<string, number>) => void
  deleteSavedTemplate: (templateId: string) => void
  setSelectedTemplateId: (id: string | null) => void

  measureTool: MeasureTool
  setMeasureTool: (tool: MeasureTool) => void

  measureColor: string
  setMeasureColor: (color: string) => void

  measures: Measure[]
  addMeasure: (measure: Measure) => void
  removeMeasure: (id: string) => void
  togglePinMeasure: (id: string) => void
  clearMeasures: () => void
  updateMeasure: (id: string, updates: Partial<Measure>) => void
}

export const useExperimentStore = create<ExperimentState>((set, get) => ({
  currentExperimentId: null,
  params: {},
  isRunning: false,
  chartData: [],
  guideVisible: false,
  currentGuideStep: 0,
  currentGuide: null,
  savedTemplates: loadSavedTemplates(),
  selectedTemplateId: null,
  brushMode: false,
  highlightElement: null,
  isSpeaking: false,
  speakingSegmentIndex: -1,
  voiceConfig: {
    rate: 1,
    pitch: 1,
    volume: 1,
    voiceName: '',
  },
  measureTool: 'none',
  measureColor: '#00f0ff',
  measures: [],

  setCurrentExperiment: (id) => set({ currentExperimentId: id, selectedTemplateId: null }),
  setParam: (key, value) => set((state) => ({ params: { ...state.params, [key]: value }, selectedTemplateId: null })),
  setParams: (params) => set({ params, selectedTemplateId: null }),
  setIsRunning: (running) => set({ isRunning: running }),
  addChartData: (point) => set((state) => ({ chartData: [...state.chartData.slice(-200), point] })),
  clearChartData: () => set({ chartData: [] }),
  resetParams: (defaultParams) => set({ params: defaultParams, isRunning: false, selectedTemplateId: null }),
  resetAll: () => set({ 
    currentExperimentId: null, 
    params: {}, 
    isRunning: false, 
    chartData: [], 
    selectedTemplateId: null, 
    brushMode: false,
    highlightElement: null,
    isSpeaking: false,
    speakingSegmentIndex: -1,
    measureTool: 'none',
    measureColor: '#00f0ff',
    measures: [],
  }),
  showGuide: (guide) => set({ guideVisible: true, currentGuideStep: 0, currentGuide: guide }),
  hideGuide: () => set({ guideVisible: false, currentGuideStep: 0, currentGuide: null }),
  setCurrentGuideStep: (step) => set({ currentGuideStep: step }),
  nextGuideStep: () => {
    const { currentGuideStep, currentGuide } = get()
    if (currentGuide && currentGuideStep < currentGuide.length - 1) {
      set({ currentGuideStep: currentGuideStep + 1 })
    }
  },
  prevGuideStep: () => {
    const { currentGuideStep } = get()
    if (currentGuideStep > 0) {
      set({ currentGuideStep: currentGuideStep - 1 })
    }
  },
  applyTemplate: (templateParams, templateId) => {
    set({ params: templateParams, selectedTemplateId: templateId, chartData: [] })
  },
  saveTemplate: (name, experimentId, params) => {
    const newTemplate: SavedTemplate = {
      id: `saved-${Date.now()}`,
      name,
      category: 'classic',
      params,
      experimentId,
      createdAt: Date.now(),
    }
    const updated = [...get().savedTemplates, newTemplate]
    set({ savedTemplates: updated })
    saveSavedTemplates(updated)
  },
  deleteSavedTemplate: (templateId) => {
    const updated = get().savedTemplates.filter((t) => t.id !== templateId)
    set({ savedTemplates: updated })
    saveSavedTemplates(updated)
  },
  setSelectedTemplateId: (id) => set({ selectedTemplateId: id }),
  setBrushMode: (mode) => set({ brushMode: mode }),
  setHighlightElement: (element) => set({ highlightElement: element }),
  setVoiceConfig: (config) => set((state) => ({ 
    voiceConfig: { ...state.voiceConfig, ...config } 
  })),
  setIsSpeaking: (speaking) => set({ isSpeaking: speaking }),
  setSpeakingSegmentIndex: (index) => set({ speakingSegmentIndex: index }),
  setMeasureTool: (tool) => set({ measureTool: tool }),
  setMeasureColor: (color) => set({ measureColor: color }),
  addMeasure: (measure) => set((state) => ({ measures: [...state.measures, measure] })),
  removeMeasure: (id) => set((state) => ({ measures: state.measures.filter((m) => m.id !== id) })),
  togglePinMeasure: (id) => set((state) => ({
    measures: state.measures.map((m) =>
      m.id === id ? { ...m, pinned: !m.pinned } : m
    ),
  })),
  clearMeasures: () => set({ measures: [] }),
  updateMeasure: (id, updates) => set((state) => ({
    measures: state.measures.map((m) =>
      m.id === id ? { ...m, ...updates } as Measure : m
    ),
  })),
}))
