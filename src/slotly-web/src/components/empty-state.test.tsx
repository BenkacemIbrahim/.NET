import { CalendarDays } from "lucide-react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
  it("explains the empty state and exposes its next action", () => {
    render(
      <EmptyState
        icon={CalendarDays}
        title="No bookings"
        description="Share your booking page."
        action={<button>Copy link</button>}
      />,
    );
    expect(screen.getByRole("heading", { name: "No bookings" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy link" })).toBeVisible();
  });
});
