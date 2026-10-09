import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  GreenApiError,
  checkAccount,
  deleteNotification,
  getSettings,
  receiveNotification,
  resolveChatId,
  sendMessage,
  setSettings,
} from "./greenApi";
import type { Credentials } from "./types";

const creds: Credentials = { idInstance: "1101000", apiTokenInstance: "token" };

function mockFetchOnce(json: unknown, ok = true, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => json,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("greenApi", () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => vi.unstubAllGlobals());

  it("getSettings requests the correct URL", async () => {
    const fetchMock = mockFetchOnce({ wid: "1" });
    await getSettings(creds);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.green-api.com/waInstance1101000/getSettings/token",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("setSettings posts settings body", async () => {
    const fetchMock = mockFetchOnce({ saveSettings: true });
    await setSettings(creds, { webhookUrl: "", incomingWebhook: "yes" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.green-api.com/waInstance1101000/setSettings/token");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ webhookUrl: "", incomingWebhook: "yes" });
  });

  it("sendMessage posts chatId and message and returns idMessage", async () => {
    const fetchMock = mockFetchOnce({ idMessage: "abc" });
    const res = await sendMessage(creds, "70000000000", "привет");
    expect(res.idMessage).toBe("abc");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.green-api.com/waInstance1101000/sendMessage/token");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ chatId: "70000000000", message: "привет" });
  });

  it("checkAccount posts phoneNumber body", async () => {
    const fetchMock = mockFetchOnce({ exists: true });
    await checkAccount(creds, "79991234567");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.green-api.com/waInstance1101000/checkAccount/token");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ phoneNumber: "79991234567" });
  });

  it("receiveNotification returns null on empty body", async () => {
    mockFetchOnce(null);
    await expect(receiveNotification(creds)).resolves.toBeNull();
  });

  it("deleteNotification uses receiptId in the path", async () => {
    const fetchMock = mockFetchOnce({ result: true });
    await deleteNotification(creds, 42);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://api.green-api.com/waInstance1101000/deleteNotification/token/42"
    );
  });

  it("throws GreenApiError with status and message on non-ok response", async () => {
    mockFetchOnce({ message: "bad" }, false, 401);
    const err = await getSettings(creds).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(GreenApiError);
    expect(err).toMatchObject({ status: 401, message: "bad" });
  });

  it("resolveChatId returns chatId from checkAccount when present", async () => {
    mockFetchOnce({ chatId: "777" });
    await expect(resolveChatId(creds, "+7 (000) 000-00-00")).resolves.toBe("777");
  });

  it("resolveChatId falls back to the normalized phone number", async () => {
    mockFetchOnce({ exists: true });
    await expect(resolveChatId(creds, "+7 (999) 123-45-67")).resolves.toBe("79991234567");
  });

  it("resolveChatId throws when the number is not registered", async () => {
    mockFetchOnce({ exists: false });
    const err = await resolveChatId(creds, "+7 (999) 123-45-67").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(GreenApiError);
    expect(err).toMatchObject({ status: 400, message: "Номер не зарегистрирован в MAX" });
  });
});
