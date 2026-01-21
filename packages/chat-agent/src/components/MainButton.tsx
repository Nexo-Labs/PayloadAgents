import clsx from "clsx";
import { twMerge } from "tailwind-merge";
import { DefaultLink, LinkComponent } from "../types/components.js";

export interface Action {
    link?: {
        target?: string
        href: string
    }
    tabIndex?: number
    button?: {
        onClick?: () => Promise<void>
        type?:  "submit" | "reset" | "button";
    }
}


export interface ButtonProps extends React.HTMLAttributes<HTMLDivElement> {
    text: string;
    color?: 'primary' | 'secondary';
    type?: 'fill' | 'line';
    disabled?: boolean;
    className?: string;
    icon?: React.ReactNode;
    LinkComponent?: LinkComponent;
}
export type MainButtonActionProps = Action & ButtonProps

export const MainButtonAction: React.FC<MainButtonActionProps> = ({
    link,
    tabIndex,
    onClick,
    disabled,
    LinkComponent: Link = DefaultLink,
    ...rest
}) => {
    if (link) {
        return <Link
            href={link.href}
            target={link.target}
            onClick={rest.button?.onClick}
        >
            <MainButton {...rest} LinkComponent={Link} />
        </Link>
    }
    return <button
    type={rest.button?.type}
    tabIndex={tabIndex}
    onClick={rest.button?.onClick}
    disabled={disabled}
    >
        <MainButton {...rest} LinkComponent={Link} />
    </button>
}

export const MainButton: React.FC<ButtonProps> = ({
    text,
    color = 'primary',
    type = 'fill',
    className,
    icon,
    ...rest
}) => {
    const buttonClass = twMerge(
        clsx(
            'px-4 py-1.5 rounded flex justify-center items-center font-body text-sm inline-flex min-w-24 max-w-58 cursor-pointer transition duration-300 hover:-translate-y-1 motion-reduce:hover:transform-none',
            {
                // Fill
                'border border-primary-900 bg-primary-900 text-white hover:bg-black': type === 'fill' && color === 'primary',
                'border border-primary-300 bg-primary-300 text-white hover:bg-primary-400': type === 'fill' && color === 'secondary',
                // Line
                'border border-primary-900 text-primary-900': type === 'line' && color === 'primary',
                'border border-primary-300 text-primary-300': type === 'line' && color === 'secondary',
                // Icon
                'gap-1.5': icon,
            },
            className
        )
    );

    const iconClass = clsx(
        className,
        {
            'text-white': type === 'fill',
            'text-primary-900': type === 'line' && color === 'primary',
            'text-primary-300': type === 'line' && color === 'secondary',
        }
    );

    return (
        <div className={buttonClass} {...rest}>
            <div className='flex items-center gap-1.5'>
                {icon && <span className={iconClass}>{icon}</span>}
                {text}
            </div>
        </div>
    );
};
