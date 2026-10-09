import { beforeEach, describe, expect, it } from "vitest";
import { initialState } from "./reducer";
import { clearState, loadState, saveState } from "./storage";

describe("storage", () => {
  beforeEach(() => localStorage.clear());

  it("returns null when nothing is stored", () => {
    expect(loadState()).toBeNull();
  });

  it("saves and loads state without persisting connection status", () => {
    saveState({ ...initialState, connection: "online", activeChatId: "c1" });
    const loaded = loadState();
    expect(loaded?.activeChatId).toBe("c1");
    expect(loaded?.connection).toBe("idle");
  });

  it("returns null on corrupted data", () => {
    localStorage.setItem("max-web-chat:state", "{not json");
    expect(loadState()).toBeNull();
  });

  it("returns null on invalid shape", () => {
    localStorage.setItem("max-web-chat:state", JSON.stringify({ chats: 5 }));
    expect(loadState()).toBeNull();
  });

  it("clears state", () => {
    saveState(initialState);
    clearState();
    expect(loadState()).toBeNull();
  });
});
