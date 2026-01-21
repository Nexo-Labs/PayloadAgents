import { useState } from 'react'
import { MainButton } from './MainButton.js'

interface ChatInputProps {
  onSubmit: (message: string) => Promise<void>
  isLoading: boolean
}

/**
 * Component to handle chat input and submission
 */
export function ChatInput({ onSubmit, isLoading }: ChatInputProps) {
  const [input, setInput] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() || isLoading) return

    const message = input.trim()
    setInput('')
    await onSubmit(message)
  }

  return (
    <form onSubmit={handleSubmit} className="flex space-x-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Escribe tu pregunta..."
        disabled={isLoading}
        className="flex-1 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed bg-white text-gray-900"
      />
      <button type="submit" disabled={isLoading || !input.trim()}>
        <MainButton text={isLoading ? 'Enviando...' : 'Enviar'} />
      </button>
    </form>
  )
}
