import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("is keyboard accessible and invokes its action", async () => {
    const action = vi.fn();
    render(<Button onClick={action}>Save appointment</Button>);
    await userEvent.tab();
    expect(screen.getByRole("button")).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(action).toHaveBeenCalledOnce();
  });

  it("does not invoke actions while disabled", async () => {
    const action = vi.fn();
    render(
      <Button disabled onClick={action}>
        Saving
      </Button>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(action).not.toHaveBeenCalled();
  });
});
