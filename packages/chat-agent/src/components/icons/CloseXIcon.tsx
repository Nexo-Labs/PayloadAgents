import clsx from "clsx";

interface Props {
      className?: string;
}

export const CloseXIcon: React.FC<Props> = ({
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
                  <g clipPath="url(#clip0_951_1690)">
                        <path d="M7 13C10.3138 13 13 10.3138 13 7C13 3.68629 10.3138 1 7 1C3.68629 1 1 3.68629 1 7C1 10.3138 3.68629 13 7 13Z" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M4.68137 4.64951L9.36664 9.33478M9.31809 4.66524L4.63281 9.35051" strokeWidth="0.8" strokeLinecap="round" />
                  </g>
                  <defs>
                        <clipPath id="clip0_951_1690">
                              <rect width="14" height="14" fill="currentColor" />
                        </clipPath>
                  </defs>
            </svg>
      );
};
