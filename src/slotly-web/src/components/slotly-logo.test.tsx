import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SlotlyLogo } from "./slotly-logo";

describe("SlotlyLogo", () => {
  it("renders full logo variants by default", () => {
    render(<SlotlyLogo />);
    const images = screen.getAllByRole("img", { name: "Slotly" });
    expect(images.length).toBe(2);
    expect(images[0]).toHaveAttribute("src", "/slotly-logo.png");
    expect(images[1]).toHaveAttribute("src", "/slotly-logo-white.png");
  });

  it("renders icon variant when specified", () => {
    render(<SlotlyLogo variant="icon" />);
    const images = screen.getAllByRole("img", { name: "Slotly" });
    expect(images.length).toBe(2);
    expect(images[0]).toHaveAttribute("src", "/slotly-icon.png");
    expect(images[1]).toHaveAttribute("src", "/slotly-icon-white.png");
  });

  it("renders single original logo when mode is original", () => {
    render(<SlotlyLogo mode="original" />);
    const image = screen.getByRole("img", { name: "Slotly" });
    expect(image).toHaveAttribute("src", "/slotly-logo.png");
  });
});
