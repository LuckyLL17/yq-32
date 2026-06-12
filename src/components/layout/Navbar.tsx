import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, Atom } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const location = useLocation();

  const navLinks = [
    { to: '/', label: '首页', icon: Home },
    { to: '/library', label: '实验库', icon: BookOpen },
  ];

  return (
    <nav className="glass-panel sticky top-0 z-50 w-full border-b border-neon-cyan/20">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-3">
          <Atom className="h-8 w-8 text-neon-cyan" />
          <span className="font-orbitron text-xl font-bold text-neon-cyan glow-text">
            SciLab
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {navLinks.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'group flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300',
                  isActive
                    ? 'bg-neon-cyan/10 text-neon-cyan shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                    : 'text-gray-400 hover:bg-neon-cyan/5 hover:text-neon-cyan hover:shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                )}
              >
                <Icon className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
