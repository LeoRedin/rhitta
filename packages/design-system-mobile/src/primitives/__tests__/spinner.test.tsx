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
		ActivityIndicator: mk("ActivityIndicator"),
	};
});

import { Spinner } from "../spinner.js";

describe("Spinner", () => {
	it("renders without crashing", () => {
		let renderer!: ReturnType<typeof create>;
		act(() => {
			renderer = create(<Spinner />);
		});
		expect(renderer!.root).toBeTruthy();
	});

	it("has accessible label", () => {
		let renderer!: ReturnType<typeof create>;
		act(() => {
			renderer = create(<Spinner />);
		});
		const view = renderer!.root.findByType("View" as never);
		expect(view.props["aria-label"]).toBe("Loading");
		expect(view.props["aria-live"]).toBe("polite");
	});

	it("renders with default md size", () => {
		let renderer!: ReturnType<typeof create>;
		act(() => {
			renderer = create(<Spinner />);
		});
		expect(renderer!.root).toBeTruthy();
	});

	it("renders with lg size", () => {
		let renderer!: ReturnType<typeof create>;
		act(() => {
			renderer = create(<Spinner size="lg" />);
		});
		expect(renderer!.root).toBeTruthy();
	});
});
