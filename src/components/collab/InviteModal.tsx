import { useState } from 'react'
import { X, Users, Copy, Check, Share2 } from 'lucide-react'
import { useCollabStore } from '@/stores/collabStore'

interface InviteModalProps {
  open: boolean
  onClose: () => void
}

export default function InviteModal({ open, onClose }: InviteModalProps) {
  const [copied, setCopied] = useState(false)
  const { roomId, collaborators, nickname, setNickname, userColor } = useCollabStore()

  if (!open) return null

  const handleCopy = async () => {
    if (roomId) {
      await navigator.clipboard.writeText(roomId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShare = async () => {
    if (navigator.share && roomId) {
      try {
        await navigator.share({
          title: 'SciLab 协作实验',
          text: `邀请你加入实验，房间号：${roomId}`,
          url: window.location.origin,
        })
      } catch {
        handleCopy()
      }
    } else {
      handleCopy()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-md rounded-2xl p-6 mx-4 animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: userColor + '20' }}
            >
              <Users className="w-5 h-5" style={{ color: userColor }} />
            </div>
            <div>
              <h2 className="font-orbitron text-xl font-bold text-white">邀请好友</h2>
              <p className="text-sm text-slate-400">共享房间号一起做实验</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            我的昵称
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full bg-space-800/50 border border-neon-cyan/30 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/50 transition-all"
            maxLength={10}
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            房间号
          </label>
          <div className="flex gap-3">
            <div className="flex-1 bg-space-800/50 border border-neon-cyan/50 rounded-lg px-4 py-3">
              <span className="font-orbitron text-2xl tracking-[0.2em] text-neon-cyan glow-text">
                {roomId}
              </span>
            </div>
            <button
              onClick={handleCopy}
              className="neon-btn px-4 flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  复制
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mb-6">
          <button
            onClick={handleShare}
            className="w-full neon-btn neon-btn-green flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            分享给好友
          </button>
        </div>

        <div className="pt-4 border-t border-white/10">
          <h3 className="text-sm font-medium text-slate-300 mb-3">
            在线成员 ({collaborators.length})
          </h3>
          <div className="space-y-2">
            {collaborators.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-white/5"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: c.color }}
                >
                  {c.nickname.charAt(0)}
                </div>
                <span className="text-sm text-white">{c.nickname}</span>
                {c.isHost && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-neon-cyan/20 text-neon-cyan">
                    房主
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-neon-cyan/5 border border-neon-cyan/20">
          <p className="text-xs text-slate-400">
            💡 提示：将房间号分享给好友，好友在首页输入房间号即可加入同一实验
          </p>
        </div>
      </div>
    </div>
  )
}
