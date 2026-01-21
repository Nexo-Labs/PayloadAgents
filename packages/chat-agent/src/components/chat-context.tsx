'use client'

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react'

export interface TokenUsage {
  limit: number
  used: number
  remaining: number
  percentage: number
  reset_at: string
}

export interface PublicAgentInfo {
  slug: string
  name: string
}

interface AgentsResponse {
  agents: PublicAgentInfo[]
}

interface ChatContextType {
  isPanelOpen: boolean
  isMaximized: boolean
  openPanel: () => void
  closePanel: () => void
  setMaximized: (value: boolean) => void
  tokenUsage: TokenUsage | null
  isLoadingTokens: boolean
  updateTokenUsage: (newUsage: Partial<TokenUsage>) => void
  // Agent management
  agents: PublicAgentInfo[]
  selectedAgent: string | null
  setSelectedAgent: (slug: string) => void
  isLoadingAgents: boolean
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)

  // Token usage management - lazy loaded from SSE events
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null)
  const isLoadingTokens = false // No initial fetch needed

  // Agent management
  const [agents, setAgents] = useState<PublicAgentInfo[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [isLoadingAgents, setIsLoadingAgents] = useState(true)

  // Load agents on mount
  useEffect(() => {
    const loadAgents = async () => {
      try {
        setIsLoadingAgents(true)
        const response = await fetch('/api/chat/agents')
        if (response.ok) {
          const data = (await response.json()) as AgentsResponse
          setAgents(data.agents || [])
          if (data.agents?.length > 0 && !selectedAgent) {
            setSelectedAgent(data.agents[0]?.slug || null)
          }
        } else {
          console.error('[ChatContext] Failed to load agents:', response.statusText)
        }
      } catch (error) {
        console.error('[ChatContext] Error loading agents:', error)
      } finally {
        setIsLoadingAgents(false)
      }
    }

    loadAgents()
  }, [selectedAgent])

  // Check if device is mobile or tablet (not desktop)
  const isMobileOrTablet = () => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < 1024 // Tailwind lg breakpoint
  }

  const openPanel = () => {
    setIsPanelOpen(true)
    // Auto-maximize on mobile and tablet
    if (isMobileOrTablet()) {
      setIsMaximized(true)
    }
  }

  const closePanel = () => {
    setIsPanelOpen(false)
    setIsMaximized(false)
  }

  const setMaximized = (value: boolean) => setIsMaximized(value)

  // Update token usage (called from SSE events)
  // Memoized to prevent infinite loops in useEffect dependencies
  const updateTokenUsage = useCallback((newUsage: Partial<TokenUsage>) => {
    setTokenUsage((prev) => {
      if (!prev) {
        // First time: create full object from partial
        return newUsage as TokenUsage
      }
      // Subsequent updates: merge
      return {
        ...prev,
        ...newUsage,
      }
    })
  }, [])

  // Block body scroll when chat is maximized
  useEffect(() => {
    if (isMaximized && isPanelOpen) {
      // Save current scroll position
      const scrollY = window.scrollY

      // Prevent body scroll
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'

      return () => {
        // Restore body scroll
        document.body.style.overflow = ''
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''

        // Restore scroll position
        window.scrollTo(0, scrollY)
      }
    }
  }, [isMaximized, isPanelOpen])

  return (
    <ChatContext.Provider
      value={{
        isPanelOpen,
        isMaximized,
        openPanel,
        closePanel,
        setMaximized,
        tokenUsage,
        isLoadingTokens,
        updateTokenUsage,
        agents,
        selectedAgent,
        setSelectedAgent,
        isLoadingAgents
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export const useChat = () => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}
