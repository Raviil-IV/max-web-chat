import { describe, expect, it } from "vitest";
import { initialState, reducer } from "./reducer";
import type { Message } from "./types";

const msg = (over: Partial<Message>): Message => ({
  id: "m1",
  chatId: "c1",
  text: "hi",
  timestamp: 1,
  direction: "in",
  ...over,
});

describe("reducer", () => {
  it("adds a chat and selects it", () => {
    const state = reducer(initialState, {
      type: "ADD_CHAT",
      chat: { id: "c1", name: "Иван", phone: "7999", lastActivity: 1 },
    });
    expect(state.chats).toHaveLength(1);
    expect(state.activeChatId).toBe("c1");
  });

  it("selects an existing chat without duplicating it", () => {
    const withChat = reducer(initialState, {
      type: "ADD_CHAT",
      chat: { id: "c1", name: "Иван", phone: "7999", lastActivity: 1 },
    });
    const state = reducer({ ...withChat, activeChatId: null }, {
      type: "ADD_CHAT",
      chat: { id: "c1", name: "Иван", phone: "7999", lastActivity: 2 },
    });
    expect(state.chats).toHaveLength(1);
    expect(state.activeChatId).toBe("c1");
  });

  it("adds a message", () => {
    const state = reducer(
      { ...initialState, activeChatId: "c1" },
      { type: "ADD_MESSAGE", message: msg({}) }
    );
    expect(state.messagesByChat["c1"]).toHaveLength(1);
  });

  it("deduplicates messages by id", () => {
    const withOne = reducer(
      { ...initialState, activeChatId: "c1" },
      { type: "ADD_MESSAGE", message: msg({}) }
    );
    const withTwo = reducer(withOne, {
      type: "ADD_MESSAGE",
      message: msg({ text: "updated", status: "sent" }),
    });
    expect(withTwo.messagesByChat["c1"]).toHaveLength(1);
    expect(withTwo.messagesByChat["c1"][0].text).toBe("updated");
    expect(withTwo.messagesByChat["c1"][0].status).toBe("sent");
  });

  it("does not double-count unread for a redelivered message", () => {
    const withUnread = reducer(
      { ...initialState, activeChatId: "other" },
      { type: "ADD_MESSAGE", message: msg({ chatId: "c1", direction: "in" }) }
    );
    expect(withUnread.unread["c1"]).toBe(1);
    const redelivered = reducer(withUnread, {
      type: "ADD_MESSAGE",
      message: msg({ chatId: "c1", direction: "in", text: "updated" }),
    });
    expect(redelivered.unread["c1"]).toBe(1);
  });

  it("does not increment unread for incoming messages in the active chat", () => {
    const state = reducer(
      { ...initialState, activeChatId: "c1" },
      { type: "ADD_MESSAGE", message: msg({ chatId: "c1", direction: "in" }) }
    );
    expect(state.unread["c1"]).toBeUndefined();
  });

  it("increments unread for inactive chats and marks active chat read", () => {
    const state = reducer(
      { ...initialState, activeChatId: "other" },
      { type: "ADD_MESSAGE", message: msg({ chatId: "c1", direction: "in" }) }
    );
    expect(state.unread["c1"]).toBe(1);
  });

  it("does not count own outgoing messages as unread", () => {
    const state = reducer(
      { ...initialState, activeChatId: "other" },
      { type: "ADD_MESSAGE", message: msg({ chatId: "c1", direction: "out" }) }
    );
    expect(state.unread["c1"]).toBeUndefined();
  });

  it("updates a message status", () => {
    const withMsg = reducer(
      { ...initialState, activeChatId: "c1" },
      { type: "ADD_MESSAGE", message: msg({ direction: "out", status: "sending" }) }
    );
    const updated = reducer(withMsg, {
      type: "UPDATE_MESSAGE_STATUS",
      chatId: "c1",
      id: "m1",
      status: "sent",
    });
    expect(updated.messagesByChat["c1"][0].status).toBe("sent");
  });

  it("marks a chat read when selected", () => {
    const withUnread = {
      ...initialState,
      unread: { c1: 3 },
      chats: [{ id: "c1", name: "x", phone: "1", lastActivity: 1 }],
    };
    const state = reducer(withUnread, { type: "SELECT_CHAT", chatId: "c1" });
    expect(state.unread["c1"]).toBe(0);
    expect(state.activeChatId).toBe("c1");
  });

  it("logs out and clears state", () => {
    const state = reducer(
      { ...initialState, credentials: { idInstance: "1", apiTokenInstance: "t" } },
      { type: "LOGOUT" }
    );
    expect(state).toEqual(initialState);
  });

  it("hydrates from persisted state", () => {
    const persisted = { ...initialState, activeChatId: "c9" };
    expect(reducer(initialState, { type: "HYDRATE", state: persisted })).toEqual(persisted);
  });

  it("replaces a temporary message id with the server id", () => {
    const withMsg = reducer(
      { ...initialState, activeChatId: "c1" },
      { type: "ADD_MESSAGE", message: msg({ id: "local-1", direction: "out", status: "sending" }) }
    );
    const replaced = reducer(withMsg, {
      type: "REPLACE_MESSAGE_ID",
      chatId: "c1",
      tempId: "local-1",
      serverId: "srv-1",
    });
    expect(replaced.messagesByChat["c1"]).toHaveLength(1);
    expect(replaced.messagesByChat["c1"][0].id).toBe("srv-1");
    expect(replaced.messagesByChat["c1"][0].status).toBe("sent");
  });

  it("removes the temp message when the server copy already arrived (race)", () => {
    const withTemp = reducer(
      { ...initialState, activeChatId: "c1" },
      { type: "ADD_MESSAGE", message: msg({ id: "local-1", direction: "out", status: "sending" }) }
    );
    const withServer = reducer(withTemp, {
      type: "ADD_MESSAGE",
      message: msg({ id: "srv-1", direction: "out", status: "sent" }),
    });
    const replaced = reducer(withServer, {
      type: "REPLACE_MESSAGE_ID",
      chatId: "c1",
      tempId: "local-1",
      serverId: "srv-1",
    });
    expect(replaced.messagesByChat["c1"]).toHaveLength(1);
    expect(replaced.messagesByChat["c1"][0].id).toBe("srv-1");
  });

  it("auto-creates a chat for an incoming message from an unknown chatId", () => {
    const state = reducer(
      { ...initialState, activeChatId: "c1" },
      { type: "ADD_MESSAGE", message: msg({ chatId: "unknown", direction: "in" }) }
    );
    expect(state.chats).toHaveLength(1);
    expect(state.chats[0]).toEqual({
      id: "unknown",
      name: "unknown",
      phone: "unknown",
      lastActivity: 1,
    });
  });

  it("does not auto-create a chat for an outgoing message", () => {
    const state = reducer(
      { ...initialState, activeChatId: "c1" },
      { type: "ADD_MESSAGE", message: msg({ chatId: "unknown", direction: "out" }) }
    );
    expect(state.chats).toHaveLength(0);
  });

  it("is a no-op when SET_CONNECTION status is unchanged", () => {
    const online = reducer(initialState, { type: "SET_CONNECTION", status: "online" });
    const again = reducer(online, { type: "SET_CONNECTION", status: "online" });
    expect(again).toBe(online);
  });
});
