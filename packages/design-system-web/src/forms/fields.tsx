import type { AnyFieldApi } from "@tanstack/react-form";
import type { ReactNode } from "react";
import { Input, type InputProps } from "../primitives/input.js";
import { Label } from "../primitives/label.js";
import { Textarea, type TextareaProps } from "../primitives/textarea.js";

/**
 * Field-component wrappers around design-system primitives that consume
 * a TanStack Form `FieldApi`. Used at the call site as:
 *
 *   <form.Field name="title">
 *     {(field) => <InputField field={field} label="Title" />}
 *   </form.Field>
 *
 * We deliberately accept `AnyFieldApi` (TanStack Form's exported
 * "any-field" type) rather than threading the full 22-parameter generic
 * through every component — the field's data type is enforced by the
 * `form.Field` parent, and the wrapper only ever touches stringy
 * input/textarea values.
 */

type InputFieldProps = Omit<
	InputProps,
	"name" | "value" | "onChange" | "onBlur" | "invalid"
> & {
	field: AnyFieldApi;
	label: string;
	description?: ReactNode;
};

export function InputField({
	field,
	label,
	description,
	...inputProps
}: InputFieldProps) {
	const errors = field.state.meta.errors;
	const hasError = field.state.meta.isTouched && errors.length > 0;

	return (
		<div className="flex flex-col gap-1.5">
			<Label htmlFor={field.name}>{label}</Label>
			{description && <p className="text-sm text-text-muted">{description}</p>}
			<Input
				id={field.name}
				name={field.name}
				value={(field.state.value as string) ?? ""}
				onChange={(e) => field.handleChange(e.currentTarget.value)}
				onBlur={field.handleBlur}
				invalid={hasError}
				{...inputProps}
			/>
			{hasError && (
				<p className="text-sm text-text-danger" role="alert">
					{errors.map((err: unknown) => formatError(err)).join(", ")}
				</p>
			)}
		</div>
	);
}

type TextareaFieldProps = Omit<
	TextareaProps,
	"name" | "value" | "onChange" | "onBlur" | "invalid"
> & {
	field: AnyFieldApi;
	label: string;
	description?: ReactNode;
};

export function TextareaField({
	field,
	label,
	description,
	...textareaProps
}: TextareaFieldProps) {
	const errors = field.state.meta.errors;
	const hasError = field.state.meta.isTouched && errors.length > 0;

	return (
		<div className="flex flex-col gap-1.5">
			<Label htmlFor={field.name}>{label}</Label>
			{description && <p className="text-sm text-text-muted">{description}</p>}
			<Textarea
				id={field.name}
				name={field.name}
				value={(field.state.value as string) ?? ""}
				onChange={(e) => field.handleChange(e.currentTarget.value)}
				onBlur={field.handleBlur}
				invalid={hasError}
				{...textareaProps}
			/>
			{hasError && (
				<p className="text-sm text-text-danger" role="alert">
					{errors.map((err: unknown) => formatError(err)).join(", ")}
				</p>
			)}
		</div>
	);
}

function formatError(err: unknown): string {
	if (typeof err === "string") return err;
	if (
		err &&
		typeof err === "object" &&
		"message" in err &&
		typeof (err as { message: unknown }).message === "string"
	) {
		return (err as { message: string }).message;
	}
	return "Invalid";
}
