import { useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

interface DataChartProps {
  data: { x: number; y: number }[]
  xLabel?: string
  yLabel?: string
  color?: string
}

export default function DataChart({
  data,
  xLabel,
  yLabel,
  color = '#00f0ff',
}: DataChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (chartRef.current) {
      chartRef.current.destroy()
    }

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [
          {
            data: data.map((d) => ({ x: d.x, y: d.y })),
            borderColor: color,
            backgroundColor: `${color}22`,
            borderWidth: 2,
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHoverBackgroundColor: color,
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: {
          mode: 'nearest',
          intersect: false,
        },
        scales: {
          x: {
            type: 'linear',
            title: {
              display: !!xLabel,
              text: xLabel,
              color: '#94a3b8',
              font: { size: 11 },
            },
            grid: {
              color: 'rgba(0, 240, 255, 0.08)',
            },
            ticks: {
              color: '#64748b',
              font: { size: 10 },
              maxTicksLimit: 8,
            },
          },
          y: {
            title: {
              display: !!yLabel,
              text: yLabel,
              color: '#94a3b8',
              font: { size: 11 },
            },
            grid: {
              color: 'rgba(0, 240, 255, 0.08)',
            },
            ticks: {
              color: '#64748b',
              font: { size: 10 },
              maxTicksLimit: 6,
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(15, 21, 36, 0.95)',
            titleColor: color,
            bodyColor: '#e2e8f0',
            borderColor: `${color}44`,
            borderWidth: 1,
            padding: 8,
            displayColors: false,
            callbacks: {
              title: (items) => {
                if (!items.length) return ''
                const item = items[0]
                return `${xLabel || 'x'}: ${Number(item.parsed.x).toFixed(2)}`
              },
              label: (item) => {
                return `${yLabel || 'y'}: ${Number(item.parsed.y).toFixed(3)}`
              },
            },
          },
        },
      },
    })

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
        chartRef.current = null
      }
    }
  }, [data, xLabel, yLabel, color])

  return (
    <div className="w-full h-full glass-panel rounded-xl p-4">
      <canvas ref={canvasRef} />
    </div>
  )
}
