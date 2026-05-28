import { act, create } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";

vi.mock("react-native", async () => {
	const R = await import("react");

	class MockValue {
		_value: number;
		constructor(val: number) {
			this._value = val;
		}
		setValue() {}
		interpolate() {
			return { _value: 0 };
		}
	}

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
		Animated: {
			View: mk("Animated.View"),
			sequence: () => ({
				start: (cb?: () => void) => cb?.(),
			}),
			timing: () => ({
				start: (cb?: () => void) => cb?.(),
			}),
			delay: () => ({
				start: (cb?: () => void) => cb?.(),
			}),
			Value: MockValue,
		},
	};
});

import { Toast, ToastHost } from "../toast.js";

describe("Toast", () => {
	it("renders title", () => {
		let renderer!: ReturnType<typeof create>;
		act(() => {
			renderer = create(<Toast title="Saved" onDismiss={() => {}} />);
		});
		expect(renderer!.root.findByProps({ children: "Saved" })).toBeTruthy();
	});

	it("renders description when provided", () => {
		let renderer!: ReturnType<typeof create>;
		act(() => {
			renderer = create(
				<Toast
					title="Saved"
					description="Your note was saved"
					onDismiss={() => {}}
				/>,
			);
		});
		expect(renderer!.root.findByProps({ children: "Saved" })).toBeTruthy();
		expect(
			renderer!.root.findByProps({ children: "Your note was saved" }),
		).toBeTruthy();
	});

	it("renders with duration prop", () => {
		let renderer!: ReturnType<typeof create>;
		act(() => {
			renderer = create(
				<Toast title="T" duration={100} onDismiss={() => {}} />,
			);
		});
		expect(renderer!.root.findByProps({ children: "T" })).toBeTruthy();
	});
});

describe("ToastHost", () => {
	it("renders multiple toasts", () => {
		let renderer!: ReturnType<typeof create>;
		act(() => {
			renderer = create(
				<ToastHost
					toasts={[
						{ id: "1", title: "Toast 1" },
						{ id: "2", title: "Toast 2", variant: "error" as const },
					]}
					onDismiss={() => {}}
				/>,
			);
		});
		expect(renderer!.root.findByProps({ children: "Toast 1" })).toBeTruthy();
		expect(renderer!.root.findByProps({ children: "Toast 2" })).toBeTruthy();
	});
});
