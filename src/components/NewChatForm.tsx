import { useState, type FormEvent } from "react";
import { useChat } from "../store/ChatContext";
import styles from "./NewChatForm.module.css";

export function NewChatForm() {
  const { addChat } = useChat();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const value = phone.trim();
    if (!value) return;
    setBusy(true);
    setError("");
    try {
      await addChat(value);
      setPhone("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось создать чат");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        className={styles.input}
        placeholder="Введите номер телефона"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        inputMode="tel"
      />
      <button className={styles.button} type="submit" disabled={busy}>
        Создать
      </button>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
