import { useState, type FormEvent } from "react";
import { useChat } from "../store/ChatContext";
import styles from "./LoginScreen.module.css";

export function LoginScreen({ onSuccess }: { onSuccess?: () => void }) {
  const { login } = useChat();
  const [idInstance, setIdInstance] = useState("");
  const [apiTokenInstance, setApiTokenInstance] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!idInstance.trim() || !apiTokenInstance.trim()) return;
    setBusy(true);
    setError("");
    try {
      await login({ idInstance: idInstance.trim(), apiTokenInstance: apiTokenInstance.trim() });
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось подключиться");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <h1 className={styles.title}>MAX Чат</h1>
        <p className={styles.subtitle}>Введите данные инстанса GREEN-API</p>
        <label className={styles.label} htmlFor="idInstance">
          idInstance
        </label>
        <input
          id="idInstance"
          className={styles.input}
          value={idInstance}
          onChange={(e) => setIdInstance(e.target.value)}
          autoComplete="off"
        />
        <label className={styles.label} htmlFor="apiTokenInstance">
          apiTokenInstance
        </label>
        <input
          id="apiTokenInstance"
          className={styles.input}
          type="password"
          value={apiTokenInstance}
          onChange={(e) => setApiTokenInstance(e.target.value)}
          autoComplete="off"
        />
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <button className={styles.button} type="submit" disabled={busy}>
          {busy ? "Подключение…" : "Войти"}
        </button>
      </form>
    </div>
  );
}
