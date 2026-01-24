'use client'

import FloatingChatPanel from './FloatingChatPanel.js'
import FloatingChatButton from './buttons/FloatingChatButton.js'
import { useChat } from './chat-context.js'
import { ImageComponent, LinkComponent } from '../types/components.js'

/**
 * Minimal user type - consumer provides their own user type
 */
interface User {
  id: string | number
  [key: string]: unknown
}

interface FloatingChatManagerProps {
  aiIcon: string
  useUser: () => { user: User | null }
  generateHref: (props: { type: string; value: { id: number; slug?: string | null } }) => string
  LinkComponent?: LinkComponent
  ImageComponent?: ImageComponent
}

const FloatingChatManager = ({
  aiIcon,
  useUser,
  generateHref,
  LinkComponent,
  ImageComponent
}: FloatingChatManagerProps) => {
  const { user } = useUser()
  const { isPanelOpen, openPanel, closePanel } = useChat()

  if (!user) return null

  return (
    <>
      <FloatingChatButton
        onOpen={openPanel}
        aiIcon={aiIcon}
        ImageComponent={ImageComponent}
      />
      {/* Siempre renderizar para que AnimatePresence funcione */}
      <FloatingChatPanel
        isOpen={isPanelOpen}
        onClose={closePanel}
        aiIcon={aiIcon}
        generateHref={generateHref}
        LinkComponent={LinkComponent}
        ImageComponent={ImageComponent}
      />
    </>
  )
}

export default FloatingChatManager