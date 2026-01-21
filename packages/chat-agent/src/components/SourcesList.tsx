"use client";

import {
  ArticleIcon,
  BookIcon,
  ChevronDownIcon,
  CloseXIcon,
  ListIcon,
} from "./icons/index.js";
import { useChunkLoader } from "../hooks/useChunkLoader.js";
import { AnimatePresence, motion } from "framer-motion";
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { ViewMoreLink } from "./buttons/ViewMoreLink.js";
import { LinkComponent } from "../types/components.js";

interface Source {
  id: string;
  title: string;
  slug: string;
  type: "article" | "book";
  chunkIndex: number;
  relevanceScore: number;
  content: string;
  excerpt?: string;
}

interface SourcesListProps {
  sources: Source[];
  isMaximized?: boolean;
  onMinimize?: () => void;
  generateHref: (props: { type: string; value: { id: number; slug?: string | null } }) => string;
  LinkComponent?: LinkComponent;
  renderSourceIcon?: (type: "article" | "book") => React.ReactNode;
  renderViewMore?: (props: {
    type: "article" | "book";
    slug: string;
    title: string;
    onClick?: () => void;
  }) => React.ReactNode;
}

// Animation variants
const listVariants = {
  hidden: {
    opacity: 0,
    height: 0,
    transition: {
      duration: 0.2,
      ease: "easeInOut" as const,
    },
  },
  visible: {
    opacity: 1,
    height: "auto",
    transition: {
      duration: 0.3,
      ease: "easeOut" as const,
    },
  },
};

const expandedCardVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: -10,
    transition: {
      duration: 0.2,
      ease: "easeInOut" as const,
    },
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1] as const, // Custom easing for smooth entrance
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -10,
    transition: {
      duration: 0.2,
      ease: "easeInOut" as const,
    },
  },
};

const contentVariants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.1,
      duration: 0.3,
      ease: "easeOut" as const,
    },
  },
};

// Helper to parse chunk content
const parseChunkContent = (content: string) => {
  const separator = ".________________________________________.";
  if (!content || !content.includes(separator)) {
    return { text: content, metadata: null };
  }

  const [text = "", metadataRaw] = content.split(separator);
  const metadata: { section?: string; path?: string } = {};

  if (metadataRaw) {
    const parts = metadataRaw.split("|");
    parts.forEach(part => {
      const trimmed = part.trim();
      if (trimmed.toLowerCase().startsWith("section:")) {
        metadata.section = trimmed.substring("section:".length).trim();
      } else if (trimmed.toLowerCase().startsWith("path:")) {
        metadata.path = trimmed.substring("path:".length).trim();
      }
    });
  }

  return { text: text.trim(), metadata };
};

