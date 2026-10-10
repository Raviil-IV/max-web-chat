import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MessageComposer } from "./MessageComposer";

describe("MessageComposer emoji insertion", () => {
  it("inserts an emoji at the cursor position", async () => {
    render(<MessageComposer onSend={vi.fn()} />);
    const box = screen.getByPlaceholderText(/сообщение/i) as HTMLTextAreaElement;

    await userEvent.type(box, "Привет");
    box.setSelectionRange(3, 3);

    await userEvent.click(screen.getByRole("button", { name: "Эмодзи" }));
    await userEvent.click(screen.getByRole("button", { name: "😊" }));

    expect(box.value).toBe("При😊вет");
  });

  it("calls onSend with text containing the inserted emoji", async () => {
    const onSend = vi.fn();
    render(<MessageComposer onSend={onSend} />);
    const box = screen.getByPlaceholderText(/сообщение/i) as HTMLTextAreaElement;

    await userEvent.type(box, "ок");
    box.setSelectionRange(2, 2);

    await userEvent.click(screen.getByRole("button", { name: "Эмодзи" }));
    await userEvent.click(screen.getByRole("button", { name: "😊" }));
    await userEvent.click(screen.getByRole("button", { name: "Отправить" }));

    expect(onSend).toHaveBeenCalledWith("ок😊");
  });

  it("closes the picker on Escape", async () => {
    render(<MessageComposer onSend={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "Эмодзи" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the picker on outside click", async () => {
    render(<MessageComposer onSend={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "Эмодзи" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await userEvent.click(document.body);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
