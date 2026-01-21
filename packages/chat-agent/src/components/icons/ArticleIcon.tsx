import clsx from "clsx";

interface Props {
    className?: string;
}

export const ArticleIcon: React.FC<Props> = ({
    className
}) => {
    const iconClass = clsx(
        'stroke-current',
        className,
    );

    return (
        <svg
            viewBox="0 0 14 14"
            fill="none"
            className={iconClass}
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M13.5 4.5V11C13.5 11.3315 13.3683 11.6495 13.1339 11.8839C12.8995 12.1183 12.5815 12.25 12.25 12.25M12.25 12.25C11.9185 12.25 11.6005 12.1183 11.3661 11.8839C11.1317 11.6495 11 11.3315 11 11V2.25C11 2.11739 10.9473 1.99021 10.8536 1.89645C10.7598 1.80268 10.6326 1.75 10.5 1.75H1C0.867392 1.75 0.740215 1.80268 0.646447 1.89645C0.552678 1.99021 0.5 2.11739 0.5 2.25V11.25C0.5 11.5152 0.605357 11.7696 0.792893 11.9571C0.98043 12.1446 1.23478 12.25 1.5 12.25H12.25Z" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8.37524 3.79599H3.08984V5.79599H8.37524V3.79599Z" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3.08984 9.80188H8.37524" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3.08984 7.98853H8.37524" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};
