import { Slot } from "@radix-ui/react-slot";
import type { ComponentPropsWithoutRef, ReactNode, Ref } from "react";
import { cva, type VariantProps } from "../variants/cva.js";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus disabled:pointer-events-none disabled:opacity-50",
	{
		variants: {
			variant: {
				solid: "bg-brand-primary text-text-inverse hover:opacity-90",
				outline:
					"border border-border-default bg-bg-surface text-text-body hover:bg-bg-surface-raised",
				ghost: "bg-transparent text-text-body hover:bg-bg-surface-raised",
				danger: "bg-danger text-text-inverse hover:opacity-90",
			},
			size: {
				sm: "h-8 px-3 text-sm",
				md: "h-10 px-4 text-base",
				lg: "h-12 px-6 text-lg",
			},
		},
		defaultVariants: {
			variant: "solid",
			size: "md",
		},
	},
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;

export type ButtonProps = Omit<ComponentPropsWithoutRef<"button">, "color"> &
	ButtonVariants & {
		asChild?: boolean;
		children?: ReactNode;
		ref?: Ref<HTMLButtonElement>;
	};

export function Button({
	asChild = false,
	variant,
	size,
	className,
	ref,
	...props
}: ButtonProps) {
	const Comp = asChild ? Slot : "button";
	return (
		<Comp
			ref={ref}
			className={`${buttonVariants({ variant, size })} ${className ?? ""}`.trim()}
			{...props}
		/>
	);
}
