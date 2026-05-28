import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createZodForm } from "../create-zod-form.js";
import { InputField, TextareaField } from "../fields.js";

const TestSchema = z.object({
	title: z.string().min(1).max(20),
	body: z.string().max(100),
});

type TestValues = z.input<typeof TestSchema>;
type TestOutput = z.infer<typeof TestSchema>;

function TestForm(props: {
	defaultValues?: TestValues;
	onSubmit: (value: TestOutput) => void | Promise<void>;
}) {
	const useTestForm = createZodForm(TestSchema);
	const form = useTestForm({
		defaultValues: props.defaultValues ?? { title: "", body: "" },
		onSubmit: async ({ value }) => {
			await props.onSubmit(value);
		},
	});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				void form.handleSubmit();
			}}
		>
			<form.Field name="title">
				{(field) => <InputField field={field} label="Title" />}
			</form.Field>
			<form.Field name="body">
				{(field) => <TextareaField field={field} label="Body" />}
			</form.Field>
			<button type="submit">Submit</button>
		</form>
	);
}

describe("createZodForm", () => {
	it("renders form with default values", () => {
		render(
			<TestForm
				defaultValues={{ title: "Hello", body: "World" }}
				onSubmit={() => {}}
			/>,
		);
		const titleInput = screen.getByLabelText("Title") as HTMLInputElement;
		const bodyTextarea = screen.getByLabelText("Body") as HTMLTextAreaElement;
		expect(titleInput.value).toBe("Hello");
		expect(bodyTextarea.value).toBe("World");
	});

	it("renders empty defaults when none provided", () => {
		render(<TestForm onSubmit={() => {}} />);
		const titleInput = screen.getByLabelText("Title") as HTMLInputElement;
		expect(titleInput.value).toBe("");
	});

	it("updates field value when user types", async () => {
		const user = userEvent.setup();
		render(<TestForm onSubmit={() => {}} />);
		const titleInput = screen.getByLabelText("Title") as HTMLInputElement;

		await user.type(titleInput, "Hi there");
		expect(titleInput.value).toBe("Hi there");
	});

	it("shows validation error after blur when value is invalid", async () => {
		const user = userEvent.setup();
		render(
			<TestForm
				defaultValues={{
					title: "this title is far too long for the schema",
					body: "",
				}}
				onSubmit={() => {}}
			/>,
		);
		const titleInput = screen.getByLabelText("Title") as HTMLInputElement;

		// Focus then tab away to mark touched + trigger blur-triggered validation render.
		await user.click(titleInput);
		// Type a character to trigger onChange validation against the schema.
		await user.type(titleInput, "x");
		await user.tab();

		const alert = await screen.findByRole("alert");
		expect(alert.textContent?.length ?? 0).toBeGreaterThan(0);
	});

	it("sets aria-invalid on the input when an error is shown", async () => {
		const user = userEvent.setup();
		render(
			<TestForm defaultValues={{ title: "", body: "" }} onSubmit={() => {}} />,
		);
		const titleInput = screen.getByLabelText("Title") as HTMLInputElement;

		// Empty title violates min(1). Touch the field to surface the error.
		await user.click(titleInput);
		await user.type(titleInput, "a");
		await user.clear(titleInput);
		await user.tab();

		const alert = await screen.findByRole("alert");
		expect(alert).toBeDefined();
		expect(titleInput.getAttribute("aria-invalid")).toBe("true");
	});

	it("does not show error before the field is touched", () => {
		render(
			<TestForm defaultValues={{ title: "", body: "" }} onSubmit={() => {}} />,
		);
		expect(screen.queryByRole("alert")).toBeNull();
	});

	it("calls onSubmit with parsed value when form is valid", async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn();
		render(
			<TestForm
				defaultValues={{ title: "Hello", body: "world" }}
				onSubmit={onSubmit}
			/>,
		);

		await act(async () => {
			await user.click(screen.getByRole("button", { name: "Submit" }));
		});

		expect(onSubmit).toHaveBeenCalledTimes(1);
		expect(onSubmit).toHaveBeenCalledWith({ title: "Hello", body: "world" });
	});

	it("does not call onSubmit when validation fails", async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn();
		render(
			<TestForm defaultValues={{ title: "", body: "" }} onSubmit={onSubmit} />,
		);

		await act(async () => {
			await user.click(screen.getByRole("button", { name: "Submit" }));
		});

		expect(onSubmit).not.toHaveBeenCalled();
	});
});
