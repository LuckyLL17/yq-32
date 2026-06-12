export class AnimationLoop {
  private running: boolean = false
  private frameId: number = 0
  private callback: (dt: number) => void
  private lastTime: number = 0

  constructor(callback: (dt: number) => void) {
    this.callback = callback
  }

  start(): void {
    if (this.running) return
    this.running = true
    this.lastTime = performance.now()
    const loop = (time: number) => {
      if (!this.running) return
      const dt = (time - this.lastTime) / 1000
      this.lastTime = time
      this.callback(dt)
      this.frameId = requestAnimationFrame(loop)
    }
    this.frameId = requestAnimationFrame(loop)
  }

  stop(): void {
    this.running = false
    cancelAnimationFrame(this.frameId)
  }

  isRunning(): boolean {
    return this.running
  }

  destroy(): void {
    this.stop()
    this.callback = () => {}
  }
}
