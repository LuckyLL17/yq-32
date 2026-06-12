import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import CategoryCard from '@/components/CategoryCard';
import ExperimentCard from '@/components/ExperimentCard';
import { experiments } from '@/data/experiments';

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  const physicsCount = experiments.filter((e) => e.experiment.category === 'physics').length;
  const mathCount = experiments.filter((e) => e.experiment.category === 'math').length;
  const chemistryCount = experiments.filter((e) => e.experiment.category === 'chemistry').length;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particleCount = 80;
    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
    }[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1,
      });
    }

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 10;
        ctx.fill();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0, 240, 255, ${(1 - dist / 150) * 0.3})`;
            ctx.lineWidth = 0.6;
            ctx.shadowBlur = 0;
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  const scrollToFeatured = () => {
    const el = document.getElementById('featured-experiments');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Layout>
      <section className="relative min-h-screen overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-space-900/50 to-space-900" />

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
          <div className="animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
            <h1 className="font-orbitron text-5xl md:text-7xl font-bold text-neon-cyan mb-6"
                style={{ textShadow: '0 0 20px #00f0ff, 0 0 40px #00f0ff66, 0 0 60px #00f0ff33' }}>
              让抽象的理科公式活起来
            </h1>
          </div>

          <div className="animate-slide-up" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
            <p className="text-lg md:text-xl text-slate-300 max-w-2xl mb-10 leading-relaxed">
              通过拖拽、调参与可视化模拟，像玩游戏一样探索科学奥秘
            </p>
          </div>

          <div className="animate-slide-up flex gap-4" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
            <button className="neon-btn" onClick={() => navigate('/library')}>
              开始探索
            </button>
            <button className="neon-btn neon-btn-orange">
              查看文档
            </button>
          </div>
        </div>
      </section>

      <section className="relative py-24 px-6 bg-space-900">
        <div className="max-w-6xl mx-auto">
          <div className="animate-slide-up text-center mb-16" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
            <h2 className="font-orbitron text-3xl md:text-4xl font-bold text-white mb-4">
              选择学科领域
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-neon-cyan to-neon-purple mx-auto rounded-full" />
          </div>

          <div className="animate-slide-up grid grid-cols-1 md:grid-cols-3 gap-8" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
            <CategoryCard category="physics" count={physicsCount} onClick={scrollToFeatured} />
            <CategoryCard category="math" count={mathCount} onClick={scrollToFeatured} />
            <CategoryCard category="chemistry" count={chemistryCount} onClick={() => navigate('/library')} />
          </div>
        </div>
      </section>

      <section id="featured-experiments" className="relative py-24 px-6 bg-space-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="animate-slide-up text-center mb-16" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
            <h2 className="font-orbitron text-3xl md:text-4xl font-bold text-white mb-4">
              精选实验
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-neon-cyan to-neon-purple mx-auto rounded-full" />
          </div>

          <div className="animate-slide-up overflow-x-auto pb-6" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
            <div className="flex gap-6 min-w-max">
              {experiments.map((config) => (
                <div
                  key={config.experiment.id}
                  className="w-72 shrink-0 rounded-xl ring-2 ring-neon-cyan/30 shadow-[0_0_30px_rgba(0,240,255,0.15)]"
                >
                  <ExperimentCard
                    config={config}
                    onClick={() => navigate(`/lab/${config.experiment.id}`)}
                    featured
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
