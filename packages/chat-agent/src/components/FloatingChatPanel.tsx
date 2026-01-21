"use client";

import { CloseXIcon, ExpandIcon } from "./icons/index.js";
import { AnimatePresence, motion } from "framer-motion";
import { useRef } from "react";
import { useChat } from "./chat-context.js";
import ChatInterface, { ChatInterfaceRef } from "./ChatInterface.js";
import ChatMenuDropdown from "./ChatMenuDropdown.js";
import { DefaultImage, DefaultLink, ImageComponent, LinkComponent } from "../types/components.js";

interface FloatingChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  aiIcon: string;
  generateHref: (props: { type: string; value: { id: number; slug?: string | null } }) => string;
  ImageComponent?: ImageComponent;
  LinkComponent?: LinkComponent;
}

const FloatingChatPanel = ({
  isOpen,
  onClose,
  aiIcon,
  generateHref,
  ImageComponent: Image = DefaultImage,
  LinkComponent: Link = DefaultLink
}: FloatingChatPanelProps) => {
  const { isMaximized, setMaximized } = useChat();
  const chatInterfaceRef = useRef<ChatInterfaceRef>(null);

  const handleNewConversation = () => {
    chatInterfaceRef.current?.handleNewConversation();
  };

  return (
    <>
      {/* Backdrop cuando está maximizado - solo en desktop */}
      {isMaximized && isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300 hidden lg:block"
          onClick={() => setMaximized(false)}
        />
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bg-white shadow-2xl flex flex-col z-50 lg:border lg:border-gray-200"
            style={{ borderWidth: "0.5px" }}
            initial={{
              x: "-100vw",
              left: 0,
              top: 0,
              bottom: 0,
              width: "100vw",
              borderRadius: "0px",
            }}
            animate={
              isMaximized
                ? {
                    x: 0,
                    left: 0,
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: "100vw",
                    height: "100vh",
                    borderRadius: "0px",
                  }
                : {
                    x: 0,
                    // En móvil/tablet: fullscreen, en desktop: panel lateral
                    left:
                      typeof window !== "undefined" && window.innerWidth < 1024
                        ? 0
                        : "1rem",
                    top:
                      typeof window !== "undefined" && window.innerWidth < 1024
                        ? 0
                        : "5rem",
                    right: "auto",
                    bottom:
                      typeof window !== "undefined" && window.innerWidth < 1024
                        ? 0
                        : "1rem",
                    // Móvil/Tablet: 100vw (fullscreen), Desktop: 33.333333%
                    width:
                      typeof window !== "undefined" && window.innerWidth < 1024
                        ? "100vw"
                        : "33.333333%",
                    height:
                      typeof window !== "undefined" && window.innerWidth < 1024
                        ? "100vh"
                        : "auto",
                    borderRadius:
                      typeof window !== "undefined" && window.innerWidth < 1024
                        ? "0px"
                        : "0.75rem",
                  }
            }
            exit={{
              x: "-100vw",
              transition: {
                type: "spring",
                damping: 20,
                stiffness: 200,
              },
            }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 250,
            }}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full p-0.5 flex-shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg, #4B5563 0%, #6B7280 25%, #9CA3AF 50%, #6B7280 75%, #4B5563 100%)",
                  }}
                >
                  <div className="w-full h-full rounded-full overflow-hidden">
                    <Image
                      src={aiIcon}
                      alt="Oráculo"
                      className="w-full h-full object-cover"
                      width={40}
                      height={40}
                    />
                  </div>
                </div>
                <ChatMenuDropdown
                  title="Oráculo"
                  onNewConversation={handleNewConversation}
                />
              </div>
              <div className="flex items-center space-x-2 gap-2">
                {/* Botón maximizar/minimizar - solo visible en desktop (≥1024px) */}
                <button
                  onClick={() => setMaximized(!isMaximized)}
                  className="text-gray-500 hover:text-gray-700 transition-colors hidden lg:block"
                  aria-label={isMaximized ? "Minimizar" : "Maximizar"}
                >
                  <ExpandIcon
                    className={`w-4 h-4 ${isMaximized ? "rotate-180" : ""}`}
                  />
                </button>
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                  aria-label="Cerrar chat"
                >
                  <CloseXIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Chat Content */}
            <div className="flex-1 overflow-hidden">
              <ChatInterface ref={chatInterfaceRef} generateHref={generateHref} LinkComponent={Link} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingChatPanel;
