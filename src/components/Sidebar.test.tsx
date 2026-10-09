import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Sidebar } from "./Sidebar";

const addChat = vi.fn();
const selectChat = vi.fn();

vi.mock("../store/ChatContext", () => ({
  useChat: () => ({
    addChat,
    selectChat,
    state: {
      connection: "online",
      activeChatId: "c1",
      unread: { c1: 0 },
      chats: [
        { id: "c1", name: "+7 999 111-22-33", phone: "79991112233", lastActivity: 2 },
        { id: "c2", name: "+7 900 000-00-00", phone: "79000000000", lastActivity: 1 },
      ],
    },
  }),
}));

describe("Sidebar", () => {
  it("renders chats and highlights the active one", () => {
    render(<Sidebar />);
    expect(screen.getByText("+7 999 111-22-33")).toBeInTheDocument();
    expect(screen.getByText("+7 900 000-00-00")).toBeInTheDocument();
  });

  it("creates a chat from a phone number", async () => {
    addChat.mockResolvedValueOnce(undefined);
    render(<Sidebar />);
    await userEvent.type(screen.getByPlaceholderText(/номер/i), "79991112233");
    await userEvent.click(screen.getByRole("button", { name: /Создать/i }));
    await waitFor(() => expect(addChat).toHaveBeenCalledWith("79991112233"));
  });

  it("selects a chat on click", async () => {
    render(<Sidebar />);
    await userEvent.click(screen.getByText("+7 900 000-00-00"));
    expect(selectChat).toHaveBeenCalledWith("c2");
  });
});
