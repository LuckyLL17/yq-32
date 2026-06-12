import { create } from 'zustand'
import type { GuideStep } from '@/data/types'

interface ExperimentState {
  currentExperimentId: string | null
  params: Record<string, number>
  isRunning: boolean
  chartData: { x: number; y: number }[]
  guideVisible: boolean
  currentGuideStep: number
  currentGuide: GuideStep[] | null

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
}

export const useExperimentStore = create<ExperimentState>((set, get) => ({
  currentExperimentId: null,
  params: {},
  isRunning: false,
  chartData: [],
  guideVisible: false,
  currentGuideStep: 0,
  currentGuide: null,

  setCurrentExperiment: (id) => set({ currentExperimentId: id }),
  setParam: (key, value) => set((state) => ({ params: { ...state.params, [key]: value } })),
  setParams: (params) => set({ params }),
  setIsRunning: (running) => set({ isRunning: running }),
  addChartData: (point) => set((state) => ({ chartData: [...state.chartData.slice(-200), point] })),
  clearChartData: () => set({ chartData: [] }),
  resetParams: (defaultParams) => set({ params: defaultParams, isRunning: false }),
  resetAll: () => set({ currentExperimentId: null, params: {}, isRunning: false, chartData: [] }),
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
}))
