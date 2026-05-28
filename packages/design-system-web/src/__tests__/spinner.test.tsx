import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { Spinner } from "../primitives/spinner.js";

describe("Spinner", () => {
	it("renders without crashing", () => {
		render(<Spinner />);
		expect(screen.getByRole("status")).toBeDefined();
	});

	it("has accessible label", () => {
		render(<Spinner />);
		const spinner = screen.getByRole("status");
		expect(spinner.getAttribute("aria-label")).toBe("Loading");
		expect(spinner.getAttribute("aria-live")).toBe("polite");
	});

	it("applies size variant class", () => {
		render(<Spinner size="lg" />);
		const spinner = screen.getByRole("status");
		expect(spinner.className).toContain("h-8");
		expect(spinner.className).toContain("w-8");
	});

	it("applies default md size", () => {
		render(<Spinner />);
		const spinner = screen.getByRole("status");
		expect(spinner.className).toContain("h-6");
	});

	it("forwards ref", () => {
		const ref = createRef<HTMLDivElement>();
		render(<Spinner ref={ref} />);
		expect(ref.current?.tagName).toBe("DIV");
	});
});
