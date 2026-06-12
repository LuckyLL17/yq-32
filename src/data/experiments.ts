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
  {
    experiment: {
      id: 'molecule',
      title: '分子结构',
      category: 'chemistry',
      description: '观察常见分子的球棍模型，调整键长和键角，旋转查看三维分子结构，理解价键理论。',
      difficulty: 'beginner',
      tags: ['分子结构', '球棍模型', '键角'],
      icon: 'Atom',
    },
    params: [
      { key: 'moleculeType', label: '分子类型', defaultValue: 0, min: 0, max: 3, step: 1, unit: '' },
      { key: 'bondLength', label: '键长', defaultValue: 80, min: 40, max: 150, step: 1, unit: 'px' },
      { key: 'bondAngle', label: '键角', defaultValue: 104.5, min: 60, max: 180, step: 0.5, unit: '°' },
      { key: 'rotationY', label: '旋转角度', defaultValue: 0, min: 0, max: 360, step: 1, unit: '°' },
    ],
    formula: '\\text{键角} = \\theta, \\quad \\text{键长} = d',
  },
  {
    experiment: {
      id: 'reaction',
      title: '反应速率',
      category: 'chemistry',
      description: '模拟 A + B → C 化学反应，调节反应物浓度和温度，观察分子碰撞频率与反应速率的关系。',
      difficulty: 'intermediate',
      tags: ['反应速率', '碰撞理论', '浓度', '温度'],
      icon: 'FlaskConical',
    },
    params: [
      { key: 'concentrationA', label: '浓度 [A]', defaultValue: 20, min: 5, max: 50, step: 1, unit: 'mol/L' },
      { key: 'concentrationB', label: '浓度 [B]', defaultValue: 20, min: 5, max: 50, step: 1, unit: 'mol/L' },
      { key: 'temperature', label: '温度', defaultValue: 300, min: 200, max: 500, step: 5, unit: 'K' },
      { key: 'activationEnergy', label: '活化能', defaultValue: 50, min: 10, max: 100, step: 1, unit: 'kJ/mol' },
    ],
    formula: 'v = k [A]^m [B]^n, \\quad k = A e^{-\\frac{E_a}{RT}}',
  },
]
