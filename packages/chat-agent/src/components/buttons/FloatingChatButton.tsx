"use client";

import { ComponentProps } from "react";

interface FloatingChatButtonProps {
  onOpen: () => void;
  aiIcon: string;
}

const FloatingChatButton = ({ onOpen, aiIcon }: FloatingChatButtonProps) => {
  return (
    <div className="fixed bottom-6 left-6 z-40">
      <button
        onClick={onOpen}
        className="relative w-16 h-16 rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-600 transition-all duration-300 transform hover:scale-105"
        aria-label="Abrir chat"
        style={{
          background:
            "linear-gradient(135deg, #4B5563 0%, #6B7280 25%, #9CA3AF 50%, #6B7280 75%, #4B5563 100%)",
        }}
      >
        <div className="w-full h-full rounded-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={aiIcon}
            alt="AI Chat Icon"
            className="w-full h-full object-cover"
            width={56}
            height={56}
          />
        </div>
      </button>
    </div>
  );
};

export default FloatingChatButton;
