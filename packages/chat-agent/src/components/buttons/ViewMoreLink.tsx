import { DefaultLink, LinkComponent } from '../../types/components.js'

interface ViewMoreLinkProps {
  type: 'article' | 'book'
  slug: string
  title: string
  onClick?: () => void
  generateHref: (props: {value: { id: number; slug?: string | null }, type: string}) => string
  LinkComponent?: LinkComponent
}

/**
 * Link component to navigate to the full document (article or book)
 * from a chunk preview in the chat
 */
export const ViewMoreLink: React.FC<ViewMoreLinkProps> = ({
  type,
  slug,
  title,
  onClick,
  generateHref,
  LinkComponent: Link = DefaultLink
}) => {
  const href = generateHref({
    type,
    value: { id: 0, slug }
  })

  return (
    <div className="mt-4 pt-3 border-t border-gray-300">
      <Link
        href={href}
        onClick={onClick}
        className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
        aria-label={`Ver ${type === 'article' ? 'artículo' : 'libro'} completo: ${title}`}
      >
        <span>Ver más</span>
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7l5 5m0 0l-5 5m5-5H6"
          />
        </svg>
      </Link>
    </div>
  )
}
