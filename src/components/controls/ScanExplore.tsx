import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import type { ParamConfig } from '@/data/types'
import { getMetricsForExperiment, generateScanGrid } from '@/utils/scanMetrics'

interface ScanExploreProps {
  experimentId: string
  params: ParamConfig[]
  currentParams: Record<string, number>
  onScanComplete: (result: ScanResult) => void
}

export interface ScanResult {
  grid: number[][]
  xValues: number[]
  yValues: number[]
  xParamKey: string
  yParamKey: string
  xParamLabel: string
  yParamLabel: string
  metricKey: string
  metricLabel: string
  metricUnit: string
  fixedParams: Record<string, number>
}

export default function ScanExplore({ experimentId, params, currentParams, onScanComplete }: ScanExploreProps) {
  const [expanded, setExpanded] = useState(false)
  const [xParamKey, setXParamKey] = useState(params[0]?.key ?? '')
  const [yParamKey, setYParamKey] = useState(params.length > 1 ? params[1].key : params[0]?.key ?? '')
  const [metricKey, setMetricKey] = useState('')
  const [scanning, setScanning] = useState(false)

  const metrics = useMemo(() => getMetricsForExperiment(experimentId), [experimentId])

  useMemo(() => {
    if (metrics.length > 0 && !metrics.find(m => m.key === metricKey)) {
      setMetricKey(metrics[0].key)
    }
  }, [metrics, metricKey])

  const selectableXParams = params
  const selectableYParams = params.filter(p => p.key !== xParamKey)

  const handleScan = () => {
    if (!xParamKey || !yParamKey || !metricKey) return

    setScanning(true)

    requestAnimationFrame(() => {
      const xParam = params.find(p => p.key === xParamKey)!
      const yParam = params.find(p => p.key === yParamKey)!
      const metric = metrics.find(m => m.key === metricKey)!

      const fixedParams = { ...currentParams }
      delete fixedParams[xParamKey]
      delete fixedParams[yParamKey]

      const result = generateScanGrid(
        experimentId,
        metricKey,
        { key: xParam.key, min: xParam.min, max: xParam.max, step: xParam.step },
        { key: yParam.key, min: yParam.min, max: yParam.max, step: yParam.step },
        fixedParams,
        20
      )

      onScanComplete({
        ...result,
        xParamKey,
        yParamKey,
        xParamLabel: xParam.label,
        yParamLabel: yParam.label,
        metricKey,
        metricLabel: metric.label,
        metricUnit: metric.unit,
        fixedParams,
      })

      setScanning(false)
    })
  }

  return (
    <div className="scan-explore-container">
      <button
        className="scan-explore-btn w-full"
        onClick={() => setExpanded(!expanded)}
      >
        <Search className="w-4 h-4" />
        <span className="font-orbitron text-sm">扫描探索</span>
      </button>

      {expanded && (
        <div className="scan-explore-panel animate-fade-in">
          <div className="space-y-3">
            <div>
              <label className="scan-explore-label">X 轴参数</label>
              <select
                className="scan-explore-select"
                value={xParamKey}
                onChange={e => {
                  setXParamKey(e.target.value)
                  if (e.target.value === yParamKey) {
                    const other = params.find(p => p.key !== e.target.value)
                    if (other) setYParamKey(other.key)
                  }
                }}
              >
                {selectableXParams.map(p => (
                  <option key={p.key} value={p.key}>{p.label} ({p.unit || '无单位'})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="scan-explore-label">Y 轴参数</label>
              <select
                className="scan-explore-select"
                value={yParamKey}
                onChange={e => setYParamKey(e.target.value)}
              >
                {selectableYParams.map(p => (
                  <option key={p.key} value={p.key}>{p.label} ({p.unit || '无单位'})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="scan-explore-label">输出指标</label>
              <select
                className="scan-explore-select"
                value={metricKey}
                onChange={e => setMetricKey(e.target.value)}
              >
                {metrics.map(m => (
                  <option key={m.key} value={m.key}>{m.label} {m.unit ? `(${m.unit})` : ''}</option>
                ))}
              </select>
            </div>

            <button
              className="scan-explore-run-btn"
              onClick={handleScan}
              disabled={scanning || !xParamKey || !yParamKey || !metricKey || xParamKey === yParamKey}
            >
              {scanning ? (
                <span className="flex items-center gap-2">
                  <span className="scan-spinner" />
                  计算中...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5" />
                  开始扫描
                </span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
