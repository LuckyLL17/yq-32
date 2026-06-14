import { create } from 'zustand'
import type { Collaborator, RoomState, CollabMessage } from '@/data/types'

const COLLAB_CHANNEL_PREFIX = 'scilab-collab-'
const NICKNAMES = ['小明', '小红', '小刚', '小丽', '小华', '小芳', '阿杰', '阿美', '小龙', '小凤']
const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899']

const generateRoomId = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

const generateUserId = (): string => {
  return 'user-' + Math.random().toString(36).substring(2, 10)
}

const getRandomNickname = (): string => {
  return NICKNAMES[Math.floor(Math.random() * NICKNAMES.length)]
}

const getColorForUser = (index: number): string => {
  return COLORS[index % COLORS.length]
}

interface CollabState {
  isConnected: boolean
  roomId: string | null
  userId: string
  nickname: string
  userColor: string
  isHost: boolean
  collaborators: Collaborator[]
  currentOperatorId: string | null
  currentOperatorNickname: string | null
  currentParamKey: string | null
  currentParamLabel: string | null
  isMyTurn: boolean
  turnQueue: string[]
  channel: BroadcastChannel | null
  roomState: RoomState | null
  joinError: string | null

  generateAndJoinRoom: (experimentId: string, initialParams: Record<string, number>) => string
  joinRoom: (roomId: string) => Promise<{ experimentId: string; params: Record<string, number> } | null>
  leaveRoom: () => void
  sendCursorPosition: (x: number, y: number) => void
  sendParamChange: (key: string, value: number) => void
  sendParamsBatch: (params: Record<string, number>) => void
  sendParamDragStart: (key: string, label: string) => void
  sendParamDragEnd: (key: string) => void
  requestTurn: () => void
  releaseTurn: () => void
  setJoinError: (error: string | null) => void
  setNickname: (name: string) => void
}

