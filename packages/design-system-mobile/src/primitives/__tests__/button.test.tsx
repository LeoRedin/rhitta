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
		TouchableOpacity: mk("TouchableOpacity"),
		ActivityIndicator: mk("ActivityIndicator"),
	};
});

import { Button } from "../button.js";

describe("Button", () => {
	it("renders children", () => {
		let renderer!: ReturnType<typeof create>;
		act(() => {
			renderer = create(<Button onPress={() => {}}>Click me</Button>);
		});
		expect(renderer!.root.findByProps({ children: "Click me" })).toBeTruthy();
	});

	it("calls onPress when pressed", () => {
		let pressed = false;
		let renderer!: ReturnType<typeof create>;
		act(() => {
			renderer = create(
				<Button
					onPress={() => {
						pressed = true;
					}}
				>
					Press
				</Button>,
			);
		});
		const btn = renderer!.root.findByType("TouchableOpacity" as never);
		act(() => btn.props.onPress());
		expect(pressed).toBe(true);
	});

	it("renders with danger variant", () => {
		let renderer!: ReturnType<typeof create>;
		act(() => {
			renderer = create(
				<Button onPress={() => {}} variant="danger">
					Delete
				</Button>,
			);
		});
		expect(renderer!.root.findByProps({ children: "Delete" })).toBeTruthy();
	});

	it("renders with size lg", () => {
		let renderer!: ReturnType<typeof create>;
		act(() => {
			renderer = create(
				<Button onPress={() => {}} size="lg">
					Big
				</Button>,
			);
		});
		expect(renderer!.root.findByProps({ children: "Big" })).toBeTruthy();
	});

	it("disables press when disabled", () => {
		let renderer!: ReturnType<typeof create>;
		act(() => {
			renderer = create(
				<Button onPress={() => {}} disabled>
					Disabled
				</Button>,
			);
		});
		const btn = renderer!.root.findByType("TouchableOpacity" as never);
		expect(btn.props.disabled).toBe(true);
	});
});
