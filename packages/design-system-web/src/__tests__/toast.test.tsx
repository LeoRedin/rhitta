import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
	Toast,
	ToastDescription,
	ToastProvider,
	ToastTitle,
	ToastViewport,
} from "../primitives/toast.js";

describe("Toast", () => {
	it("renders nothing when no toasts are open", () => {
		const { container } = render(
			<ToastProvider>
				<ToastViewport />
			</ToastProvider>,
		);
		// Viewport is rendered as <ol>, but no toast rows yet.
		expect(container.querySelector('[role="region"]')).not.toBeNull();
	});

	it("renders an open toast with title and description", () => {
		render(
			<ToastProvider>
				<Toast open>
					<ToastTitle>Saved</ToastTitle>
					<ToastDescription>Your note was saved</ToastDescription>
				</Toast>
				<ToastViewport />
			</ToastProvider>,
		);
		expect(screen.getByText("Saved")).toBeDefined();
		expect(screen.getByText("Your note was saved")).toBeDefined();
	});

	it("applies semantic surface class on root", () => {
		render(
			<ToastProvider>
				<Toast open data-testid="toast">
					<ToastTitle>T</ToastTitle>
					<ToastDescription>D</ToastDescription>
				</Toast>
				<ToastViewport />
			</ToastProvider>,
		);
		const toast = screen.getByTestId("toast");
		expect(toast.className).toContain("bg-bg-surface");
	});

	it("renders title with body text color class", () => {
		render(
			<ToastProvider>
				<Toast open>
					<ToastTitle data-testid="t-title">Hi</ToastTitle>
					<ToastDescription>D</ToastDescription>
				</Toast>
				<ToastViewport />
			</ToastProvider>,
		);
		const title = screen.getByTestId("t-title");
		expect(title.className).toContain("text-text-body");
	});
});
