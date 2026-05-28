import * as RadixToast from "@radix-ui/react-toast";
import type { ComponentPropsWithoutRef, Ref } from "react";

export const ToastProvider = RadixToast.Provider;
export const ToastAction = RadixToast.Action;
export const ToastClose = RadixToast.Close;

export type ToastViewportProps = ComponentPropsWithoutRef<
	typeof RadixToast.Viewport
> & {
	ref?: Ref<HTMLOListElement>;
};

export function ToastViewport({
	className,
	ref,
	...props
}: ToastViewportProps) {
	return (
		<RadixToast.Viewport
			ref={ref}
			className={`fixed bottom-0 right-0 z-50 flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:max-w-md ${className ?? ""}`.trim()}
			{...props}
		/>
	);
}

export type ToastProps = ComponentPropsWithoutRef<typeof RadixToast.Root> & {
	ref?: Ref<HTMLLIElement>;
};

export function Toast({ className, ref, ...props }: ToastProps) {
	return (
		<RadixToast.Root
			ref={ref}
			className={`grid grid-cols-[auto_max-content] items-center gap-3 rounded-md border border-border-default bg-bg-surface p-4 shadow-lg ${className ?? ""}`.trim()}
			{...props}
		/>
	);
}

export type ToastTitleProps = ComponentPropsWithoutRef<
	typeof RadixToast.Title
> & {
	ref?: Ref<HTMLDivElement>;
};

export function ToastTitle({ className, ref, ...props }: ToastTitleProps) {
	return (
		<RadixToast.Title
			ref={ref}
			className={`text-sm font-semibold text-text-body ${className ?? ""}`.trim()}
			{...props}
		/>
	);
}

export type ToastDescriptionProps = ComponentPropsWithoutRef<
	typeof RadixToast.Description
> & {
	ref?: Ref<HTMLDivElement>;
};

export function ToastDescription({
	className,
	ref,
	...props
}: ToastDescriptionProps) {
	return (
		<RadixToast.Description
			ref={ref}
			className={`text-sm text-text-muted ${className ?? ""}`.trim()}
			{...props}
		/>
	);
}
