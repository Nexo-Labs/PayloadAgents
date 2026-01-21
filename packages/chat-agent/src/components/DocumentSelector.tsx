'use client'

import { ArticleIcon, BookIcon, ChevronDownIcon, SearchIcon } from './icons/index.js'
import { useCallback, useState } from 'react'
import {
  Document,
  useCombinedDocuments,
  useDocumentSearch,
  useDocumentSelection,
} from './useDocumentSelector.js'

interface DocumentSelectorProps {
  onSelectionChange?: (selectedDocuments: Document[]) => void
  isMaximized?: boolean
  isSidePanel?: boolean
}

const DocumentSelector = ({ onSelectionChange, isMaximized = false, isSidePanel = false }: DocumentSelectorProps) => {
  const [isExpanded, setIsExpanded] = useState(isSidePanel)

  // Use custom hooks for cleaner separation of concerns
  const { searchQuery, searchResults, isLoading, error, handleSearchChange: baseHandleSearchChange } = useDocumentSearch()
  const { selectedDocuments, toggleDocument, removeDocument, clearAllSelections } = useDocumentSelection(onSelectionChange)
  const allDocuments = useCombinedDocuments(selectedDocuments, searchResults)

  // Wrapper to handle auto-expand when searching
  const handleSearchChange = useCallback((query: string) => {
    baseHandleSearchChange(query)
    if (query.trim().length >= 2) {
      setIsExpanded(true)
    }
  }, [baseHandleSearchChange])

  // Get icon based on document type - memoized to prevent recreation
  const getDocumentIcon = useCallback((type: Document['type']) => {
    switch (type) {
      case 'book':
        return <BookIcon className="w-5 h-5" />
      case 'article':
        return <ArticleIcon className="w-5 h-5" />
      default:
        return <div className="w-3 h-3 bg-gray-400 rounded-full flex-shrink-0" />
    }
  }, [])

  if (isSidePanel) {
    // Side panel layout for desktop maximized mode
    return (
      <div className="h-full flex flex-col bg-white border-r border-gray-200">

        {/* Search Input */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar contenido..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>

        {/* Selected Count & Clear */}
        {selectedDocuments.length > 0 && (
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
            <span className="text-sm font-medium text-gray-700">
              {selectedDocuments.length} documento{selectedDocuments.length !== 1 ? 's' : ''} seleccionado{selectedDocuments.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={clearAllSelections}
              className="text-xs text-red-600 hover:text-red-800 transition-colors font-medium"
            >
              Limpiar todo
            </button>
          </div>
        )}

        {/* Document List */}
        <div className="flex-1 overflow-y-auto">
          {/* Loading State */}
          {isLoading && (
            <div className="p-4 text-center text-sm text-gray-500">
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                Buscando documentos...
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-4 text-center text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && searchQuery.length >= 2 && searchResults.length === 0 && (
            <div className="p-4 text-center text-sm text-gray-500">
              No se encontraron documentos para &quot;{searchQuery}&quot;
            </div>
          )}

          {/* No search yet */}
          {!isLoading && !error && searchQuery.length < 2 && selectedDocuments.length === 0 && (
            <div className="p-4 text-center text-sm text-gray-500">
              Busca libros o artículos para filtrar el chat
            </div>
          )}

          {/* Document Items */}
          {!isLoading && !error && allDocuments.length > 0 && (
            <div>
              {allDocuments.map((doc) => {
                const isSelected = selectedDocuments.some(d => d.id === doc.id)

                return (
                  <div
                    key={doc.id}
                    className={`flex items-center justify-between p-4 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''
                      }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getDocumentIcon(doc.type)}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 line-clamp-3" title={doc.title}>
                          {doc.title}
                        </div>
                        <div className="text-xs text-gray-500 capitalize mt-1">
                          {doc.type === 'book' ? 'Libro' : 'Artículo'}
                        </div>
                      </div>
                    </div>

                    {/* Add/Remove Button */}
                    <button
                      onClick={() => toggleDocument(doc)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${isSelected
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        }`}
                    >
                      {isSelected ? 'Quitar' : 'Agregar'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Original dropdown layout for non-maximized mode
  return (
    <div className="space-y-3">
      {/* Search Input with Toggle Button */}
      <div className="relative">
        <div className="relative flex">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar libros o artículos específicos..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          {/* Toggle Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 px-4 py-2.5 border-t border-r border-b border-gray-200 rounded-r-lg bg-gray-50 hover:bg-gray-100 transition-colors text-sm text-gray-700"
          >
            <span>{selectedDocuments.length > 0 ? `${selectedDocuments.length} filtro${selectedDocuments.length !== 1 ? 's' : ''}` : 'Filtros'}</span>
            <ChevronDownIcon
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* Expandable Document List */}
        {isExpanded && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden z-50">
            {/* Header with clear all option */}
            {selectedDocuments.length > 0 && (
              <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50">
                <span className="text-sm font-medium text-gray-700">
                  {selectedDocuments.length} documento{selectedDocuments.length !== 1 ? 's' : ''} seleccionado{selectedDocuments.length !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={clearAllSelections}
                  className="text-xs text-red-600 hover:text-red-800 transition-colors font-medium"
                >
                  Limpiar todo
                </button>
              </div>
            )}

            {/* Document List */}
            <div className="max-h-64 overflow-y-auto">
              {/* Loading State */}
              {isLoading && (
                <div className="p-4 text-center text-sm text-gray-500">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    Buscando documentos...
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="p-4 text-center text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Empty State */}
              {!isLoading && !error && searchQuery.length >= 2 && searchResults.length === 0 && (
                <div className="p-4 text-center text-sm text-gray-500">
                  No se encontraron documentos para &quot;{searchQuery}&quot;
                </div>
              )}

              {/* No search yet */}
              {!isLoading && !error && searchQuery.length < 2 && selectedDocuments.length === 0 && (
                <div className="p-4 text-center text-sm text-gray-500">
                  Busca libros o artículos para filtrar el chat
                </div>
              )}

              {/* Document Items */}
              {!isLoading && !error && allDocuments.length > 0 && (
                <div>
                  {allDocuments.map((doc) => {
                    const isSelected = selectedDocuments.some(d => d.id === doc.id)

                    return (
                      <div
                        key={doc.id}
                        className={`flex items-center justify-between p-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''
                          }`}
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          {getDocumentIcon(doc.type)}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 line-clamp-3" title={doc.title}>
                              {doc.title}
                            </div>
                            <div className="text-xs text-gray-500 capitalize">
                              {doc.type === 'book' ? 'Libro' : 'Artículo'}
                            </div>
                          </div>
                        </div>

                        {/* Add/Remove Button */}
                        <button
                          onClick={() => toggleDocument(doc)}
                          className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${isSelected
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}
                        >
                          {isSelected ? 'Quitar' : 'Agregar'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Backdrop to close dropdown */}
        {isExpanded && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsExpanded(false)}
          />
        )}
      </div>
    </div>
  )
}

export default DocumentSelector
