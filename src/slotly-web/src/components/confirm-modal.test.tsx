import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfirmModal } from "./confirm-modal";

describe("ConfirmModal", () => {
  it("renders modal when open is true and calls onConfirm when confirmed", async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <ConfirmModal
        open={true}
        title="Deactivate Service"
        description="Are you sure you want to deactivate this service?"
        confirmText="Deactivate"
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    );

    expect(screen.getByRole("heading", { name: "Deactivate Service" })).toBeInTheDocument();
    expect(screen.getByText("Are you sure you want to deactivate this service?")).toBeInTheDocument();

    const confirmBtn = screen.getByRole("button", { name: "Deactivate" });
    await userEvent.click(confirmBtn);

    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("calls onClose when cancel button is clicked", async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <ConfirmModal
        open={true}
        title="Delete Staff"
        description="Are you sure?"
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    );

    const cancelBtn = screen.getByRole("button", { name: "Cancel" });
    await userEvent.click(cancelBtn);

    expect(onClose).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
