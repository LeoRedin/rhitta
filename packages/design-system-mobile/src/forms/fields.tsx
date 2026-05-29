import type { AnyFieldApi } from "@tanstack/react-form";
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { Input, type InputProps } from "../primitives/input.js";
import { Label } from "../primitives/label.js";
import { Textarea, type TextareaProps } from "../primitives/textarea.js";
import { FALLBACK_COLORS } from "../theme/themed.js";

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

type InputFieldProps = Omit<InputProps, "value" | "onChangeText" | "error"> & {
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
		<View style={{ gap: 6 }}>
			<Label htmlFor={field.name}>{label}</Label>
			{description && (
				<Text
					style={{
						fontSize: 12,
						color: FALLBACK_COLORS.text,
						opacity: 0.6,
					}}
				>
					{description}
				</Text>
			)}
			<Input
				value={(field.state.value as string) ?? ""}
				onChangeText={(text) => field.handleChange(text)}
				onBlur={() => field.handleBlur()}
				error={hasError ? formatErrors(errors) : undefined}
				{...inputProps}
			/>
		</View>
	);
}

type TextareaFieldProps = Omit<
	TextareaProps,
	"value" | "onChangeText" | "error"
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
		<View style={{ gap: 6 }}>
			<Label htmlFor={field.name}>{label}</Label>
			{description && (
				<Text
					style={{
						fontSize: 12,
						color: FALLBACK_COLORS.text,
						opacity: 0.6,
					}}
				>
					{description}
				</Text>
			)}
			<Textarea
				value={(field.state.value as string) ?? ""}
				onChangeText={(text) => field.handleChange(text)}
				onBlur={() => field.handleBlur()}
				error={hasError ? formatErrors(errors) : undefined}
				{...textareaProps}
			/>
		</View>
	);
}

function formatErrors(errors: unknown[]): string {
	return errors.map(formatError).join(", ");
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
