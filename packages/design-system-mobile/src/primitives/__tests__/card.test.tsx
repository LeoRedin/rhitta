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
	};
});

import { Card } from "../card.js";

describe("Card", () => {
	it("renders children", () => {
		let renderer!: ReturnType<typeof create>;
		act(() => {
			renderer = create(<Card>Body</Card>);
		});
		expect(renderer!.root.findByProps({ children: "Body" })).toBeTruthy();
	});

	it("accepts custom style override", () => {
		let renderer!: ReturnType<typeof create>;
		act(() => {
			renderer = create(<Card style={{ padding: 10 }}>Styled</Card>);
		});
		expect(renderer!.root.findByProps({ children: "Styled" })).toBeTruthy();
	});
});
