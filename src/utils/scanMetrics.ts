import { projectileMaxHeight, projectileRange, quadraticVertex, waveInterference } from './physics'

export interface MetricDefinition {
  key: string
  label: string
  unit: string
}

const SPRING_METRICS: MetricDefinition[] = [
  { key: 'period', label: '周期 T', unit: 's' },
  { key: 'omega', label: '角频率 ω', unit: 'rad/s' },
  { key: 'maxDisplacement', label: '最大位移', unit: 'm' },
  { key: 'maxVelocity', label: '最大速度', unit: 'm/s' },
]

const PROJECTILE_METRICS: MetricDefinition[] = [
  { key: 'range', label: '射程 R', unit: 'm' },
  { key: 'maxHeight', label: '射高 H', unit: 'm' },
  { key: 'flightTime', label: '飞行时间', unit: 's' },
]

const WAVE_METRICS: MetricDefinition[] = [
  { key: 'centralIntensity', label: '中央光强', unit: '' },
  { key: 'fringeSpacing', label: '条纹间距', unit: 'px' },
]

const FUNCTION_METRICS: MetricDefinition[] = [
  { key: 'vertexY', label: '顶点 Y', unit: '' },
  { key: 'discriminant', label: '判别式 Δ', unit: '' },
  { key: 'vertexX', label: '对称轴 X', unit: '' },
]

const MOLECULE_METRICS: MetricDefinition[] = [
  { key: 'bondAngle', label: '键角', unit: '°' },
  { key: 'bondLength', label: '键长', unit: 'px' },
]

const REACTION_METRICS: MetricDefinition[] = [
  { key: 'rateConstant', label: '速率常数 k', unit: '' },
  { key: 'initialRate', label: '初始速率', unit: '' },
  { key: 'arrheniusFactor', label: '玻尔兹曼因子', unit: '' },
]

export function getMetricsForExperiment(experimentId: string): MetricDefinition[] {
  switch (experimentId) {
    case 'spring': return SPRING_METRICS
    case 'projectile': return PROJECTILE_METRICS
    case 'wave': return WAVE_METRICS
    case 'function': return FUNCTION_METRICS
    case 'molecule': return MOLECULE_METRICS
    case 'reaction': return REACTION_METRICS
    default: return []
  }
}

export function computeMetric(experimentId: string, metricKey: string, params: Record<string, number>): number {
  switch (experimentId) {
    case 'spring':
      return computeSpringMetric(metricKey, params)
    case 'projectile':
      return computeProjectileMetric(metricKey, params)
    case 'wave':
      return computeWaveMetric(metricKey, params)
    case 'function':
      return computeFunctionMetric(metricKey, params)
    case 'molecule':
      return computeMoleculeMetric(metricKey, params)
    case 'reaction':
      return computeReactionMetric(metricKey, params)
    default:
      return 0
  }
}

function computeSpringMetric(key: string, params: Record<string, number>): number {
  const mass = params.mass ?? 1
  const k = params.stiffness ?? 20
  const damping = params.damping ?? 0.1
  const displacement = params.displacement ?? 1
  const omega = Math.sqrt(k / mass)

  switch (key) {
    case 'period':
      return (2 * Math.PI) / omega
    case 'omega':
      return omega
    case 'maxDisplacement':
      return Math.abs(displacement)
    case 'maxVelocity': {
      const t = 0
      const maxVel = Math.abs(
        displacement * Math.exp(-damping * t) * (-damping * Math.cos(omega * t) - omega * Math.sin(omega * t))
      )
      const t2 = 0.001
      const vel2 = Math.abs(
        displacement * Math.exp(-damping * t2) * (-damping * Math.cos(omega * t2) - omega * Math.sin(omega * t2))
      )
      const approxMax = displacement * omega
      return Math.max(maxVel, vel2, approxMax)
    }
    default:
      return 0
  }
}

function computeProjectileMetric(key: string, params: Record<string, number>): number {
  const v0 = params.velocity ?? 20
  const angleDeg = params.angle ?? 45
  const g = params.gravity ?? 9.8

  switch (key) {
    case 'range':
      return projectileRange(v0, angleDeg, g)
    case 'maxHeight':
      return projectileMaxHeight(v0, angleDeg, g)
    case 'flightTime': {
      const rad = (angleDeg * Math.PI) / 180
      return (2 * v0 * Math.sin(rad)) / g
    }
    default:
      return 0
  }
}

function computeWaveMetric(key: string, params: Record<string, number>): number {
  const wavelength = params.wavelength ?? 50
  const slitDistance = params.slitDistance ?? 150

  switch (key) {
    case 'centralIntensity':
      return waveInterference(wavelength, slitDistance, 200, 0)
    case 'fringeSpacing': {
      const L = 500
      return (wavelength * L) / slitDistance
    }
    default:
      return 0
  }
}

function computeFunctionMetric(key: string, params: Record<string, number>): number {
  const a = params.a ?? 1
  const b = params.b ?? 0
  const c = params.c ?? 0

  switch (key) {
    case 'vertexY': {
      if (a === 0) return c
      const vertex = quadraticVertex(a, b, c)
      return vertex.y
    }
    case 'discriminant':
      return b * b - 4 * a * c
    case 'vertexX': {
      if (a === 0) return 0
      return -b / (2 * a)
    }
    default:
      return 0
  }
}

function computeMoleculeMetric(key: string, params: Record<string, number>): number {
  switch (key) {
    case 'bondAngle':
      return params.bondAngle ?? 104.5
    case 'bondLength':
      return params.bondLength ?? 80
    default:
      return 0
  }
}

function computeReactionMetric(key: string, params: Record<string, number>): number {
  const concA = params.concentrationA ?? 20
  const concB = params.concentrationB ?? 20
  const temp = params.temperature ?? 300
  const ea = params.activationEnergy ?? 50
  const R = 8.314 / 1000

  switch (key) {
    case 'rateConstant':
      return Math.exp(-ea / (R * temp))
    case 'initialRate':
      return Math.exp(-ea / (R * temp)) * concA * concB
    case 'arrheniusFactor':
      return Math.exp(-ea / (R * temp))
    default:
      return 0
  }
}

export function generateScanGrid(
  experimentId: string,
  metricKey: string,
  xParam: { key: string; min: number; max: number; step: number },
  yParam: { key: string; min: number; max: number; step: number },
  fixedParams: Record<string, number>,
  resolution: number = 20
): { grid: number[][]; xValues: number[]; yValues: number[] } {
  const xValues: number[] = []
  const yValues: number[] = []
  const xStep = (xParam.max - xParam.min) / (resolution - 1)
  const yStep = (yParam.max - yParam.min) / (resolution - 1)

  for (let i = 0; i < resolution; i++) {
    xValues.push(parseFloat((xParam.min + i * xStep).toFixed(6)))
    yValues.push(parseFloat((yParam.min + i * yStep).toFixed(6)))
  }

  const grid: number[][] = []
  for (let yi = 0; yi < resolution; yi++) {
    const row: number[] = []
    for (let xi = 0; xi < resolution; xi++) {
      const scanParams = { ...fixedParams, [xParam.key]: xValues[xi], [yParam.key]: yValues[yi] }
      row.push(computeMetric(experimentId, metricKey, scanParams))
    }
    grid.push(row)
  }

  return { grid, xValues, yValues }
}
