import type { ExperimentConfig } from '@/data/types'
import { Zap, ArrowUpRight, Waves, TrendingUp, Atom } from 'lucide-react'
import { cn } from '@/lib/utils'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap,
  ArrowUpRight,
  Waves,
  TrendingUp,
  Atom,
}

const categoryGradient: Record<string, string> = {
  physics: 'from-[#1e3a8a] to-[#0ea5e9]',
  math: 'from-[#581c87] to-[#a855f7]',
  chemistry: 'from-[#064e3b] to-[#10b981]',
}

const categoryGlow: Record<string, string> = {
  physics: 'shadow-[0_0_30px_rgba(14,165,233,0.5)]',
  math: 'shadow-[0_0_30px_rgba(168,85,247,0.5)]',
  chemistry: 'shadow-[0_0_30px_rgba(16,185,129,0.5)]',
}

const difficultyColor: Record<string, string> = {
  beginner: 'bg-green-500/20 text-green-400 border-green-500/30',
  intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  advanced: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const difficultyLabel: Record<string, string> = {
  beginner: '入门',
  intermediate: '进阶',
  advanced: '高级',
}

interface ExperimentCardProps {
  config: ExperimentConfig
  onClick?: () => void
  featured?: boolean
}

export default function ExperimentCard({ config, onClick, featured }: ExperimentCardProps) {
  const Icon = iconMap[config.experiment.icon] || Atom
  const { category, difficulty } = config.experiment

  return (
    <div
      onClick={onClick}
      className={cn(
        'glass-panel rounded-xl cursor-pointer overflow-hidden',
        'transition-all duration-500 ease-out',
        'hover:-translate-y-2 hover:shadow-2xl',
        'group perspective-1000',
        featured && 'ring-2 ring-cyan-400/50'
      )}
      style={{ borderRadius: '12px' }}
    >
      <div
        className={cn(
          'relative h-40 bg-gradient-to-br',
          categoryGradient[category],
          'flex items-center justify-center overflow-hidden'
        )}
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 left-4 w-20 h-20 rounded-full bg-white/20 blur-xl" />
          <div className="absolute bottom-4 right-4 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
        </div>
        <Icon
          className={cn(
            'w-16 h-16 text-white relative z-10 transition-all duration-500',
            'drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]',
            categoryGlow[category],
            'group-hover:scale-110 group-hover:rotate-6'
          )}
        />
        <div className="absolute top-3 right-3">
          <span
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium border',
              difficultyColor[difficulty]
            )}
          >
            {difficultyLabel[difficulty]}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-3">
        <h3 className="font-orbitron text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
          {config.experiment.title}
        </h3>
        <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">
          {config.experiment.description}
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {config.experiment.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 rounded-md text-xs bg-slate-700/50 text-slate-300 border border-slate-600/30"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div
        className={cn(
          'absolute inset-0 rounded-xl pointer-events-none opacity-0',
          'group-hover:opacity-100 transition-opacity duration-500',
          category === 'physics' && 'ring-2 ring-cyan-400/60 shadow-[0_0_40px_rgba(14,165,233,0.3)]',
          category === 'math' && 'ring-2 ring-purple-400/60 shadow-[0_0_40px_rgba(168,85,247,0.3)]',
          category === 'chemistry' && 'ring-2 ring-emerald-400/60 shadow-[0_0_40px_rgba(16,185,129,0.3)]'
        )}
        style={{ borderRadius: '12px' }}
      />
    </div>
  )
}
