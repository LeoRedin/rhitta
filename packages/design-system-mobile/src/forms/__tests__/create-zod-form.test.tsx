import { act, create } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";

vi.mock("react-native", async () => {
	const R = await import("react");
	function mk(name: string) {
		const C = R.forwardRef<unknown, Record<string, unknown>>((p, ref) =>
			R.createElement(name, { ...p, ref }),
		);
		C.displayName = name;
		return C;
	}
	return {
		View: mk("View"),
		Text: mk("Text"),
		TextInput: mk("TextInput"),
	};
});

import { z } from "zod";
import { createZodForm } from "../create-zod-form.js";
import { InputField, TextareaField } from "../fields.js";

const TestSchema = z.object({
	title: z.string().min(1, "Required"),
	body: z.string(),
});

describe("createZodForm", () => {
	it("returns a useZodForm hook function", () => {
		const useTestForm = createZodForm(TestSchema);
		expect(typeof useTestForm).toBe("function");
	});

	it("renders a form with InputField and TextareaField", () => {
		const useTestForm = createZodForm(TestSchema);

		function TestForm() {
			const form = useTestForm({
				defaultValues: { title: "", body: "" },
				onSubmit: async () => {},
			});

			return (
				<>
					<form.Field name="title">
						{(field) => <InputField field={field} label="Title" />}
					</form.Field>
					<form.Field name="body">
						{(field) => <TextareaField field={field} label="Body" />}
					</form.Field>
				</>
			);
		}

		let renderer!: ReturnType<typeof create>;
		act(() => {
			renderer = create(<TestForm />);
		});
		expect(renderer!.root).toBeTruthy();

		// Verify labels appear
		expect(renderer!.root.findByProps({ children: "Title" })).toBeTruthy();
		expect(renderer!.root.findByProps({ children: "Body" })).toBeTruthy();
	});
});
