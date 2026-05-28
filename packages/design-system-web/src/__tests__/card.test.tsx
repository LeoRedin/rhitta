import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { Card } from "../primitives/card.js";

describe("Card", () => {
	it("renders as a section element", () => {
		render(<Card data-testid="card">Body</Card>);
		const card = screen.getByTestId("card");
		expect(card.tagName).toBe("SECTION");
	});

	it("renders children", () => {
		render(
			<Card>
				<span>inside</span>
			</Card>,
		);
		expect(screen.getByText("inside")).toBeDefined();
	});

	it("applies semantic surface class", () => {
		render(<Card data-testid="card">Body</Card>);
		const card = screen.getByTestId("card");
		expect(card.className).toContain("bg-bg-surface");
		expect(card.className).toContain("border-border-default");
	});

	it("merges custom className", () => {
		render(
			<Card className="my-custom" data-testid="card">
				Body
			</Card>,
		);
		const card = screen.getByTestId("card");
		expect(card.className).toContain("my-custom");
	});

	it("forwards ref", () => {
		const ref = createRef<HTMLElement>();
		render(<Card ref={ref}>Ref</Card>);
		expect(ref.current?.tagName).toBe("SECTION");
	});
});
