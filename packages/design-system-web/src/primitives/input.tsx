import type { ComponentPropsWithoutRef, Ref } from "react";
import { cva, type VariantProps } from "../variants/cva.js";

const inputVariants = cva(
	"flex w-full rounded-md border bg-bg-surface px-3 py-2 text-sm text-text-body ring-offset-bg-app file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
	{
		variants: {
			invalid: {
				true: "border-danger",
				false: "border-border-default",
			},
		},
		defaultVariants: {
			invalid: false,
		},
	},
);

export type InputProps = ComponentPropsWithoutRef<"input"> &
	VariantProps<typeof inputVariants> & {
		ref?: Ref<HTMLInputElement>;
	};

export function Input({ invalid, className, ref, ...props }: InputProps) {
	return (
		<input
			ref={ref}
			aria-invalid={invalid ?? undefined}
			className={`${inputVariants({ invalid })} ${className ?? ""}`.trim()}
			{...props}
		/>
	);
}
