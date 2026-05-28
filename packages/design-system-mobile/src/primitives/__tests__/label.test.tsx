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
		Text: mk("Text"),
	};
});

import { Label } from "../label.js";

describe("Label", () => {
	it("renders without crashing", () => {
		let renderer!: ReturnType<typeof create>;
		act(() => {
			renderer = create(<Label>Email</Label>);
		});
		expect(renderer!.root.findByProps({ children: "Email" })).toBeTruthy();
	});

	it("passes htmlFor as accessibilityLabel to native Text", () => {
		let renderer!: ReturnType<typeof create>;
		act(() => {
			renderer = create(<Label htmlFor="email-input">Email</Label>);
		});
		// Find the Text element and check its props
		const inner = renderer!.root.findByType("Text" as never);
		expect(inner.props.accessibilityLabel).toBe("email-input");
	});
});
