import { Atom, Calculator, FlaskConical } from 'lucide-react'
import { cn } from '@/lib/utils'

type Category = 'physics' | 'math' | 'chemistry'

const categoryConfig: Record<Category, {
  icon: React.ComponentType<{ className?: string }>
  gradient: string
  glow: string
  ring: string
  name: string
}> = {
  physics: {
    icon: Atom,
    gradient: 'from-blue-900 via-cyan-900 to-cyan-600',
    glow: 'shadow-[0_0_60px_rgba(14,165,233,0.4)]',
    ring: 'ring-cyan-400/60',
    name: '物理',
  },
  math: {
    icon: Calculator,
    gradient: 'from-purple-900 via-fuchsia-900 to-pink-600',
    glow: 'shadow-[0_0_60px_rgba(168,85,247,0.4)]',
    ring: 'ring-purple-400/60',
    name: '数学',
  },
  chemistry: {
    icon: FlaskConical,
    gradient: 'from-emerald-900 via-green-900 to-teal-500',
    glow: 'shadow-[0_0_60px_rgba(16,185,129,0.4)]',
    ring: 'ring-emerald-400/60',
    name: '化学',
  },
}

interface CategoryCardProps {
  category: Category
  count: number
  onClick?: () => void
}

export default function CategoryCard({ category, count, onClick }: CategoryCardProps) {
  const config = categoryConfig[category]
  const Icon = config.icon

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-2xl cursor-pointer',
        'transition-all duration-500 ease-out',
        'bg-gradient-to-br p-8',
        config.gradient,
        'hover:scale-105',
        'group'
      )}
    >
      <div className="absolute inset-0 opacity-30">
        <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center space-y-6 py-4">
        <div className="relative">
          <Icon
            className={cn(
              'w-20 h-20 text-white transition-all duration-500',
              'drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]',
              config.glow,
              'group-hover:scale-110 group-hover:rotate-12'
            )}
          />
        </div>

        <div className="text-center space-y-2">
          <h3 className="font-orbitron text-2xl font-bold text-white tracking-wider">
            {config.name}
          </h3>
          <p className="text-white/70 text-sm">
            <span className="text-white font-semibold text-lg">{count}</span> 个实验
          </p>
        </div>
      </div>

      <div
        className={cn(
          'absolute inset-0 rounded-2xl pointer-events-none opacity-0',
          'group-hover:opacity-100 transition-opacity duration-500',
          'ring-2',
          config.ring
        )}
      />
    </div>
  )
}
