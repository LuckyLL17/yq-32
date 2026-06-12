import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, BookOpen } from 'lucide-react';

export default function Sidebar() {
  const navigate = useNavigate();

  const buttons = [
    {
      icon: ArrowLeft,
      label: '返回',
      onClick: () => navigate(-1),
    },
    {
      icon: Home,
      label: '首页',
      to: '/',
    },
    {
      icon: BookOpen,
      label: '实验库',
      to: '/library',
    },
  ];

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-16 flex-col items-center gap-4 border-r border-neon-cyan/20 bg-space-800/90 py-6 backdrop-blur-xl">
      {buttons.map(({ icon: Icon, label, onClick, to }, index) => {
        const content = (
          <button
            onClick={onClick}
            title={label}
            className="group relative flex h-12 w-12 items-center justify-center rounded-lg text-gray-400 transition-all duration-300 hover:bg-neon-cyan/10 hover:text-neon-cyan hover:shadow-[0_0_15px_rgba(0,240,255,0.3)]"
          >
            <Icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
            <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md bg-space-700 px-3 py-1.5 text-xs text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
              {label}
            </span>
          </button>
        );

        return to ? (
          <Link key={index} to={to}>
            {content}
          </Link>
        ) : (
          <div key={index}>{content}</div>
        );
      })}
    </aside>
  );
}
