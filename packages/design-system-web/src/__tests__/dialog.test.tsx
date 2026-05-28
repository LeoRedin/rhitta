import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
	DialogTrigger,
} from "../primitives/dialog.js";

describe("Dialog", () => {
	it("renders trigger without opening content", () => {
		render(
			<Dialog>
				<DialogTrigger>Open</DialogTrigger>
				<DialogContent>
					<DialogTitle>Title</DialogTitle>
					<DialogDescription>Description</DialogDescription>
				</DialogContent>
			</Dialog>,
		);
		expect(screen.getByText("Open")).toBeDefined();
		expect(screen.queryByText("Title")).toBeNull();
	});

	it("opens content when defaultOpen is set", () => {
		render(
			<Dialog defaultOpen>
				<DialogTrigger>Open</DialogTrigger>
				<DialogContent>
					<DialogTitle>Hi</DialogTitle>
					<DialogDescription>Body</DialogDescription>
				</DialogContent>
			</Dialog>,
		);
		expect(screen.getByText("Hi")).toBeDefined();
		expect(screen.getByText("Body")).toBeDefined();
	});

	it("renders title with role heading", () => {
		render(
			<Dialog defaultOpen>
				<DialogContent>
					<DialogTitle>Heading</DialogTitle>
					<DialogDescription>Body</DialogDescription>
				</DialogContent>
			</Dialog>,
		);
		expect(screen.getByRole("heading", { name: "Heading" })).toBeDefined();
	});

	it("renders content with dialog role", () => {
		render(
			<Dialog defaultOpen>
				<DialogContent>
					<DialogTitle>T</DialogTitle>
					<DialogDescription>D</DialogDescription>
				</DialogContent>
			</Dialog>,
		);
		expect(screen.getByRole("dialog")).toBeDefined();
	});
});
