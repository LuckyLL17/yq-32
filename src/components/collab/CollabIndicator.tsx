import { useCollabStore } from '@/stores/collabStore'
import { Hand, User, LogOut } from 'lucide-react'

export default function CollabIndicator() {
  const {
    isConnected,
    roomId,
    collaborators,
    userId,
    currentOperatorNickname,
    currentParamLabel,
    isMyTurn,
    leaveRoom,
    userColor,
  } = useCollabStore()

  if (!isConnected) return null

  const isSomeoneDragging = currentParamLabel && currentOperatorNickname

  return (
    <>
      {isSomeoneDragging && currentOperatorNickname !== useCollabStore.getState().nickname && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
          <div
            className="glass-panel px-4 py-2 rounded-full flex items-center gap-2 animate-pulse"
            style={{
              borderColor: useCollabStore.getState().collaborators.find(
                (c) => c.nickname === currentOperatorNickname
              )?.color || '#00f0ff',
            }}
          >
            <Hand className="w-4 h-4 text-neon-cyan" />
            <span className="text-sm font-medium text-white">
              <span style={{ color: useCollabStore.getState().collaborators.find(
                (c) => c.nickname === currentOperatorNickname
              )?.color }}>
                {currentOperatorNickname}
              </span>
              {' '}正在拖拽{' '}
              <span className="text-neon-cyan">{currentParamLabel}</span>
            </span>
          </div>
        </div>
      )}

      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <div className="glass-panel px-3 py-2 rounded-lg flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full bg-green-400 animate-pulse"
            style={{ boxShadow: '0 0 8px #4ade80' }}
          />
          <span className="text-xs font-orbitron text-neon-cyan">
            {roomId}
          </span>
          <span className="text-xs text-slate-400">
            {collaborators.length} 人在线
          </span>
        </div>

        <div className="glass-panel px-3 py-2 rounded-lg flex items-center gap-2">
          {isMyTurn ? (
            <>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ backgroundColor: userColor }}
              >
                  <User className="w-3 h-3" />
                </div>
                <span className="text-xs text-green-400">轮到你操作</span>
              </>
            ) : (
              <>
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center bg-slate-600">
                  <User className="w-3 h-3 text-slate-400" />
                </div>
                <span className="text-xs text-slate-400">等待操作</span>
              </>
            )}
        </div>

        <button
          onClick={leaveRoom}
          className="glass-panel px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-red-500/20 hover:border-red-500/50 transition-colors"
          title="离开房间"
        >
          <LogOut className="w-4 h-4 text-red-400" />
        </button>
      </div>

      <div className="absolute bottom-4 left-4 z-20">
        <div className="glass-panel px-3 py-2 rounded-lg">
          <div className="flex -space-x-2">
            {collaborators.map((c) => (
              <div
                key={c.id}
                className="relative"
                title={c.nickname}
              >
                <div
                className="w-8 h-8 rounded-full border-2 border-space-800 flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: c.color }}
              >
                {c.nickname.charAt(0)}
              </div>
              {c.id === userId && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-space-800" />
              )}
            </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
