import { type StandardSchemaV1, useForm } from "@tanstack/react-form";
import type { z } from "zod";

/**
 * createZodForm: a typed TanStack Form factory bound to a Zod schema.
 *
 * Usage:
 *   const useNoteForm = createZodForm(CreateNoteSchema)
 *   function NewNotePage() {
 *     const form = useNoteForm({
 *       defaultValues: { title: '', body: '' },
 *       onSubmit: async ({ value }) => { await api.notes.create(value) }
 *     })
 *     return (<form onSubmit={form.handleSubmit}>...</form>)
 *   }
 *
 * Returns a `useForm`-shaped hook that:
 *   - Pre-binds the Zod schema as the `onChange` validator (TanStack Form
 *     consumes it via the Standard Schema v1 protocol that Zod 4 implements).
 *   - Infers `defaultValues` from `z.input<Schema>` and the submit payload
 *     from `z.infer<Schema>` (i.e. the parsed/output type).
 *
 * No separate adapter package is required for @tanstack/react-form 1.32.1:
 * the Zod schema is accepted natively wherever a `FormValidateOrFn` is
 * expected, because it satisfies the StandardSchemaV1 protocol.
 */
export function createZodForm<Schema extends z.ZodTypeAny>(schema: Schema) {
	type FormValues = z.input<Schema>;
	type FormOutput = z.infer<Schema>;

	return function useZodForm(options: {
		defaultValues: FormValues;
		onSubmit: (input: { value: FormOutput }) => void | Promise<void>;
	}) {
		// Zod 4 schemas implement the Standard Schema v1 protocol that TanStack
		// Form consumes natively. We narrow the type at the boundary so the
		// validator slot sees a `StandardSchemaV1<FormValues>` rather than the
		// generic `z.ZodTypeAny`, which TanStack cannot statically prove
		// validates `FormValues`.
		const validator = schema as unknown as StandardSchemaV1<
			FormValues,
			unknown
		>;
		return useForm({
			defaultValues: options.defaultValues,
			validators: {
				onChange: validator,
			},
			onSubmit: async ({ value }) => {
				const parsed = schema.parse(value) as FormOutput;
				await options.onSubmit({ value: parsed });
			},
		});
	};
}
