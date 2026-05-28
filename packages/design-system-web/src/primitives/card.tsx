import type { ComponentPropsWithoutRef, Ref } from "react";

export type CardProps = ComponentPropsWithoutRef<"section"> & {
	ref?: Ref<HTMLElement>;
};

export function Card({ className, ref, ...props }: CardProps) {
	return (
		<section
			ref={ref}
			className={`rounded-lg border border-border-default bg-bg-surface p-6 shadow-sm ${className ?? ""}`.trim()}
			{...props}
		/>
	);
}
