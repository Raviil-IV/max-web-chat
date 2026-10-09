import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePolling } from "./usePolling";

const receive = vi.fn();
let connection: string = "online";

vi.mock("../store/ChatContext", () => ({
  useChat: () => ({
    state: { connection },
    receive,
  }),
}));

function Harness() {
  usePolling({ intervalMs: 1000 });
  return null;
}

describe("usePolling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    connection = "online";
    receive.mockReset();
    receive.mockResolvedValue(false);
  });
  afterEach(() => vi.useRealTimers());

  it("calls receive repeatedly while online", async () => {
    render(<Harness />);
    await vi.advanceTimersByTimeAsync(0);
    expect(receive).toHaveBeenCalled();
    const calls = receive.mock.calls.length;
    await vi.advanceTimersByTimeAsync(1000);
    expect(receive.mock.calls.length).toBeGreaterThan(calls);
  });

  it("does not poll while offline", async () => {
    connection = "idle";
    render(<Harness />);
    await vi.advanceTimersByTimeAsync(5000);
    expect(receive).not.toHaveBeenCalled();
  });

  it("keeps polling in error state with backoff", async () => {
    connection = "error";
    receive.mockRejectedValue(new Error("fail"));
    render(<Harness />);
    await vi.advanceTimersByTimeAsync(0);
    expect(receive).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(2000);
    expect(receive).toHaveBeenCalledTimes(2);
  });
});
