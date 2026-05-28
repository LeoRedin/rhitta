import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { Textarea } from "../primitives/textarea.js";

describe("Textarea", () => {
	it("renders without crashing", () => {
		render(<Textarea placeholder="body" />);
		expect(screen.getByPlaceholderText("body")).toBeDefined();
	});

	it("sets aria-invalid when invalid", () => {
		render(<Textarea invalid placeholder="bad" />);
		const ta = screen.getByPlaceholderText("bad");
		expect(ta.getAttribute("aria-invalid")).toBe("true");
		expect(ta.className).toContain("border-danger");
	});

	it("respects disabled state", () => {
		render(<Textarea disabled placeholder="off" />);
		const ta = screen.getByPlaceholderText("off") as HTMLTextAreaElement;
		expect(ta.disabled).toBe(true);
	});

	it("forwards ref", () => {
		const ref = createRef<HTMLTextAreaElement>();
		render(<Textarea ref={ref} placeholder="ref" />);
		expect(ref.current?.tagName).toBe("TEXTAREA");
	});
});
