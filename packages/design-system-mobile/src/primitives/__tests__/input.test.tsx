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

import { Input } from "../input.js";

describe("Input", () => {
	it("renders without crashing", () => {
		let renderer!: ReturnType<typeof create>;
		act(() => {
			renderer = create(<Input placeholder="email" />);
		});
		expect(renderer!.root).toBeTruthy();
	});

	it("renders label when provided", () => {
		let renderer!: ReturnType<typeof create>;
		act(() => {
			renderer = create(<Input label="Email" placeholder="enter email" />);
		});
		expect(renderer!.root.findByProps({ children: "Email" })).toBeTruthy();
	});

	it("shows error message when error is set", () => {
		let renderer!: ReturnType<typeof create>;
		act(() => {
			renderer = create(<Input error="Required" placeholder="field" />);
		});
		expect(renderer!.root.findByProps({ children: "Required" })).toBeTruthy();
	});

	it("calls onChangeText when text changes", () => {
		let value = "";
		let renderer!: ReturnType<typeof create>;
		act(() => {
			renderer = create(
				<Input
					placeholder="type here"
					onChangeText={(text: string) => {
						value = text;
					}}
				/>,
			);
		});
		const input = renderer!.root.findByType("TextInput" as never);
		input.props.onChangeText("hello");
		expect(value).toBe("hello");
	});
});
