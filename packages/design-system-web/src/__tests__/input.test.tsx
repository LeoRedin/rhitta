import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { Input } from "../primitives/input.js";

describe("Input", () => {
	it("renders without crashing", () => {
		render(<Input placeholder="email" />);
		expect(screen.getByPlaceholderText("email")).toBeDefined();
	});

	it("sets aria-invalid when invalid", () => {
		render(<Input invalid placeholder="bad" />);
		const input = screen.getByPlaceholderText("bad");
		expect(input.getAttribute("aria-invalid")).toBe("true");
		expect(input.className).toContain("border-danger");
	});

	it("uses default border when not invalid", () => {
		render(<Input placeholder="good" />);
		const input = screen.getByPlaceholderText("good");
		expect(input.className).toContain("border-border-default");
	});

	it("respects disabled state", () => {
		render(<Input disabled placeholder="off" />);
		const input = screen.getByPlaceholderText("off") as HTMLInputElement;
		expect(input.disabled).toBe(true);
	});

	it("forwards ref", () => {
		const ref = createRef<HTMLInputElement>();
		render(<Input ref={ref} placeholder="ref" />);
		expect(ref.current?.tagName).toBe("INPUT");
	});
});
