const BASE = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

function authHeader(): Record<string, string> {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const reporteService = {
  descargarPdf: async (idUsuario: number): Promise<void> => {
    const res = await fetch(`${BASE}/reportes/pdf/${idUsuario}`, { headers: authHeader() });
    if (!res.ok) throw new Error("Error al generar PDF");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte_${idUsuario}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  },

  descargarCsv: async (idUsuario: number): Promise<void> => {
    const res = await fetch(`${BASE}/reportes/csv/${idUsuario}`, { headers: authHeader() });
    if (!res.ok) throw new Error("Error al generar CSV");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transacciones_${idUsuario}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