export const SourcesList: React.FC<SourcesListProps> = ({
  sources,
  isMaximized = false,
  onMinimize,
  generateHref,
  LinkComponent,
  renderSourceIcon,
  renderViewMore,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedSourceId, setExpandedSourceId] = useState<string | null>(null);
  const [loadedContent, setLoadedContent] = useState<string>("");

  const { loadChunkContent, getChunkState } = useChunkLoader();

  // Handler for when "Ver más" is clicked
  const handleViewMore = () => {
    if (isMaximized && onMinimize) {
      onMinimize();
    }
  };

  console.log("[SourcesList] 📋 Rendered with sources:", sources?.length || 0);
  console.log("[SourcesList] 📋 Sources:", sources);

  if (!sources || sources.length === 0) {
    console.log("[SourcesList] ⚠️ No sources to display, returning null");
    return null;
  }

  console.log("[SourcesList] ✅ Displaying sources list");

  const handleSourceClick = async (sourceId: string) => {
    setExpandedSourceId(sourceId);
    setLoadedContent("");

    // Find the source
    const source = sources.find(s => s.id === sourceId);
    if (!source) return;

    // If content is already available, use it
    if (source.content) {
      setLoadedContent(source.content);
      return;
    }

    // Otherwise, load the content from the API
    console.log("[SourcesList] 🔄 Loading chunk content for:", sourceId);
    const content = await loadChunkContent(sourceId, source.type);
    setLoadedContent(content);
  };

  const handleCloseExpanded = () => {
    setExpandedSourceId(null);
    setLoadedContent("");
  };

  // If a source is expanded, show only that one
  if (expandedSourceId) {
    const expandedSource = sources.find(s => s.id === expandedSourceId);
    if (!expandedSource) return null;

    const chunkState = getChunkState(expandedSource.id, expandedSource.type);
    const displayContent = loadedContent || expandedSource.content;
    const { text: cleanContent, metadata } = parseChunkContent(displayContent);

    return (
      <div className="mt-3 pt-3 border-t border-gray-400">
        {/* Expanded source card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={expandedSourceId}
            variants={expandedCardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="border border-gray-300 rounded-lg p-4 bg-gray-50"
          >
            {/* Header with close button */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-2 flex-1">
                <div className="flex-shrink-0 w-5 h-5 text-gray-700 mt-0.5">
                  {renderSourceIcon ? (
                    renderSourceIcon(expandedSource.type)
                  ) : expandedSource.type === "book" ? (
                    <BookIcon className="w-full h-full" />
                  ) : (
                    <ArticleIcon className="w-full h-full" />
                  )}
                </div>
                <div>
                  <div className="text-gray-900 font-semibold text-sm">
                    {expandedSource.title}
                  </div>
                  <div className="text-gray-600 text-xs mt-1">
                    {expandedSource.type === "article" ? "Artículo" : "Libro"}
                    {expandedSource.chunkIndex !== undefined && (
                      <> • Parte {expandedSource.chunkIndex + 1}</>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={handleCloseExpanded}
                className="flex-shrink-0 text-gray-500 hover:text-gray-700 ml-2 transition-colors"
                aria-label="Cerrar"
              >
                <CloseXIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Content - rendered markdown */}
            <motion.div
              variants={contentVariants}
              initial="hidden"
              animate="visible"
            >
              {chunkState.isLoading ? (
                <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-500">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  Cargando contenido...
                </div>
              ) : chunkState.error ? (
                <div className="text-sm text-red-600 py-2">
                  Error: {chunkState.error}
                </div>
              ) : displayContent ? (
                <>
                  <div className="text-sm text-gray-800 leading-relaxed prose prose-sm prose-gray max-w-none">
                    <ReactMarkdown>{cleanContent}</ReactMarkdown>
                  </div>

                  {/* Metadata Pills */}
                  {metadata && (metadata.path || metadata.section) && (
                    <div className="mt-3 flex flex-wrap gap-2 mb-2">
                      {metadata.path ? (
                        metadata.path.split(">").map((segment, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-900 border border-primary-200"
                          >
                            {segment.trim()}
                          </span>
                        ))
                      ) : metadata.section ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-900 border border-primary-200">
                          {metadata.section}
                        </span>
                      ) : null}
                    </div>
                  )}

                  {/* Link to full document */}
                  {renderViewMore ? (
                    renderViewMore({
                      type: expandedSource.type,
                      slug: expandedSource.slug,
                      title: expandedSource.title,
                      onClick: handleViewMore,
                    })
                  ) : (
                    <ViewMoreLink
                      type={expandedSource.type}
                      slug={expandedSource.slug}
                      title={expandedSource.title}
                      onClick={handleViewMore}
                      generateHref={generateHref}
                      LinkComponent={LinkComponent}
                    />
                  )}
                </>
              ) : (
                <div className="text-sm text-gray-500 py-2">
                  No hay contenido disponible para este fragmento
                </div>
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // Show collapsed list
  return (
    <div className="mt-3 pt-3 border-t border-gray-400">
      {/* Header - clickable to expand/collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left flex items-center justify-between hover:opacity-75 transition-opacity group"
      >
        <div className="flex items-center gap-2">
          <ListIcon className="w-4 h-4 text-gray-700" />
          <p className="text-xs font-semibold text-gray-900">
            Fuentes consultadas ({sources.length})
          </p>
        </div>
        <ChevronDownIcon
          className={`w-4 h-4 text-gray-600 transition-transform ${
            isExpanded ? "rotate-0" : "-rotate-90"
          }`}
        />
      </button>

      {/* Sources list - shown when expanded */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="mt-2 space-y-2 overflow-hidden"
          >
            {sources.map((source, idx) => {
              return (
                <button
                  key={source.id || idx}
                  onClick={() => handleSourceClick(source.id)}
                  className="w-full text-left text-xs hover:bg-gray-100 rounded p-2 transition-colors border border-transparent hover:border-gray-300"
                >
                  <div className="flex items-start gap-2">
                    {/* Icon/Type badge */}
                    <div className="flex-shrink-0 w-4 h-4 text-gray-700 mt-0.5">
                      {renderSourceIcon ? (
                        renderSourceIcon(source.type)
                      ) : source.type === "book" ? (
                        <BookIcon className="w-full h-full" />
                      ) : (
                        <ArticleIcon className="w-full h-full" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Title */}
                      <div className="text-gray-900 font-medium truncate">
                        {source.title}
                      </div>

                      {/* Meta info */}
                      <div className="text-gray-600 mt-0.5 flex items-center gap-2 flex-wrap">
                        <span className="text-xs">
                          {source.type === "article" ? "Artículo" : "Libro"}
                        </span>
                        {source.chunkIndex !== undefined && (
                          <>
                            <span>•</span>
                            <span className="text-xs">
                              Parte {source.chunkIndex + 1}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Excerpt */}
                      {source.excerpt && (
                        <div className="text-gray-700 mt-1 text-xs line-clamp-2 italic prose prose-xs prose-gray max-w-none">
                          <ReactMarkdown>{`"${source.excerpt}"`}</ReactMarkdown>
                        </div>
                      )}
                    </div>

                    {/* Click hint */}
                    <span className="text-gray-600 flex-shrink-0 text-xs">
                      Ver más
                    </span>
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
