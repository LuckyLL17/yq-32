import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import ExperimentCard from '@/components/ExperimentCard'
import { experiments } from '@/data/experiments'
import { cn } from '@/lib/utils'

type CategoryFilter = 'all' | 'physics' | 'math' | 'chemistry'
type DifficultyFilter = 'beginner' | 'intermediate' | 'advanced'

const categoryLabels: Record<CategoryFilter, string> = {
  all: '全部',
  physics: '物理',
  math: '数学',
  chemistry: '化学',
}

const difficultyLabels: Record<DifficultyFilter, string> = {
  beginner: '入门',
  intermediate: '进阶',
  advanced: '高级',
}

const difficultyColors: Record<DifficultyFilter, string> = {
  beginner: 'border-green-500/50 text-green-400 bg-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.3)]',
  intermediate: 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10 shadow-[0_0_15px_rgba(234,179,8,0.3)]',
  advanced: 'border-red-500/50 text-red-400 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.3)]',
}

export default function Library() {
  const navigate = useNavigate()
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [difficultyFilters, setDifficultyFilters] = useState<DifficultyFilter[]>([])

  const toggleDifficulty = (difficulty: DifficultyFilter) => {
    setDifficultyFilters((prev) =>
      prev.includes(difficulty) ? prev.filter((d) => d !== difficulty) : [...prev, difficulty]
    )
  }

  const filteredExperiments = experiments.filter((config) => {
    const categoryMatch = categoryFilter === 'all' || config.experiment.category === categoryFilter
    const difficultyMatch =
      difficultyFilters.length === 0 || difficultyFilters.includes(config.experiment.difficulty as DifficultyFilter)
    return categoryMatch && difficultyMatch
  })

  return (
    <Layout>
      <div className="relative min-h-screen canvas-grid">
        <div className="absolute inset-0 bg-gradient-to-b from-space-900 via-space-900/95 to-space-900 pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-cyan/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-purple/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-6 py-12">
          <div className="text-center mb-12">
            <h1 className="font-orbitron text-4xl md:text-5xl font-bold text-neon-cyan glow-text mb-4">
              实验库
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              探索交互式科学实验，通过可视化模拟理解物理、数学、化学的核心概念
            </p>
          </div>

          <div className="flex flex-col gap-6 mb-10">
            <div className="flex flex-wrap justify-center gap-3">
              {(Object.keys(categoryLabels) as CategoryFilter[]).map((category) => {
                const isActive = categoryFilter === category
                return (
                  <button
                    key={category}
                    onClick={() => setCategoryFilter(category)}
                    className={cn(
                      'px-6 py-2.5 rounded-lg font-medium transition-all duration-300',
                      isActive
                        ? 'bg-neon-cyan/10 text-neon-cyan border-2 border-neon-cyan/60 shadow-[0_0_20px_rgba(0,240,255,0.3)]'
                        : 'glass-panel text-slate-300 border border-slate-600/30 hover:border-neon-cyan/30 hover:text-neon-cyan/80'
                    )}
                  >
                    {categoryLabels[category]}
                  </button>
                )
              })}
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {(Object.keys(difficultyLabels) as DifficultyFilter[]).map((difficulty) => {
                const isActive = difficultyFilters.includes(difficulty)
                return (
                  <button
                    key={difficulty}
                    onClick={() => toggleDifficulty(difficulty)}
                    className={cn(
                      'px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-300',
                      isActive
                        ? difficultyColors[difficulty]
                        : 'border-slate-600/30 text-slate-400 hover:border-slate-500/50 hover:text-slate-300'
                    )}
                  >
                    {difficultyLabels[difficulty]}
                  </button>
                )
              })}
            </div>
          </div>

          {filteredExperiments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredExperiments.map((config) => (
                <ExperimentCard
                  key={config.experiment.id}
                  config={config}
                  onClick={() => navigate(`/lab/${config.experiment.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-20 h-20 rounded-full glass-panel flex items-center justify-center mb-6">
                <svg
                  className="w-10 h-10 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
              </div>
              <p className="text-slate-400 text-lg">暂无该学科实验</p>
              <p className="text-slate-500 text-sm mt-2">请尝试选择其他筛选条件</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
