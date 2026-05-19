import { useEffect, useRef } from "react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api";

interface SaldoEvent {
  saldoTotal?: number;
}

/**
 * RF-07 — Suscripción Server-Sent Events al stream de saldos del usuario.
 * El backend emite eventos {@code saldo} cada vez que se crea, actualiza o
 * elimina una transacción / deuda del usuario.
 *
 * @param idUsuario        ID del usuario autenticado (null = desconecta)
 * @param onSaldoActualizado callback con el nuevo saldoTotal
 */
export function useSaldoStream(
  idUsuario: number | null | undefined,
  onSaldoActualizado: (saldo: number) => void,
) {
  const cbRef = useRef(onSaldoActualizado);
  cbRef.current = onSaldoActualizado;

  useEffect(() => {
    if (!idUsuario) return;
    const token = localStorage.getItem("token");
    const url = `${API_URL}/eventos/saldos/${idUsuario}${token ? `?token=${encodeURIComponent(token)}` : ""}`;
    let es: EventSource | null = null;
    try {
      es = new EventSource(url);
    } catch {
      return;
    }
    const handleSaldo = (ev: MessageEvent) => {
      try {
        const data = JSON.parse(ev.data) as SaldoEvent;
        if (typeof data.saldoTotal === "number") {
          cbRef.current(data.saldoTotal);
        }
      } catch {
        /* ignore malformed event */
      }
    };
    es.addEventListener("saldo", handleSaldo as EventListener);

    es.onerror = () => {
      // EventSource intentará reconectar automáticamente; cerramos en caso de fallo persistente.
      if (es && es.readyState === EventSource.CLOSED) {
        es.close();
      }
    };

    return () => {
      es?.removeEventListener("saldo", handleSaldo as EventListener);
      es?.close();
    };
  }, [idUsuario]);
}
