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

import { Textarea } from "../textarea.js";

describe("Textarea", () => {
	it("renders without crashing", () => {
		let renderer!: ReturnType<typeof create>;
		act(() => {
			renderer = create(<Textarea placeholder="body" />);
		});
		expect(renderer!.root).toBeTruthy();
	});

	it("renders label when provided", () => {
		let renderer!: ReturnType<typeof create>;
		act(() => {
			renderer = create(
				<Textarea label="Description" placeholder="enter text" />,
			);
		});
		expect(
			renderer!.root.findByProps({ children: "Description" }),
		).toBeTruthy();
	});

	it("shows error message when error is set", () => {
		let renderer!: ReturnType<typeof create>;
		act(() => {
			renderer = create(<Textarea error="Required" placeholder="field" />);
		});
		expect(renderer!.root.findByProps({ children: "Required" })).toBeTruthy();
	});

	it("renders with multiline prop", () => {
		let renderer!: ReturnType<typeof create>;
		act(() => {
			renderer = create(<Textarea placeholder="multi" />);
		});
		const input = renderer!.root.findByType("TextInput" as never);
		expect(input.props.multiline).toBe(true);
	});
});
