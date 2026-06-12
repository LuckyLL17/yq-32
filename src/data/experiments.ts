import type { ExperimentConfig } from './types'

export const experiments: ExperimentConfig[] = [
  {
    experiment: {
      id: 'spring',
      title: '弹簧振子',
      category: 'physics',
      description: '模拟弹簧振子的简谐运动，观察质量、弹性系数和阻尼对振动的影响，理解胡克定律与谐振周期关系。',
      difficulty: 'beginner',
      tags: ['简谐运动', '胡克定律'],
      icon: 'Zap',
    },
    params: [
      { key: 'mass', label: '质量', defaultValue: 1, min: 0.1, max: 5, step: 0.1, unit: 'kg' },
      { key: 'stiffness', label: '弹性系数', defaultValue: 20, min: 1, max: 100, step: 1, unit: 'N/m' },
      { key: 'damping', label: '阻尼', defaultValue: 0.1, min: 0, max: 2, step: 0.01, unit: '' },
      { key: 'displacement', label: '初始位移', defaultValue: 1, min: -2, max: 2, step: 0.1, unit: 'm' },
    ],
    formula: 'x(t) = A \\cos(\\omega t + \\varphi)',
  },
  {
    experiment: {
      id: 'projectile',
      title: '抛体运动',
      category: 'physics',
      description: '模拟不同初速度和角度下的抛体运动轨迹，直观理解运动学方程与抛物线轨迹的关系。',
      difficulty: 'beginner',
      tags: ['运动学', '抛物线'],
      icon: 'ArrowUpRight',
    },
    params: [
      { key: 'velocity', label: '初速度', defaultValue: 20, min: 1, max: 50, step: 1, unit: 'm/s' },
      { key: 'angle', label: '发射角度', defaultValue: 45, min: 0, max: 90, step: 1, unit: '°' },
      { key: 'gravity', label: '重力加速度', defaultValue: 9.8, min: 1, max: 20, step: 0.1, unit: 'm/s²' },
    ],
    formula: 'y = x\\tan\\theta - \\frac{gx^2}{2v_0^2\\cos^2\\theta}',
  },
  {
    experiment: {
      id: 'wave',
      title: '波的干涉',
      category: 'physics',
      description: '模拟双缝干涉现象，调节波长和缝间距观察明暗条纹变化，理解波的叠加原理与干涉条件。',
      difficulty: 'intermediate',
      tags: ['波动', '干涉', '衍射'],
      icon: 'Waves',
    },
    params: [
      { key: 'wavelength', label: '波长', defaultValue: 50, min: 10, max: 100, step: 1, unit: 'px' },
      { key: 'slitDistance', label: '双缝间距', defaultValue: 150, min: 50, max: 300, step: 1, unit: 'px' },
      { key: 'amplitude', label: '振幅', defaultValue: 40, min: 10, max: 80, step: 1, unit: 'px' },
      { key: 'frequency', label: '频率', defaultValue: 2, min: 1, max: 5, step: 0.1, unit: 'Hz' },
    ],
    formula: 'I = 4I_0 \\cos^2\\left(\\frac{\\pi d \\sin\\theta}{\\lambda}\\right)',
  },
  {
    experiment: {
      id: 'function',
      title: '函数图像',
      category: 'math',
      description: '通过调节二次函数系数观察抛物线形态变化，直观理解参数对函数图像开口、对称轴的影响。',
      difficulty: 'beginner',
      tags: ['函数', '二次函数'],
      icon: 'TrendingUp',
    },
    params: [
      { key: 'a', label: 'a', defaultValue: 1, min: -5, max: 5, step: 0.1, unit: '' },
      { key: 'b', label: 'b', defaultValue: 0, min: -5, max: 5, step: 0.1, unit: '' },
      { key: 'c', label: 'c', defaultValue: 0, min: -10, max: 10, step: 0.1, unit: '' },
    ],
    formula: 'y = ax^2 + bx + c',
  },
]
