import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { Label } from "../primitives/label.js";

describe("Label", () => {
	it("renders without crashing", () => {
		render(<Label>Email</Label>);
		expect(screen.getByText("Email")).toBeDefined();
	});

	it("associates with form control via htmlFor", () => {
		render(
			<>
				<Label htmlFor="email-input">Email</Label>
				<input id="email-input" />
			</>,
		);
		const label = screen.getByText("Email");
		expect(label.getAttribute("for")).toBe("email-input");
	});

	it("applies semantic text token class", () => {
		render(<Label>Name</Label>);
		const label = screen.getByText("Name");
		expect(label.className).toContain("text-text-body");
	});

	it("forwards ref", () => {
		const ref = createRef<HTMLLabelElement>();
		render(<Label ref={ref}>Ref</Label>);
		expect(ref.current?.tagName).toBe("LABEL");
	});
});
