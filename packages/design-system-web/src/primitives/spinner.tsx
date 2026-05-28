import type { ComponentPropsWithoutRef, Ref } from "react";
import { cva, type VariantProps } from "../variants/cva.js";

const spinnerVariants = cva(
	"inline-block animate-spin rounded-full border-2 border-border-default border-t-brand-primary",
	{
		variants: {
			size: {
				sm: "h-4 w-4",
				md: "h-6 w-6",
				lg: "h-8 w-8",
			},
		},
		defaultVariants: {
			size: "md",
		},
	},
);

export type SpinnerProps = ComponentPropsWithoutRef<"div"> &
	VariantProps<typeof spinnerVariants> & {
		ref?: Ref<HTMLDivElement>;
	};

export function Spinner({ size, className, ref, ...props }: SpinnerProps) {
	return (
		<div
			ref={ref}
			role="status"
			aria-live="polite"
			aria-label="Loading"
			className={`${spinnerVariants({ size })} ${className ?? ""}`.trim()}
			{...props}
		/>
	);
}
