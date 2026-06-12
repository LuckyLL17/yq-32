import { create } from 'zustand'

interface ExperimentState {
  currentExperimentId: string | null
  params: Record<string, number>
  isRunning: boolean
  time: number
  chartData: { x: number; y: number }[]

  setCurrentExperiment: (id: string) => void
  setParam: (key: string, value: number) => void
  setParams: (params: Record<string, number>) => void
  setIsRunning: (running: boolean) => void
  setTime: (time: number) => void
  addChartData: (point: { x: number; y: number }) => void
  clearChartData: () => void
  resetParams: (defaultParams: Record<string, number>) => void
  resetAll: () => void
}

export const useExperimentStore = create<ExperimentState>((set) => ({
  currentExperimentId: null,
  params: {},
  isRunning: false,
  time: 0,
  chartData: [],

  setCurrentExperiment: (id) => set({ currentExperimentId: id }),
  setParam: (key, value) => set((state) => ({ params: { ...state.params, [key]: value } })),
  setParams: (params) => set({ params }),
  setIsRunning: (running) => set({ isRunning: running }),
  setTime: (time) => set({ time }),
  addChartData: (point) => set((state) => ({ chartData: [...state.chartData.slice(-200), point] })),
  clearChartData: () => set({ chartData: [] }),
  resetParams: (defaultParams) => set({ params: defaultParams, time: 0, isRunning: false }),
  resetAll: () => set({ currentExperimentId: null, params: {}, isRunning: false, time: 0, chartData: [] }),
}))
