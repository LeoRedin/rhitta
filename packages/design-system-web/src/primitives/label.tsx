import * as RadixLabel from "@radix-ui/react-label";
import type { ComponentPropsWithoutRef, Ref } from "react";

export type LabelProps = ComponentPropsWithoutRef<typeof RadixLabel.Root> & {
	ref?: Ref<HTMLLabelElement>;
};

export function Label({ className, ref, ...props }: LabelProps) {
	return (
		<RadixLabel.Root
			ref={ref}
			className={`text-sm font-medium leading-none text-text-body peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className ?? ""}`.trim()}
			{...props}
		/>
	);
}
