import type { ExperimentConfig, ParamConfig } from '@/data/types'

export type QuestionType = 'fillblank' | 'choice'

export interface Question {
  id: string
  type: QuestionType
  question: string
  formula: string
  params: Record<string, number>
  paramLabels: Record<string, string>
  answer: number
  options?: number[]
  tolerance: number
  unit: string
  explanation: string
}

function randInRange(min: number, max: number, step: number): number {
  const steps = Math.floor((max - min) / step)
  const randomStep = Math.floor(Math.random() * (steps + 1))
  const result = min + randomStep * step
  const decimals = step < 1 ? Math.ceil(-Math.log10(step)) : 0
  return parseFloat(result.toFixed(decimals))
}

function roundTo(num: number, decimals: number): number {
  const factor = Math.pow(10, decimals)
  return Math.round(num * factor) / factor
}

function generateParams(params: ParamConfig[]): Record<string, number> {
  const result: Record<string, number> = {}
  params.forEach((p) => {
    result[p.key] = randInRange(p.min, p.max, p.step)
  })
  return result
}

function getParamLabels(params: ParamConfig[]): Record<string, string> {
  const result: Record<string, string> = {}
  params.forEach((p) => {
    result[p.key] = p.label
  })
  return result
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function generateChoices(correct: number, min: number, max: number, step: number): number[] {
  const choices = new Set<number>()
  choices.add(roundTo(correct, 3))

  const range = max - min
  const perturb = Math.max(range * 0.1, step * 2)

  while (choices.size < 4) {
    let val = correct + (Math.random() - 0.5) * perturb * 2
    val = Math.max(min, Math.min(max, val))
    val = roundTo(val, 3)
    if (val !== roundTo(correct, 3)) {
      choices.add(val)
    }
  }

  return shuffleArray(Array.from(choices))
}

function generateSpringQuestions(config: ExperimentConfig): Question[] {
  const questions: Question[] = []
  const paramLabels = getParamLabels(config.params)

  for (let i = 0; i < 2; i++) {
    const params = generateParams(config.params)
    const omega = Math.sqrt(params.stiffness / params.mass)
    const T = (2 * Math.PI) / omega
    const f = 1 / T
    const answer = roundTo(T, 3)

    const tolerance = Math.max(0.01, Math.abs(answer) * 0.02)

    const isChoice = Math.random() > 0.5

    questions.push({
      id: `spring-period-${i}`,
      type: isChoice ? 'choice' : 'fillblank',
      question: `已知弹簧振子的质量 m = ${params.mass} kg，弹性系数 k = ${params.stiffness} N/m，阻尼忽略不计。求该简谐运动的周期 T。`,
      formula: 'T = 2\\pi\\sqrt{\\frac{m}{k}}',
      params,
      paramLabels,
      answer,
      options: isChoice ? generateChoices(answer, 0.1, 10, 0.01) : undefined,
      tolerance,
      unit: 's',
      explanation: `根据周期公式 T = 2π√(m/k)，代入 m = ${params.mass} kg，k = ${params.stiffness} N/m：\n角频率 ω = √(k/m) = √(${params.stiffness}/${params.mass}) = ${roundTo(omega, 4)} rad/s\n周期 T = 2π/ω = ${roundTo(T, 4)} s ≈ ${answer} s\n频率 f = 1/T = ${roundTo(f, 4)} Hz`,
    })
  }

  for (let i = 0; i < 2; i++) {
    const params = generateParams(config.params)
    const omega = Math.sqrt(params.stiffness / params.mass)
    const f = omega / (2 * Math.PI)
    const answer = roundTo(f, 3)

    const tolerance = Math.max(0.01, Math.abs(answer) * 0.02)
    const isChoice = Math.random() > 0.5

    questions.push({
      id: `spring-freq-${i}`,
      type: isChoice ? 'choice' : 'fillblank',
      question: `一个弹簧振子系统，弹性系数 k = ${params.stiffness} N/m，振子质量 m = ${params.mass} kg。求系统的振动频率 f。`,
      formula: 'f = \\frac{1}{2\\pi}\\sqrt{\\frac{k}{m}}',
      params,
      paramLabels,
      answer,
      options: isChoice ? generateChoices(answer, 0.05, 5, 0.01) : undefined,
      tolerance,
      unit: 'Hz',
      explanation: `根据频率公式 f = (1/2π)·√(k/m)，代入 k = ${params.stiffness} N/m，m = ${params.mass} kg：\nω = √(k/m) = ${roundTo(omega, 4)} rad/s\nf = ω/(2π) = ${roundTo(f, 4)} Hz ≈ ${answer} Hz\n周期 T = 1/f = ${roundTo(1 / f, 4)} s`,
    })
  }

  {
    const params = generateParams(config.params)
    const E = 0.5 * params.stiffness * params.displacement * params.displacement
    const answer = roundTo(E, 3)

    const tolerance = Math.max(0.01, Math.abs(answer) * 0.02)
    const isChoice = Math.random() > 0.5

    questions.push({
      id: 'spring-energy-1',
      type: isChoice ? 'choice' : 'fillblank',
      question: `弹簧振子的弹性系数 k = ${params.stiffness} N/m，将振子从平衡位置拉开 ${params.displacement} m 后释放。求系统的初始总机械能 E（无阻尼时机械能守恒）。`,
      formula: 'E = \\frac{1}{2}kA^2',
      params,
      paramLabels,
      answer,
      options: isChoice ? generateChoices(answer, 0, 500, 0.01) : undefined,
      tolerance,
      unit: 'J',
      explanation: `根据简谐运动能量公式 E = ½kA²（A为振幅，此处等于初始位移）：\nE = ½ × ${params.stiffness} × (${params.displacement})²\nE = 0.5 × ${params.stiffness} × ${roundTo(params.displacement * params.displacement, 4)}\nE = ${answer} J`,
    })
  }

  return shuffleArray(questions).slice(0, 5)
}

function generateProjectileQuestions(config: ExperimentConfig): Question[] {
  const questions: Question[] = []
  const paramLabels = getParamLabels(config.params)

  for (let i = 0; i < 2; i++) {
    const params = generateParams(config.params)
    const angleRad = (params.angle * Math.PI) / 180
    const R = (params.velocity * params.velocity * Math.sin(2 * angleRad)) / params.gravity
    const answer = roundTo(R, 3)

    const tolerance = Math.max(0.01, Math.abs(answer) * 0.02)
    const isChoice = Math.random() > 0.5

    questions.push({
      id: `projectile-range-${i}`,
      type: isChoice ? 'choice' : 'fillblank',
      question: `一物体以初速度 v₀ = ${params.velocity} m/s，发射角 θ = ${params.angle}° 抛出，重力加速度 g = ${params.gravity} m/s²。求物体的水平射程 R（落回同一高度时的水平位移）。`,
      formula: 'R = \\frac{v_0^2 \\sin2\\theta}{g}',
      params,
      paramLabels,
      answer,
      options: isChoice ? generateChoices(answer, 0, 500, 0.01) : undefined,
      tolerance,
      unit: 'm',
      explanation: `根据射程公式 R = v₀²·sin(2θ)/g：\nsin(2θ) = sin(${2 * params.angle}°) = ${roundTo(Math.sin(2 * angleRad), 4)}\nv₀² = ${params.velocity}² = ${params.velocity * params.velocity}\nR = (${params.velocity * params.velocity} × ${roundTo(Math.sin(2 * angleRad), 4)}) / ${params.gravity}\nR = ${roundTo(R, 4)} m ≈ ${answer} m\n注意：当 θ = 45° 时射程最大。`,
    })
  }

  for (let i = 0; i < 2; i++) {
    const params = generateParams(config.params)
    const angleRad = (params.angle * Math.PI) / 180
    const H = (params.velocity * params.velocity * Math.sin(angleRad) * Math.sin(angleRad)) / (2 * params.gravity)
    const answer = roundTo(H, 3)

    const tolerance = Math.max(0.01, Math.abs(answer) * 0.02)
    const isChoice = Math.random() > 0.5

    questions.push({
      id: `projectile-height-${i}`,
      type: isChoice ? 'choice' : 'fillblank',
      question: `抛体以初速度 v₀ = ${params.velocity} m/s，角度 θ = ${params.angle}° 发射，g = ${params.gravity} m/s²。求物体能达到的最大射高 H。`,
      formula: 'H = \\frac{v_0^2 \\sin^2\\theta}{2g}',
      params,
      paramLabels,
      answer,
      options: isChoice ? generateChoices(answer, 0, 200, 0.01) : undefined,
      tolerance,
      unit: 'm',
      explanation: `根据射高公式 H = v₀²·sin²θ/(2g)：\nsin(θ) = sin(${params.angle}°) = ${roundTo(Math.sin(angleRad), 4)}\nsin²(θ) = ${roundTo(Math.sin(angleRad) * Math.sin(angleRad), 4)}\nv₀² = ${params.velocity * params.velocity}\nH = (${params.velocity * params.velocity} × ${roundTo(Math.sin(angleRad) * Math.sin(angleRad), 4)}) / (2 × ${params.gravity})\nH = ${roundTo(H, 4)} m ≈ ${answer} m`,
    })
  }

  {
    const params = generateParams(config.params)
    const angleRad = (params.angle * Math.PI) / 180
    const T = (2 * params.velocity * Math.sin(angleRad)) / params.gravity
    const answer = roundTo(T, 3)

    const tolerance = Math.max(0.01, Math.abs(answer) * 0.02)
    const isChoice = Math.random() > 0.5

    questions.push({
      id: 'projectile-time-1',
      type: isChoice ? 'choice' : 'fillblank',
      question: `抛射体初速度 v₀ = ${params.velocity} m/s，发射角 θ = ${params.angle}°，重力加速度 g = ${params.gravity} m/s²。求从抛出到落回同一高度的总飞行时间 T。`,
      formula: 'T = \\frac{2v_0 \\sin\\theta}{g}',
      params,
      paramLabels,
      answer,
      options: isChoice ? generateChoices(answer, 0, 20, 0.01) : undefined,
      tolerance,
      unit: 's',
      explanation: `根据飞行时间公式 T = 2v₀·sinθ/g：\nsin(θ) = sin(${params.angle}°) = ${roundTo(Math.sin(angleRad), 4)}\n分子：2 × ${params.velocity} × ${roundTo(Math.sin(angleRad), 4)} = ${roundTo(2 * params.velocity * Math.sin(angleRad), 4)}\nT = ${roundTo(2 * params.velocity * Math.sin(angleRad), 4)} / ${params.gravity} = ${roundTo(T, 4)} s ≈ ${answer} s\n注意：上升时间 = 下落时间 = T/2（对称）。`,
    })
  }

  return shuffleArray(questions).slice(0, 5)
}

function generateWaveQuestions(config: ExperimentConfig): Question[] {
  const questions: Question[] = []
  const paramLabels = getParamLabels(config.params)
  const L = 1000

  for (let i = 0; i < 2; i++) {
    const params = generateParams(config.params)
    const deltaX = (params.wavelength * L) / params.slitDistance
    const answer = roundTo(deltaX, 3)

    const tolerance = Math.max(0.01, Math.abs(answer) * 0.02)
    const isChoice = Math.random() > 0.5

    questions.push({
      id: `wave-fringe-${i}`,
      type: isChoice ? 'choice' : 'fillblank',
      question: `双缝干涉实验中，波长 λ = ${params.wavelength}（相对单位），双缝间距 d = ${params.slitDistance}（相对单位），缝屏距离 L = ${L}（相对单位）。求相邻明条纹的间距 Δx。`,
      formula: '\\Delta x = \\frac{\\lambda L}{d}',
      params: { ...params, L },
      paramLabels: { ...paramLabels, L: '缝屏距离' },
      answer,
      options: isChoice ? generateChoices(answer, 0, 2000, 0.01) : undefined,
      tolerance,
      unit: '相对单位',
      explanation: `根据条纹间距公式 Δx = λL/d：\nΔx = (${params.wavelength} × ${L}) / ${params.slitDistance}\nΔx = ${params.wavelength * L} / ${params.slitDistance}\nΔx = ${roundTo(deltaX, 4)} ≈ ${answer}\n条纹间距与波长 λ 成正比，与缝间距 d 成反比。波长越长、缝距越小，条纹越宽。`,
    })
  }

  for (let i = 0; i < 2; i++) {
    const params = generateParams(config.params)
    const v = params.wavelength * params.frequency
    const answer = roundTo(v, 3)

    const tolerance = Math.max(0.01, Math.abs(answer) * 0.02)
    const isChoice = Math.random() > 0.5

    questions.push({
      id: `wave-velocity-${i}`,
      type: isChoice ? 'choice' : 'fillblank',
      question: `一列波的波长 λ = ${params.wavelength}（相对单位），振动频率 f = ${params.frequency} Hz。求该波的传播速度 v。`,
      formula: 'v = \\lambda f',
      params,
      paramLabels,
      answer,
      options: isChoice ? generateChoices(answer, 0, 1000, 0.01) : undefined,
      tolerance,
      unit: '相对单位/s',
      explanation: `根据波速公式 v = λf：\nv = ${params.wavelength} × ${params.frequency}\nv = ${answer}\n此外，周期 T = 1/f = ${roundTo(1 / params.frequency, 4)} s，角频率 ω = 2πf = ${roundTo(2 * Math.PI * params.frequency, 4)} rad/s。`,
    })
  }

  {
    const params = generateParams(config.params)
    const k = 1
    const theta = Math.asin((k * params.wavelength) / params.slitDistance)
    const thetaDeg = (theta * 180) / Math.PI
    const answer = roundTo(thetaDeg, 3)

    const tolerance = Math.max(0.01, Math.abs(answer) * 0.02)
    const isChoice = Math.random() > 0.5

    questions.push({
      id: 'wave-angle-1',
      type: isChoice ? 'choice' : 'fillblank',
      question: `双缝干涉中，波长 λ = ${params.wavelength}，双缝间距 d = ${params.slitDistance}。求第 1 级（k=1）明条纹对应的衍射角 θ（角度制）。提示：明纹条件 d·sinθ = kλ。`,
      formula: 'd\\sin\\theta = k\\lambda',
      params,
      paramLabels,
      answer,
      options: isChoice ? generateChoices(answer, 0, 90, 0.01) : undefined,
      tolerance,
      unit: '°',
      explanation: `根据明纹条件 d·sinθ = kλ（k=1）：\nsinθ = kλ/d = 1 × ${params.wavelength} / ${params.slitDistance} = ${roundTo(params.wavelength / params.slitDistance, 4)}\nθ = arcsin(${roundTo(params.wavelength / params.slitDistance, 4)}) = ${roundTo(thetaDeg, 4)}° ≈ ${answer}°\n当 λ/d > 1 时，该级明纹不存在。`,
    })
  }

  return shuffleArray(questions).slice(0, 5)
}

function generateFunctionQuestions(config: ExperimentConfig): Question[] {
  const questions: Question[] = []
  const paramLabels = getParamLabels(config.params)

  for (let i = 0; i < 2; i++) {
    const params = generateParams(config.params)
    if (Math.abs(params.a) < 0.1) params.a = params.a >= 0 ? 0.5 : -0.5
    const x0 = -params.b / (2 * params.a)
    const answer = roundTo(x0, 3)
    const expr = buildQuadraticExpr(params.a, params.b, params.c)

    const tolerance = Math.max(0.01, Math.abs(answer) * 0.02)
    const isChoice = Math.random() > 0.5

    questions.push({
      id: `function-symmetry-${i}`,
      type: isChoice ? 'choice' : 'fillblank',
      question: `给定二次函数 y = ${expr}，求该抛物线的对称轴横坐标 x₀。`,
      formula: 'x_0 = -\\frac{b}{2a}',
      params,
      paramLabels,
      answer,
      options: isChoice ? generateChoices(answer, -10, 10, 0.01) : undefined,
      tolerance,
      unit: '',
      explanation: `对称轴公式 x₀ = -b/(2a)：\nx₀ = -(${params.b}) / (2 × ${params.a})\nx₀ = ${-params.b} / ${2 * params.a}\nx₀ = ${roundTo(x0, 4)} ≈ ${answer}\n该抛物线的顶点横坐标即为对称轴位置。`,
    })
  }

  for (let i = 0; i < 2; i++) {
    const params = generateParams(config.params)
    if (Math.abs(params.a) < 0.1) params.a = params.a >= 0 ? 0.5 : -0.5
    const x0 = -params.b / (2 * params.a)
    const y0 = params.a * x0 * x0 + params.b * x0 + params.c
    const answer = roundTo(y0, 3)
    const expr = buildQuadraticExpr(params.a, params.b, params.c)

    const tolerance = Math.max(0.01, Math.abs(answer) * 0.02)
    const isChoice = Math.random() > 0.5

    questions.push({
      id: `function-vertex-${i}`,
      type: isChoice ? 'choice' : 'fillblank',
      question: `求二次函数 y = ${expr} 的顶点纵坐标 y₀（即函数的极值）。`,
      formula: 'y_0 = \\frac{4ac - b^2}{4a}',
      params,
      paramLabels,
      answer,
      options: isChoice ? generateChoices(answer, -100, 100, 0.01) : undefined,
      tolerance,
      unit: '',
      explanation: `方法一：先求顶点横坐标 x₀ = -b/(2a) = ${roundTo(x0, 4)}\n代入函数 y₀ = a·x₀² + b·x₀ + c = ${answer}\n方法二：公式 y₀ = (4ac-b²)/(4a)\n4ac = ${4 * params.a * params.c}，b² = ${params.b * params.b}\n分子 = ${4 * params.a * params.c - params.b * params.b}，分母 = ${4 * params.a}\ny₀ = ${roundTo((4 * params.a * params.c - params.b * params.b) / (4 * params.a), 4)}\n${params.a > 0 ? 'a > 0，开口向上，此为最小值' : 'a < 0，开口向下，此为最大值'}。`,
    })
  }

  {
    const params = generateParams(config.params)
    const delta = params.b * params.b - 4 * params.a * params.c
    const answer = roundTo(delta, 3)
    const expr = buildQuadraticExpr(params.a, params.b, params.c)

    const tolerance = Math.max(0.01, Math.abs(answer) * 0.02)
    const isChoice = Math.random() > 0.5

    let statusText = ''
    if (delta > 0) statusText = 'Δ > 0，抛物线与 x 轴有两个交点（两个不同实根）'
    else if (Math.abs(delta) < 1e-9) statusText = 'Δ = 0，抛物线与 x 轴相切（一个重根）'
    else statusText = 'Δ < 0，抛物线与 x 轴无交点（无实根）'

    questions.push({
      id: 'function-delta-1',
      type: isChoice ? 'choice' : 'fillblank',
      question: `二次函数 y = ${expr}，计算判别式 Δ 的值。`,
      formula: '\\Delta = b^2 - 4ac',
      params,
      paramLabels,
      answer,
      options: isChoice ? generateChoices(answer, -100, 200, 0.01) : undefined,
      tolerance,
      unit: '',
      explanation: `判别式公式 Δ = b² - 4ac：\nb² = (${params.b})² = ${params.b * params.b}\n4ac = 4 × ${params.a} × ${params.c} = ${4 * params.a * params.c}\nΔ = ${params.b * params.b} - ${4 * params.a * params.c} = ${answer}\n${statusText}`,
    })
  }

  return shuffleArray(questions).slice(0, 5)
}

function generateMoleculeQuestions(config: ExperimentConfig): Question[] {
  const questions: Question[] = []
  const paramLabels = getParamLabels(config.params)

  const moleculeNames = ['H₂O (水分子)', 'CO₂ (二氧化碳)', 'CH₄ (甲烷)', 'NH₃ (氨分子)']
  const standardAngles = [104.5, 180, 109.5, 107]
  const hybridizations = ['sp³（2对孤对）', 'sp', 'sp³', 'sp³（1对孤对）']
  const geometries = ['V型（弯曲型）', '直线型', '正四面体型', '三角锥型']

  for (let i = 0; i < 2; i++) {
    const molIdx = Math.floor(Math.random() * 4)
    const params = {
      moleculeType: molIdx,
      bondLength: randInRange(60, 120, 1),
      bondAngle: randInRange(90, 180, 0.5),
      rotationY: randInRange(0, 360, 1),
    }
    const answer = standardAngles[molIdx]
    const tolerance = 1

    const isChoice = Math.random() > 0.5

    questions.push({
      id: `molecule-angle-${i}`,
      type: isChoice ? 'choice' : 'fillblank',
      question: `分子 ${moleculeNames[molIdx]} 的中心原子根据 VSEPR 理论预测，其标准键角约为多少度？（不考虑当前调整值）`,
      formula: '\\text{键角由 VSEPR 理论和杂化类型决定}',
      params,
      paramLabels,
      answer,
      options: isChoice
        ? shuffleArray([
            standardAngles[molIdx],
            standardAngles[(molIdx + 1) % 4],
            standardAngles[(molIdx + 2) % 4],
            standardAngles[(molIdx + 3) % 4],
          ])
        : undefined,
      tolerance,
      unit: '°',
      explanation: `${moleculeNames[molIdx]}：\n杂化类型：${hybridizations[molIdx]}\n空间构型：${geometries[molIdx]}\n标准键角 ≈ ${answer}°\n孤电子对的排斥会使键角略小于正四面体的 109.5°（如 H₂O 的 104.5° 和 NH₃ 的 107°）。`,
    })
  }

  for (let i = 0; i < 2; i++) {
    const molIdx = Math.floor(Math.random() * 4)
    const params = {
      moleculeType: molIdx,
      bondLength: randInRange(60, 120, 1),
      bondAngle: randInRange(90, 180, 0.5),
      rotationY: randInRange(0, 360, 1),
    }
    const answer = molIdx
    const options = [0, 1, 2, 3]
    const isChoice = true

    questions.push({
      id: `molecule-hybrid-${i}`,
      type: 'choice',
      question: `分子 ${moleculeNames[molIdx]} 的中心原子采取哪种杂化方式？\n选项：0=sp³杂化, 1=sp杂化, 2=sp²杂化, 3=sp³d杂化`,
      formula: '\\text{杂化类型由价层电子对数决定}',
      params,
      paramLabels,
      answer,
      options: molIdx === 1 ? shuffleArray([0, 1, 2, 3]) : shuffleArray([0, 0, 1, 2]),
      tolerance: 0,
      unit: '（选项编号）',
      explanation: `${moleculeNames[molIdx]} 的中心原子杂化分析：\n价层电子对数 = σ键数 + 孤电子对数 = ${molIdx === 1 ? '2 + 0' : molIdx === 0 ? '2 + 2' : molIdx === 2 ? '4 + 0' : '3 + 1'} = ${molIdx === 1 ? 2 : 4}\n价层电子对数 = ${molIdx === 1 ? 2 : 4}，对应${molIdx === 1 ? 'sp杂化' : 'sp³杂化'}\n空间构型：${geometries[molIdx]}`,
    })
  }

  {
    const molIdx = 1
    const params = {
      moleculeType: molIdx,
      bondLength: randInRange(60, 120, 1),
      bondAngle: randInRange(90, 180, 0.5),
      rotationY: randInRange(0, 360, 1),
    }
    const answer = 0
    const isChoice = true

    questions.push({
      id: 'molecule-polar-1',
      type: 'choice',
      question: '对于 CO₂ 分子（O=C=O，直线型，键角180°），其分子总偶极矩为多少？选项：0=0（非极性）, 1=大于0（极性）, 2=无法判断, 3=等于键偶极矩',
      formula: '\\vec{\\mu}_{\\text{总}} = \\sum_i \\vec{\\mu}_i',
      params,
      paramLabels,
      answer,
      options: shuffleArray([0, 1, 2, 3]),
      tolerance: 0,
      unit: '（选项编号）',
      explanation: 'CO₂ 分子是直线型结构 O=C=O：\n虽然每个 C=O 键都是极性键（μ ≠ 0），但两个键偶极矩方向相反、大小相等\n矢量叠加：μ总 = μ₁ + μ₂ = |μ| - |μ| = 0\n因此 CO₂ 是非极性分子。类似地，正四面体型的 CH₄ 也是非极性分子，对称结构使键偶极矩完全抵消。',
    })
  }

  return shuffleArray(questions).slice(0, 5)
}

function generateReactionQuestions(config: ExperimentConfig): Question[] {
  const questions: Question[] = []
  const paramLabels = getParamLabels(config.params)
  const R = 8.314

  for (let i = 0; i < 2; i++) {
    const params = generateParams(config.params)
    const Ea = params.activationEnergy * 1000
    const kRatio = Math.exp(-Ea / (R * params.temperature))
    const answer = roundTo(kRatio, 6)

    const tolerance = Math.max(1e-6, Math.abs(answer) * 0.02)
    const isChoice = Math.random() > 0.5

    questions.push({
      id: `reaction-boltzmann-${i}`,
      type: isChoice ? 'choice' : 'fillblank',
      question: `某化学反应的活化能 Ea = ${params.activationEnergy} kJ/mol，温度 T = ${params.temperature} K，气体常数 R = 8.314 J/(mol·K)。根据玻尔兹曼分布，计算能量超过活化能的分子所占的比例 f = e^(-Ea/RT)。`,
      formula: 'f = e^{-\\frac{E_a}{RT}}',
      params,
      paramLabels,
      answer,
      options: isChoice ? generateChoices(answer, 0, 1, 1e-6) : undefined,
      tolerance,
      unit: '',
      explanation: `计算过程：\nEa = ${params.activationEnergy} kJ/mol = ${Ea} J/mol\nRT = ${R} × ${params.temperature} = ${roundTo(R * params.temperature, 2)} J/mol\n指数 = -Ea/RT = -${Ea} / ${roundTo(R * params.temperature, 2)} = ${roundTo(-Ea / (R * params.temperature), 4)}\nf = e^(${roundTo(-Ea / (R * params.temperature), 4)}) = ${answer}\n活化能越高或温度越低，能反应的分子比例越小。`,
    })
  }

  for (let i = 0; i < 2; i++) {
    const params = generateParams(config.params)
    const rate = params.concentrationA * params.concentrationB
    const answer = roundTo(rate, 3)

    const tolerance = Math.max(0.01, Math.abs(answer) * 0.02)
    const isChoice = Math.random() > 0.5

    questions.push({
      id: `reaction-rate-${i}`,
      type: isChoice ? 'choice' : 'fillblank',
      question: `对于基元反应 A + B → C，速率方程为 v = k·[A]·[B]。当 [A] = ${params.concentrationA} mol/L，[B] = ${params.concentrationB} mol/L，假设速率常数 k = 1（取相对单位）时，计算初始反应速率 v 的相对值。`,
      formula: 'v = k [A] [B]',
      params,
      paramLabels,
      answer,
      options: isChoice ? generateChoices(answer, 0, 5000, 0.01) : undefined,
      tolerance,
      unit: '相对速率',
      explanation: `根据二级反应速率方程 v = k·[A]·[B]：\nv = 1 × ${params.concentrationA} × ${params.concentrationB}\nv = ${params.concentrationA * params.concentrationB}\nv = ${answer}\n对于该反应，反应级数对 A 为1级，对 B 为1级，总反应级数为2级。\n浓度加倍，速率变为4倍（2×2）。`,
    })
  }

  {
    const params = {
      concentrationA: randInRange(10, 40, 1),
      concentrationB: randInRange(10, 40, 1),
      temperature: randInRange(280, 350, 5),
      activationEnergy: randInRange(30, 80, 5),
    }
    const T2 = params.temperature + 10
    const Ea = params.activationEnergy * 1000
    const kRatio = Math.exp((Ea / R) * (1 / params.temperature - 1 / T2))
    const answer = roundTo(kRatio, 3)

    const tolerance = Math.max(0.01, Math.abs(answer) * 0.05)
    const isChoice = Math.random() > 0.5

    questions.push({
      id: 'reaction-arrhenius-1',
      type: isChoice ? 'choice' : 'fillblank',
      question: `根据阿伦尼乌斯公式，当活化能 Ea = ${params.activationEnergy} kJ/mol，初始温度 T₁ = ${params.temperature} K 时，温度升高 10K 到 T₂ = ${T2} K，求速率常数的比值 k₂/k₁。R = 8.314 J/(mol·K)。`,
      formula: '\\ln\\frac{k_2}{k_1} = \\frac{E_a}{R}\\left(\\frac{1}{T_1} - \\frac{1}{T_2}\\right)',
      params: { ...params, T2 },
      paramLabels: { ...paramLabels, T2: '升温后温度' },
      answer,
      options: isChoice ? generateChoices(answer, 1, 10, 0.01) : undefined,
      tolerance,
      unit: '',
      explanation: `阿伦尼乌斯积分式：\nln(k₂/k₁) = (Ea/R)(1/T₁ - 1/T₂)\n1/T₁ = ${roundTo(1 / params.temperature, 6)}\n1/T₂ = ${roundTo(1 / T2, 6)}\n1/T₁ - 1/T₂ = ${roundTo(1 / params.temperature - 1 / T2, 6)}\nEa/R = ${Ea} / ${R} = ${roundTo(Ea / R, 2)}\nln(k₂/k₁) = ${roundTo(Ea / R, 2)} × ${roundTo(1 / params.temperature - 1 / T2, 6)} = ${roundTo(Math.log(kRatio), 4)}\nk₂/k₁ = e^(${roundTo(Math.log(kRatio), 4)}) = ${answer}\n温度升高10K，速率约增加${roundTo((answer - 1) * 100, 1)}%，接近范特霍夫规则的2~4倍范围。`,
    })
  }

  return shuffleArray(questions).slice(0, 5)
}

export function generateQuiz(experimentId: string, config: ExperimentConfig): Question[] {
  switch (experimentId) {
    case 'spring':
      return generateSpringQuestions(config)
    case 'projectile':
      return generateProjectileQuestions(config)
    case 'wave':
      return generateWaveQuestions(config)
    case 'function':
      return generateFunctionQuestions(config)
    case 'molecule':
      return generateMoleculeQuestions(config)
    case 'reaction':
      return generateReactionQuestions(config)
    default:
      return generateSpringQuestions(config)
  }
}

export function checkAnswer(userAnswer: number, correct: number, tolerance: number): boolean {
  if (isNaN(userAnswer)) return false
  return Math.abs(userAnswer - correct) <= tolerance
}

export function formatNumber(num: number, decimals = 4): string {
  if (Math.abs(num) < 1e-9) return '0'
  if (Math.abs(num) >= 1000 || Math.abs(num) < 0.001) {
    return num.toExponential(decimals)
  }
  return parseFloat(num.toFixed(decimals)).toString()
}

function buildQuadraticExpr(a: number, b: number, c: number): string {
  let result = ''
  
  if (a === 1) result += 'x²'
  else if (a === -1) result += '-x²'
  else result += `${a}x²`

  if (b > 0) result += ` + ${b === 1 ? '' : b}x`
  else if (b < 0) result += ` - ${b === -1 ? '' : Math.abs(b)}x`

  if (c > 0) result += ` + ${c}`
  else if (c < 0) result += ` - ${Math.abs(c)}`

  return result
}
