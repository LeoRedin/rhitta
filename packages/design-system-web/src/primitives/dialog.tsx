import * as RadixDialog from "@radix-ui/react-dialog";
import type { ComponentPropsWithoutRef, Ref } from "react";

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;
export const DialogPortal = RadixDialog.Portal;
export const DialogClose = RadixDialog.Close;

export type DialogOverlayProps = ComponentPropsWithoutRef<
	typeof RadixDialog.Overlay
> & {
	ref?: Ref<HTMLDivElement>;
};

export function DialogOverlay({
	className,
	ref,
	...props
}: DialogOverlayProps) {
	return (
		<RadixDialog.Overlay
			ref={ref}
			className={`fixed inset-0 z-50 bg-bg-inverse/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 ${className ?? ""}`.trim()}
			{...props}
		/>
	);
}

export type DialogContentProps = ComponentPropsWithoutRef<
	typeof RadixDialog.Content
> & {
	ref?: Ref<HTMLDivElement>;
};

export function DialogContent({
	className,
	children,
	ref,
	...props
}: DialogContentProps) {
	return (
		<DialogPortal>
			<DialogOverlay />
			<RadixDialog.Content
				ref={ref}
				className={`fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border border-border-default bg-bg-surface p-6 shadow-lg ${className ?? ""}`.trim()}
				{...props}
			>
				{children}
			</RadixDialog.Content>
		</DialogPortal>
	);
}

export type DialogTitleProps = ComponentPropsWithoutRef<
	typeof RadixDialog.Title
> & {
	ref?: Ref<HTMLHeadingElement>;
};

export function DialogTitle({ className, ref, ...props }: DialogTitleProps) {
	return (
		<RadixDialog.Title
			ref={ref}
			className={`text-lg font-semibold text-text-body ${className ?? ""}`.trim()}
			{...props}
		/>
	);
}

export type DialogDescriptionProps = ComponentPropsWithoutRef<
	typeof RadixDialog.Description
> & {
	ref?: Ref<HTMLParagraphElement>;
};

export function DialogDescription({
	className,
	ref,
	...props
}: DialogDescriptionProps) {
	return (
		<RadixDialog.Description
			ref={ref}
			className={`text-sm text-text-muted ${className ?? ""}`.trim()}
			{...props}
		/>
	);
}
