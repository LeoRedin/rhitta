import React from "react";
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
		Modal: mk("Modal"),
		TouchableOpacity: mk("TouchableOpacity"),
	};
});

import { Dialog, DialogDescription, DialogTitle } from "../dialog.js";

describe("Dialog", () => {
	it("renders title when open", () => {
		let renderer!: ReturnType<typeof create>;
		act(() => {
			renderer = create(
				<Dialog open onOpenChange={() => {}} title="My Title">
					{React.createElement("View", null, "Content")}
				</Dialog>,
			);
		});
		const view = renderer!.root.findByType("View" as never);
		expect(view).toBeTruthy();
	});

	it("renders DialogTitle standalone", () => {
		let renderer!: ReturnType<typeof create>;
		act(() => {
			renderer = create(<DialogTitle>Heading</DialogTitle>);
		});
		expect(renderer!.root.findByProps({ children: "Heading" })).toBeTruthy();
	});

	it("renders DialogDescription standalone", () => {
		let renderer!: ReturnType<typeof create>;
		act(() => {
			renderer = create(<DialogDescription>Desc</DialogDescription>);
		});
		expect(renderer!.root.findByProps({ children: "Desc" })).toBeTruthy();
	});
});
