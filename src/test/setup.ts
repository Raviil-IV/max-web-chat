import "@testing-library/jest-dom/vitest";

// Node 26 exposes an experimental global `localStorage` that is `undefined`
// unless `--localstorage-file` is provided. Because vitest's jsdom
// environment uses `globalThis` as `window`, that builtin shadows jsdom's
// storage implementation. Provide an in-memory shim when it is missing so
// browser-style storage behaves as expected under test.
if (typeof globalThis.localStorage === "undefined") {
  const store = new Map<string, string>();
  const localStorageShim: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key) => (store.has(key) ? store.get(key)! : null),
    key: (index) => Array.from(store.keys())[index] ?? null,
    removeItem: (key) => {
      store.delete(key);
    },
    setItem: (key, value) => {
      store.set(key, String(value));
    },
  };
  Object.defineProperty(globalThis, "localStorage", {
    value: localStorageShim,
    configurable: true,
    writable: true,
  });
}
