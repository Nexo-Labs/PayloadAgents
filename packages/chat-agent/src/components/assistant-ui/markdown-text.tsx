"use client"

import ReactMarkdown from "react-markdown"
import type { FC } from "react"

export interface MarkdownTextProps {
    text: string
}

export const MarkdownText: FC<MarkdownTextProps> = ({ text }) => {
    return (
        <div className="prose prose-sm prose-neutral max-w-none dark:prose-invert text-foreground leading-relaxed [&_*]:text-foreground/90 [&_strong]:text-foreground [&_b]:text-foreground [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_h4]:text-foreground [&_h5]:text-foreground [&_h6]:text-foreground [&_p]:text-foreground">
            <ReactMarkdown>{text}</ReactMarkdown>
        </div>
    )
}
