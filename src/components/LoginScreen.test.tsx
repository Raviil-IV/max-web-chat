import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginScreen } from "./LoginScreen";

const login = vi.fn();

vi.mock("../store/ChatContext", () => ({
  useChat: () => ({ login }),
}));

describe("LoginScreen", () => {
  beforeEach(() => login.mockReset());

  it("does not submit when fields are empty", async () => {
    render(<LoginScreen />);
    await userEvent.click(screen.getByRole("button", { name: /Войти/i }));
    expect(login).not.toHaveBeenCalled();
  });

  it("calls login with entered credentials", async () => {
    login.mockResolvedValueOnce(undefined);
    render(<LoginScreen />);
    await userEvent.type(screen.getByLabelText(/idInstance/i), "1101000");
    await userEvent.type(screen.getByLabelText(/apiTokenInstance/i), "token");
    await userEvent.click(screen.getByRole("button", { name: /Войти/i }));
    await waitFor(() =>
      expect(login).toHaveBeenCalledWith({ idInstance: "1101000", apiTokenInstance: "token" })
    );
  });

  it("shows an error when login fails", async () => {
    login.mockRejectedValueOnce(new Error("Неверные данные"));
    render(<LoginScreen />);
    await userEvent.type(screen.getByLabelText(/idInstance/i), "1");
    await userEvent.type(screen.getByLabelText(/apiTokenInstance/i), "t");
    await userEvent.click(screen.getByRole("button", { name: /Войти/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Неверные данные");
  });

  it("disables the button while the request is in flight", async () => {
    let resolve!: () => void;
    login.mockReturnValueOnce(
      new Promise<void>((r) => {
        resolve = r;
      })
    );
    render(<LoginScreen />);
    await userEvent.type(screen.getByLabelText(/idInstance/i), "1");
    await userEvent.type(screen.getByLabelText(/apiTokenInstance/i), "t");
    await userEvent.click(screen.getByRole("button", { name: /Войти/i }));
    const btn = screen.getByRole("button", { name: /Подключение/i });
    expect(btn).toBeDisabled();
    resolve();
    await waitFor(() => expect(screen.getByRole("button", { name: /Войти/i })).toBeEnabled());
  });

  it("calls onSuccess after a successful login", async () => {
    login.mockResolvedValueOnce(undefined);
    const onSuccess = vi.fn();
    render(<LoginScreen onSuccess={onSuccess} />);
    await userEvent.type(screen.getByLabelText(/idInstance/i), "1");
    await userEvent.type(screen.getByLabelText(/apiTokenInstance/i), "t");
    await userEvent.click(screen.getByRole("button", { name: /Войти/i }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  });
});
