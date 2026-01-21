import { SourcesList } from './SourcesList.js'
import { LinkComponent } from '../types/components.js'

interface Source {
  id: string
  title: string
  slug: string
  type: 'article' | 'book'
  chunkIndex: number
  relevanceScore: number
  content: string
  excerpt?: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  sources?: Source[]
}

interface ChatMessagesProps {
  messages: Message[]
  isLoading: boolean
  error: string | null
  isMaximized?: boolean
  onMinimize?: () => void
  generateHref: (props: { type: string; value: { id: number; slug?: string | null } }) => string
  LinkComponent?: LinkComponent
}

/**
 * Component to render chat messages with sources
 */
export function ChatMessages({ messages, isLoading, error, isMaximized, onMinimize, generateHref, LinkComponent }: ChatMessagesProps) {
  if (messages.length === 0) {
    return (
      <div className="text-center text-gray-500 mt-8">
        <p className="text-lg mb-2">¡Bienvenido al Oráculo de Escohotado!</p>
        <p className="text-sm">
          Pregunta sobre filosofía, drogas, libertad, historia de las ideas y más.
        </p>
      </div>
    )
  }

  return (
    <>
      {messages.map((message, index) => (
        <div
          key={index}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] rounded-lg px-4 py-2 ${message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200  text-gray-900'
              }`}
          >
            <div className="whitespace-pre-wrap break-words">{message.content}</div>
            <div
              className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-200' : 'text-gray-500'
                }`}
            >
              {message.timestamp.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>

            {/* Show sources for assistant messages */}
            {message.role === 'assistant' && message.sources && (
              <SourcesList
                sources={message.sources}
                isMaximized={isMaximized}
                onMinimize={onMinimize}
                generateHref={generateHref}
                LinkComponent={LinkComponent}
              />
            )}
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-start">
          <div className="max-w-[80%] rounded-lg px-4 py-2 bg-gray-200">
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
    </>
  )
}
