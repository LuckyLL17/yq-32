export function harmonicMotion(amplitude: number, omega: number, damping: number, t: number): number {
  return amplitude * Math.exp(-damping * t) * Math.cos(omega * t)
}

export function projectilePosition(v0: number, angle: number, g: number, t: number): {x: number, y: number} {
  const rad = angle * Math.PI / 180
  return {
    x: v0 * Math.cos(rad) * t,
    y: v0 * Math.sin(rad) * t - 0.5 * g * t * t
  }
}

export function projectileMaxHeight(v0: number, angle: number, g: number): number {
  const rad = angle * Math.PI / 180
  return (v0 * Math.sin(rad)) ** 2 / (2 * g)
}

export function projectileRange(v0: number, angle: number, g: number): number {
  const rad = angle * Math.PI / 180
  return (v0 ** 2 * Math.sin(2 * rad)) / g
}

export function waveInterference(wavelength: number, slitDistance: number, screenX: number, screenY: number): number {
  const r1 = Math.sqrt(screenX ** 2 + (screenY - slitDistance / 2) ** 2)
  const r2 = Math.sqrt(screenX ** 2 + (screenY + slitDistance / 2) ** 2)
  const delta = r2 - r1
  const k = (2 * Math.PI) / wavelength
  const intensity = Math.cos(k * delta / 2) ** 2
  return intensity
}

export function quadraticValue(a: number, b: number, c: number, x: number): number {
  return a * x * x + b * x + c
}

export function quadraticVertex(a: number, b: number, c: number): {x: number, y: number} {
  const vx = -b / (2 * a)
  const vy = a * vx * vx + b * vx + c
  return { x: vx, y: vy }
}
