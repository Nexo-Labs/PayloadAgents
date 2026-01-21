'use client'

import { useEffect, useRef, useState } from 'react'
import { useChat } from './chat-context.js'

interface ChatMenuDropdownProps {
  title: string
  onNewConversation: () => void
}

const ChatMenuDropdown = ({ title, onNewConversation }: ChatMenuDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { agents, selectedAgent, setSelectedAgent, isLoadingAgents } = useChat()

  // State for confirmation modal
  const [pendingAgentSlug, setPendingAgentSlug] = useState<string | null>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNewConversationClick = () => {
    onNewConversation()
    setIsOpen(false)
  }

  const handleAgentSelect = (agentSlug: string) => {
    if (agentSlug === selectedAgent) {
      setIsOpen(false)
      return
    }

    // Close dropdown and show confirmation modal
    setIsOpen(false)
    setPendingAgentSlug(agentSlug)
  }

  const confirmAgentChange = () => {
    if (pendingAgentSlug) {
      setSelectedAgent(pendingAgentSlug)
      onNewConversation() // Start new conversation with new agent
      setPendingAgentSlug(null)
    }
  }

  const cancelAgentChange = () => {
    setPendingAgentSlug(null)
  }

  // Find current agent name for title
  const currentAgent = agents.find(a => a.slug === selectedAgent)
  const displayTitle = currentAgent?.name || currentAgent?.slug || title

  // Find pending agent name for modal
  const pendingAgent = agents.find(a => a.slug === pendingAgentSlug)
  const pendingAgentName = pendingAgent?.name || pendingAgent?.slug

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors"
          aria-label="Menú de chat"
        >
          <span>{displayTitle}</span>
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 max-h-96 overflow-y-auto">
            <button
              onClick={handleNewConversationClick}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors font-medium"
            >
              Nueva conversación
            </button>

            {agents.length > 1 && (
              <>
                <div className="border-t border-gray-100 my-1"></div>
                <div className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Cambiar Agente
                </div>
                {agents.map((agent) => (
                  <button
                    key={agent.slug}
                    onClick={() => handleAgentSelect(agent.slug)}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors flex justify-between items-center ${selectedAgent === agent.slug ? 'text-blue-600 font-medium bg-blue-50' : 'text-gray-700'
                      }`}
                  >
                    <span className="truncate">{agent.name || agent.slug}</span>
                    {selectedAgent === agent.slug && (
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {pendingAgentSlug && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full transform transition-all scale-100 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              ¿Cambiar a {pendingAgentName}?
            </h3>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
              Se iniciará una nueva conversación con este agente. La conversación actual se guardará en el historial.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelAgentChange}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmAgentChange}
                className="px-4 py-2 text-sm font-medium bg-black text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
              >
                Sí, cambiar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ChatMenuDropdown
