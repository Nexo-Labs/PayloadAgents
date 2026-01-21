import clsx from "clsx";

interface Props {
    className?: string;
}

export const BookIcon: React.FC<Props> = ({
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
            <path d="M12.0767 13H3.30747C2.94025 13 2.58806 12.8541 2.32839 12.5944C2.06873 12.3348 1.92285 11.9827 1.92285 11.6154C1.92285 11.2482 2.06873 10.896 2.32839 10.6363C2.58806 10.3767 2.94025 10.2308 3.30747 10.2308H11.1536C11.3985 10.2308 11.6332 10.1335 11.8064 9.96042C11.9795 9.78729 12.0767 9.55253 12.0767 9.30771V1.92308C12.0767 1.67827 11.9795 1.44347 11.8064 1.27036C11.6332 1.09725 11.3985 1 11.1536 1H3.30747C2.94655 0.999872 2.59985 1.14067 2.34122 1.3924C2.08259 1.64414 1.93248 1.98691 1.92285 2.3477V11.5785" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M11.4404 10.4775L11.4404 13" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};
