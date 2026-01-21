import React from 'react'

interface ListIconProps {
    className?: string
}

export const ListIcon: React.FC<ListIconProps> = ({ className = 'w-3 h-3' }) => {
    return (
        <svg
            className={className}
            fill="currentColor"
            viewBox="0 0 20 20"
        >
            <path
                clipRule="evenodd"
                d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                fillRule="evenodd"
            />
        </svg>
    )
}

export default ListIcon