export const useCollabStore = create<CollabState>((set, get) => ({
  isConnected: false,
  roomId: null,
  userId: generateUserId(),
  nickname: getRandomNickname(),
  userColor: COLORS[0],
  isHost: false,
  collaborators: [],
  currentOperatorId: null,
  currentOperatorNickname: null,
  currentParamKey: null,
  currentParamLabel: null,
  isMyTurn: true,
  turnQueue: [],
  channel: null,
  roomState: null,
  joinError: null,

  generateAndJoinRoom: (experimentId: string, initialParams: Record<string, number>): string => {
    const { userId, nickname } = get()
    const roomId = generateRoomId()
    const channel = new BroadcastChannel(COLLAB_CHANNEL_PREFIX + roomId)

    const selfCollaborator: Collaborator = {
      id: userId,
      nickname,
      color: getColorForUser(0),
      isHost: true,
      x: 0,
      y: 0,
      lastActive: Date.now(),
    }

    const roomState: RoomState = {
      roomId,
      experimentId,
      hostId: userId,
      collaborators: [selfCollaborator],
      currentOperatorId: userId,
      currentParamKey: null,
      params: { ...initialParams },
      turnQueue: [userId],
    }

    const handleMessage = (event: MessageEvent<CollabMessage>) => {
      const message = event.data
      const state = get()

      if (message.senderId === state.userId) return

      switch (message.type) {
        case 'join': {
          const newCollaborator: Collaborator = {
            id: message.senderId,
            nickname: message.senderNickname,
            color: getColorForUser(state.roomState!.collaborators.length),
            isHost: false,
            x: 0,
            y: 0,
            lastActive: Date.now(),
          }

          const updatedCollaborators = [...state.roomState!.collaborators, newCollaborator]
          const updatedQueue = [...state.roomState!.turnQueue, message.senderId]

          const newRoomState = {
            ...state.roomState!,
            collaborators: updatedCollaborators,
            turnQueue: updatedQueue,
          }

          set({
            roomState: newRoomState,
            collaborators: updatedCollaborators,
            turnQueue: updatedQueue,
          })

          state.channel!.postMessage({
            type: 'room-state',
            senderId: state.userId,
            senderNickname: state.nickname,
            timestamp: Date.now(),
            payload: { roomState: newRoomState },
          } as CollabMessage)
          break
        }

        case 'leave': {
          const filteredCollaborators = state.roomState!.collaborators.filter(
            (c) => c.id !== message.senderId
          )
          const filteredQueue = state.roomState!.turnQueue.filter((id) => id !== message.senderId)

          let newOperatorId = state.roomState!.currentOperatorId
          if (newOperatorId === message.senderId) {
            newOperatorId = filteredQueue.length > 0 ? filteredQueue[0] : state.userId
          }

          const newRoomState = {
            ...state.roomState!,
            collaborators: filteredCollaborators,
            turnQueue: filteredQueue,
            currentOperatorId: newOperatorId,
          }

          set({
            roomState: newRoomState,
            collaborators: filteredCollaborators,
            turnQueue: filteredQueue,
            currentOperatorId: newOperatorId,
            currentOperatorNickname: newOperatorId === state.userId ? state.nickname : null,
            isMyTurn: newOperatorId === state.userId,
          })
          break
        }

        case 'cursor': {
          const updatedCollaborators = state.collaborators.map((c) =>
            c.id === message.senderId
              ? {
                  ...c,
                  x: message.payload?.x as number,
                  y: message.payload?.y as number,
                  lastActive: Date.now(),
                }
              : c
          )
          set({ collaborators: updatedCollaborators })
          if (state.roomState) {
            set({
              roomState: { ...state.roomState, collaborators: updatedCollaborators },
            })
          }
          break
        }

        case 'param-change': {
          if (state.roomState) {
            const key = message.payload?.key as string
            const value = message.payload?.value as number
            const newParams = { ...state.roomState.params, [key]: value }
            set({
              roomState: { ...state.roomState, params: newParams },
            })
          }
          break
        }

        case 'params-batch': {
          if (state.roomState) {
            const newParams = message.payload?.params as Record<string, number>
            set({
              roomState: { ...state.roomState, params: newParams },
            })
          }
          break
        }

        case 'param-drag-start': {
          set({
            currentOperatorId: message.senderId,
            currentOperatorNickname: message.senderNickname,
            currentParamKey: message.payload?.key as string,
            currentParamLabel: message.payload?.label as string,
            isMyTurn: message.senderId === state.userId,
          })
          break
        }

        case 'param-drag-end': {
          set({
            currentParamKey: null,
            currentParamLabel: null,
          })
          break
        }

        case 'turn-grant': {
          const nextOperatorId = message.payload?.nextOperatorId as string
          const operator = state.collaborators.find((c) => c.id === nextOperatorId)
          set({
            currentOperatorId: nextOperatorId,
            currentOperatorNickname: operator?.nickname || null,
            isMyTurn: nextOperatorId === state.userId,
          })
          if (state.roomState) {
            set({
              roomState: { ...state.roomState, currentOperatorId: nextOperatorId },
            })
          }
          break
        }

        case 'room-state': {
          const receivedRoomState = message.payload?.roomState as RoomState
          const selfInRoom = receivedRoomState.collaborators.find((c) => c.id === state.userId)
          set({
            roomState: receivedRoomState,
            collaborators: receivedRoomState.collaborators,
            turnQueue: receivedRoomState.turnQueue,
            currentOperatorId: receivedRoomState.currentOperatorId,
            isMyTurn: receivedRoomState.currentOperatorId === state.userId,
            userColor: selfInRoom?.color || state.userColor,
            isHost: receivedRoomState.hostId === state.userId,
            currentOperatorNickname:
              receivedRoomState.currentOperatorId === state.userId
                ? state.nickname
                : receivedRoomState.collaborators.find((c) => c.id === receivedRoomState.currentOperatorId)
                    ?.nickname || null,
          })
          break
        }

        case 'ping': {
          state.channel!.postMessage({
            type: 'pong',
            senderId: state.userId,
            senderNickname: state.nickname,
            timestamp: Date.now(),
          } as CollabMessage)
          break
        }
      }
    }

    channel.onmessage = handleMessage

    set({
      isConnected: true,
      roomId,
      channel,
      isHost: true,
      collaborators: [selfCollaborator],
      roomState,
      currentOperatorId: userId,
      currentOperatorNickname: nickname,
      isMyTurn: true,
      turnQueue: [userId],
      userColor: getColorForUser(0),
      joinError: null,
    })

    return roomId
  },

  joinRoom: async (roomId: string): Promise<{ experimentId: string; params: Record<string, number> } | null> => {
    const { userId, nickname } = get()

    if (!/^\d{6}$/.test(roomId)) {
      set({ joinError: '请输入有效的6位房间号' })
      return null
    }

    const channel = new BroadcastChannel(COLLAB_CHANNEL_PREFIX + roomId)

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        channel.close()
        set({ joinError: '房间不存在或已过期，请检查房间号' })
        resolve(null)
      }, 3000)

      const handleMessage = (event: MessageEvent<CollabMessage>) => {
        const message = event.data

        if (message.type === 'room-state' && message.payload?.roomState) {
          clearTimeout(timeout)
          const roomState = message.payload.roomState as RoomState
          const selfCollaborator: Collaborator = {
            id: userId,
            nickname,
            color: getColorForUser(roomState.collaborators.length),
            isHost: false,
            x: 0,
            y: 0,
            lastActive: Date.now(),
          }

          const allCollaborators = [...roomState.collaborators, selfCollaborator]

          set({
            isConnected: true,
            roomId,
            channel,
            isHost: false,
            collaborators: allCollaborators,
            roomState: {
              ...roomState,
              collaborators: allCollaborators,
            },
            currentOperatorId: roomState.currentOperatorId,
            currentOperatorNickname:
              roomState.currentOperatorId === userId
                ? nickname
                : roomState.collaborators.find((c) => c.id === roomState.currentOperatorId)?.nickname || null,
            isMyTurn: roomState.currentOperatorId === userId,
            turnQueue: roomState.turnQueue,
            userColor: selfCollaborator.color,
            joinError: null,
          })

          channel.onmessage = (event) => {
            const state = get()
            const msg = event.data
            if (msg.senderId === state.userId) return

            switch (msg.type) {
              case 'cursor': {
                const updated = state.collaborators.map((c) =>
                  c.id === msg.senderId
                    ? { ...c, x: msg.payload?.x as number, y: msg.payload?.y as number, lastActive: Date.now() }
                    : c
                )
                set({ collaborators: updated })
                break
              }
              case 'param-change': {
                if (state.roomState) {
                  const key = msg.payload?.key as string
                  const value = msg.payload?.value as number
                  set({
                    roomState: { ...state.roomState, params: { ...state.roomState.params, [key]: value } },
                  })
                }
                break
              }
              case 'params-batch': {
                if (state.roomState) {
                  set({
                    roomState: { ...state.roomState, params: msg.payload?.params as Record<string, number> },
                  })
                }
                break
              }
              case 'param-drag-start': {
                set({
                  currentOperatorId: msg.senderId,
                  currentOperatorNickname: msg.senderNickname,
                  currentParamKey: msg.payload?.key as string,
                  currentParamLabel: msg.payload?.label as string,
                  isMyTurn: msg.senderId === state.userId,
                })
                break
              }
              case 'param-drag-end': {
                set({ currentParamKey: null, currentParamLabel: null })
                break
              }
              case 'turn-grant': {
                const nextId = msg.payload?.nextOperatorId as string
                const op = state.collaborators.find((c) => c.id === nextId)
                set({
                  currentOperatorId: nextId,
                  currentOperatorNickname: op?.nickname || null,
                  isMyTurn: nextId === state.userId,
                })
                break
              }
              case 'room-state': {
                const rs = msg.payload?.roomState as RoomState
                const self = rs.collaborators.find((c) => c.id === state.userId)
                set({
                  roomState: rs,
                  collaborators: rs.collaborators,
                  turnQueue: rs.turnQueue,
                  currentOperatorId: rs.currentOperatorId,
                  isMyTurn: rs.currentOperatorId === state.userId,
                  userColor: self?.color || state.userColor,
                })
                break
              }
              case 'leave': {
                const filtered = state.collaborators.filter((c) => c.id !== msg.senderId)
                set({ collaborators: filtered })
                if (state.roomState) {
                  set({
                    roomState: { ...state.roomState, collaborators: filtered },
                  })
                }
                break
              }
            }
          }

          resolve({
            experimentId: roomState.experimentId,
            params: roomState.params,
          })
        }
      }

      channel.onmessage = handleMessage

      channel.postMessage({
        type: 'join',
        senderId: userId,
        senderNickname: nickname,
        timestamp: Date.now(),
      } as CollabMessage)
    })
  },

  leaveRoom: () => {
    const { channel, roomId, userId, nickname } = get()

    if (channel && roomId) {
      channel.postMessage({
        type: 'leave',
        senderId: userId,
        senderNickname: nickname,
        timestamp: Date.now(),
      } as CollabMessage)
      channel.close()
    }

    set({
      isConnected: false,
      roomId: null,
      channel: null,
      isHost: false,
      collaborators: [],
      roomState: null,
      currentOperatorId: null,
      currentOperatorNickname: null,
      currentParamKey: null,
      currentParamLabel: null,
      isMyTurn: true,
      turnQueue: [],
      joinError: null,
    })
  },

  sendCursorPosition: (x: number, y: number) => {
    const { channel, userId, nickname, isConnected } = get()
    if (!isConnected || !channel) return

    channel.postMessage({
      type: 'cursor',
      senderId: userId,
      senderNickname: nickname,
      timestamp: Date.now(),
      payload: { x, y },
    } as CollabMessage)
  },

  sendParamChange: (key: string, value: number) => {
    const { channel, userId, nickname, isConnected } = get()
    if (!isConnected || !channel) return

    channel.postMessage({
      type: 'param-change',
      senderId: userId,
      senderNickname: nickname,
      timestamp: Date.now(),
      payload: { key, value },
    } as CollabMessage)
  },

  sendParamsBatch: (params: Record<string, number>) => {
    const { channel, userId, nickname, isConnected } = get()
    if (!isConnected || !channel) return

    channel.postMessage({
      type: 'params-batch',
      senderId: userId,
      senderNickname: nickname,
      timestamp: Date.now(),
      payload: { params },
    } as CollabMessage)
  },

  sendParamDragStart: (key: string, label: string) => {
    const { channel, userId, nickname, isConnected } = get()
    if (!isConnected || !channel) return

    channel.postMessage({
      type: 'param-drag-start',
      senderId: userId,
      senderNickname: nickname,
      timestamp: Date.now(),
      payload: { key, label },
    } as CollabMessage)
  },

  sendParamDragEnd: (key: string) => {
    const { channel, userId, nickname, isConnected, turnQueue } = get()
    if (!isConnected || !channel) return

    channel.postMessage({
      type: 'param-drag-end',
      senderId: userId,
      senderNickname: nickname,
      timestamp: Date.now(),
      payload: { key },
    } as CollabMessage)

    const currentIndex = turnQueue.indexOf(userId)
    const nextIndex = (currentIndex + 1) % turnQueue.length
    const nextOperatorId = turnQueue[nextIndex]

    if (nextOperatorId && nextOperatorId !== userId) {
      setTimeout(() => {
        channel.postMessage({
          type: 'turn-grant',
          senderId: userId,
          senderNickname: nickname,
          timestamp: Date.now(),
          payload: { nextOperatorId },
        } as CollabMessage)
      }, 300)
    }
  },

  requestTurn: () => {
    const { channel, userId, nickname, isConnected } = get()
    if (!isConnected || !channel) return

    channel.postMessage({
      type: 'turn-request',
      senderId: userId,
      senderNickname: nickname,
      timestamp: Date.now(),
    } as CollabMessage)
  },

  releaseTurn: () => {
    const { channel, userId, nickname, isConnected, turnQueue } = get()
    if (!isConnected || !channel) return

    const currentIndex = turnQueue.indexOf(userId)
    const nextIndex = (currentIndex + 1) % turnQueue.length
    const nextOperatorId = turnQueue[nextIndex]

    if (nextOperatorId) {
      channel.postMessage({
        type: 'turn-grant',
        senderId: userId,
        senderNickname: nickname,
        timestamp: Date.now(),
        payload: { nextOperatorId },
      } as CollabMessage)
    }
  },

  setJoinError: (error: string | null) => {
    set({ joinError: error })
  },

  setNickname: (name: string) => {
    set({ nickname: name })
  },
}))
