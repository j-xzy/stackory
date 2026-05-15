import ReactMarkdown, { type Components } from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

import { cn } from '@/lib/utils';

interface IMarkdownContentProps {
	children: string;
	className?: string;
}

const markdownComponents = {
	a: ({ children, ...props }) => (
		<a
			className='wrap-break-word font-medium text-primary underline underline-offset-3 hover:text-primary/80'
			rel='noreferrer'
			target='_blank'
			{...props}
		>
			{children}
		</a>
	),
	blockquote: ({ children, ...props }) => (
		<blockquote
			className='border-l-2 border-border pl-3 text-muted-foreground italic'
			{...props}
		>
			{children}
		</blockquote>
	),
	code: ({ children, className, ...props }) => (
		<code
			className={cn(
				'rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]',
				className,
			)}
			{...props}
		>
			{children}
		</code>
	),
	h1: ({ children, ...props }) => (
		<h1 className='text-xl font-semibold tracking-normal' {...props}>
			{children}
		</h1>
	),
	h2: ({ children, ...props }) => (
		<h2 className='text-lg font-semibold tracking-normal' {...props}>
			{children}
		</h2>
	),
	h3: ({ children, ...props }) => (
		<h3 className='text-base font-semibold tracking-normal' {...props}>
			{children}
		</h3>
	),
	hr: (props) => <hr className='border-border' {...props} />,
	li: ({ children, ...props }) => (
		<li className='pl-1' {...props}>
			{children}
		</li>
	),
	ol: ({ children, ...props }) => (
		<ol className='list-decimal space-y-1 pl-5' {...props}>
			{children}
		</ol>
	),
	p: ({ children, ...props }) => (
		<p className='leading-6' {...props}>
			{children}
		</p>
	),
	pre: ({ children, ...props }) => (
		<pre
			className='overflow-x-auto rounded-md border bg-muted p-3 text-xs'
			{...props}
		>
			{children}
		</pre>
	),
	table: ({ children, ...props }) => (
		<div className='overflow-x-auto rounded-md border'>
			<table className='w-full border-collapse text-sm' {...props}>
				{children}
			</table>
		</div>
	),
	td: ({ children, ...props }) => (
		<td className='border-t px-3 py-2 align-top' {...props}>
			{children}
		</td>
	),
	th: ({ children, ...props }) => (
		<th className='px-3 py-2 text-left font-medium' {...props}>
			{children}
		</th>
	),
	ul: ({ children, ...props }) => (
		<ul className='list-disc space-y-1 pl-5' {...props}>
			{children}
		</ul>
	),
} satisfies Components;

function MarkdownContent({ children, className }: IMarkdownContentProps) {
	return (
		<div className={cn('space-y-4', className)}>
			<ReactMarkdown
				components={markdownComponents}
				remarkPlugins={[remarkGfm, remarkBreaks]}
			>
				{children}
			</ReactMarkdown>
		</div>
	);
}

export { MarkdownContent };
