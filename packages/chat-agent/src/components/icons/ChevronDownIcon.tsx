import clsx from "clsx";

interface Props {
    className?: string;
}

export const ChevronDownIcon: React.FC<Props> = ({
    className = '',
}) => {
    const iconClass = clsx(
        className,
        "ml-1 h-4 w-4 text-gray-700"
    );

    return (
        <svg
            className={iconClass}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
    );
};
