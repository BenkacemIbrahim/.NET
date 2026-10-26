import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ThemeToggle } from "./theme-toggle";

const mockSetTheme = vi.fn();
let mockResolvedTheme = "light";

vi.mock("next-themes", () => ({
  useTheme: () => ({
    resolvedTheme: mockResolvedTheme,
    setTheme: mockSetTheme,
  }),
}));

describe("ThemeToggle", () => {
  it("toggles theme when clicked", async () => {
    mockResolvedTheme = "light";
    render(<ThemeToggle />);

    const button = screen.getByRole("button", { name: "Use dark theme" });
    expect(button).toBeInTheDocument();

    await userEvent.click(button);
    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });
});
