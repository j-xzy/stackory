interface HelloWorldProps {
	name?: string;
	className?: string;
}

export function HelloWorld({ name = 'World', className }: HelloWorldProps) {
	return (
		<div
			className={[
				'flex items-center justify-center rounded-lg border bg-card p-4 text-card-foreground',
				className,
			]
				.filter(Boolean)
				.join(' ')}
		>
			<p className='text-lg font-medium'>Hello, {name}!</p>
		</div>
	);
}
