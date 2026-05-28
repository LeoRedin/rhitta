import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { Button } from "../primitives/button.js";

describe("Button", () => {
	it("renders without crashing with default variant", () => {
		render(<Button>Click me</Button>);
		const button = screen.getByRole("button", { name: "Click me" });
		expect(button).toBeDefined();
		expect(button.tagName).toBe("BUTTON");
	});

	it("applies variant classes", () => {
		render(<Button variant="danger">Delete</Button>);
		const button = screen.getByRole("button", { name: "Delete" });
		expect(button.className).toContain("bg-danger");
	});

	it("applies size classes", () => {
		render(<Button size="lg">Big</Button>);
		const button = screen.getByRole("button", { name: "Big" });
		expect(button.className).toContain("h-12");
	});

	it("respects disabled state", () => {
		render(<Button disabled>Disabled</Button>);
		const button = screen.getByRole("button", {
			name: "Disabled",
		}) as HTMLButtonElement;
		expect(button.disabled).toBe(true);
	});

	it("renders as child element when asChild is set", () => {
		render(
			<Button asChild>
				<a href="/foo">Link</a>
			</Button>,
		);
		const link = screen.getByRole("link", { name: "Link" });
		expect(link.tagName).toBe("A");
		expect(link.getAttribute("href")).toBe("/foo");
	});

	it("forwards ref to the button element", () => {
		const ref = createRef<HTMLButtonElement>();
		render(<Button ref={ref}>Ref</Button>);
		expect(ref.current).not.toBeNull();
		expect(ref.current?.tagName).toBe("BUTTON");
	});
});
