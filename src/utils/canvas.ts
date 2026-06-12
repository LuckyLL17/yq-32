export function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number, gridSize: number = 40, color: string = 'rgba(0, 240, 255, 0.05)') {
  ctx.strokeStyle = color
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let x = 0; x <= width; x += gridSize) {
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
  }
  for (let y = 0; y <= height; y += gridSize) {
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
  }
  ctx.stroke()
}

export function drawArrow(ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, color: string = '#00f0ff', lineWidth: number = 2) {
  const headLength = 10
  const angle = Math.atan2(toY - fromY, toX - fromX)
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.beginPath()
  ctx.moveTo(fromX, fromY)
  ctx.lineTo(toX, toY)
  ctx.stroke()
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(toX, toY)
  ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6))
  ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6))
  ctx.closePath()
  ctx.fill()
}

export function drawCircle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, fillColor: string, strokeColor?: string, glowColor?: string) {
  if (glowColor) {
    ctx.save()
    ctx.shadowColor = glowColor
    ctx.shadowBlur = 20
  }
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fillStyle = fillColor
  ctx.fill()
  if (glowColor) {
    ctx.restore()
  }
  if (strokeColor) {
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = 1.5
    ctx.stroke()
  }
}

export function drawLine(ctx: CanvasRenderingContext2D, points: {x: number, y: number}[], color: string, lineWidth: number = 2, glow?: boolean) {
  if (points.length < 2) return
  if (glow) {
    ctx.save()
    ctx.shadowColor = color
    ctx.shadowBlur = 10
  }
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y)
  }
  ctx.stroke()
  if (glow) {
    ctx.restore()
  }
}

export function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string = '#e2e8f0', fontSize: number = 14, align: CanvasTextAlign = 'left') {
  ctx.font = `${fontSize}px sans-serif`
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x, y)
}

export function clearCanvas(ctx: CanvasRenderingContext2D, width: number, height: number, bgColor: string = '#0a0e17') {
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, width, height)
}

export function drawSpring(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, coils: number = 10, amplitude: number = 10, color: string = '#00f0ff') {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy)
  const angle = Math.atan2(dy, dx)
  const perpX = -Math.sin(angle)
  const perpY = Math.cos(angle)
  const leadIn = len * 0.1
  const springLen = len - leadIn * 2
  const segments = coils * 2
  const segLen = springLen / segments
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  const cosA = Math.cos(angle)
  const sinA = Math.sin(angle)
  ctx.lineTo(x1 + cosA * leadIn, y1 + sinA * leadIn)
  for (let i = 0; i < segments; i++) {
    const t = leadIn + (i + 1) * segLen
    const side = (i % 2 === 0 ? 1 : -1) * amplitude
    ctx.lineTo(x1 + cosA * t + perpX * side, y1 + sinA * t + perpY * side)
  }
  ctx.lineTo(x1 + cosA * (len - leadIn), y1 + sinA * (len - leadIn))
  ctx.lineTo(x2, y2)
  ctx.stroke()
}

export function drawTrail(ctx: CanvasRenderingContext2D, points: {x: number, y: number}[], color: string, maxAlpha: number = 0.8) {
  if (points.length < 2) return
  for (let i = 1; i < points.length; i++) {
    const alpha = (i / points.length) * maxAlpha
    ctx.strokeStyle = color.replace(/[\d.]+\)$/, `${alpha})`)
    if (!/[\d.]+\)$/.test(color)) {
      ctx.globalAlpha = alpha
      ctx.strokeStyle = color
    }
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(points[i - 1].x, points[i - 1].y)
    ctx.lineTo(points[i].x, points[i].y)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}
