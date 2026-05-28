import type { ComponentPropsWithoutRef, Ref } from "react";
import { cva, type VariantProps } from "../variants/cva.js";

const textareaVariants = cva(
	"flex min-h-[80px] w-full rounded-md border bg-bg-surface px-3 py-2 text-sm text-text-body ring-offset-bg-app placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
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

export type TextareaProps = ComponentPropsWithoutRef<"textarea"> &
	VariantProps<typeof textareaVariants> & {
		ref?: Ref<HTMLTextAreaElement>;
	};

export function Textarea({ invalid, className, ref, ...props }: TextareaProps) {
	return (
		<textarea
			ref={ref}
			aria-invalid={invalid ?? undefined}
			className={`${textareaVariants({ invalid })} ${className ?? ""}`.trim()}
			{...props}
		/>
	);
}
