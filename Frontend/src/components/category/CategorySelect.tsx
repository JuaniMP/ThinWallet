import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import { CustomCategoryModal } from "./CustomCategoryModal";
import type { Category } from "../../types";

interface BackendCategoria {
  idCategoria: number;
  nombre: string;
  tipoCategoria: string | null;
  exclusivaPerfilSolo?: boolean | null;
}

interface CategorySelectProps {
  type: "DEPOSITO" | "RETIRO" | null;
  value: number | "";
  onChange: (categoryId: number) => void;
  /** Called with the selected category's tipoCategoria so the parent can react (e.g. auto-set RETIRO for AMBOS) */
  onTypeHint?: (tipo: string | null) => void;
}

const CUSTOM_CATEGORIES_STORAGE_KEY = "customCategoriesByUser";

function getCurrentUserId(): number | null {
  const storedUser = localStorage.getItem("user");
  if (!storedUser) return null;
  try {
    const user = JSON.parse(storedUser);
    return typeof user.idUsuario === "number" ? user.idUsuario : null;
  } catch {
    return null;
  }
}

function readCustomCategoryMap(): Record<string, number[]> {
  try {
    const raw = localStorage.getItem(CUSTOM_CATEGORIES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function getOwnedCustomIds(userId: number | null): Set<number> {
  if (userId === null) return new Set();
  const map = readCustomCategoryMap();
  const list = map[String(userId)];
  return new Set(Array.isArray(list) ? list : []);
}

function addOwnedCustomId(userId: number | null, idCategoria: number): void {
  if (userId === null) return;
  const map = readCustomCategoryMap();
  const key = String(userId);
  const current = Array.isArray(map[key]) ? map[key] : [];
  if (!current.includes(idCategoria)) {
    map[key] = [...current, idCategoria];
    localStorage.setItem(CUSTOM_CATEGORIES_STORAGE_KEY, JSON.stringify(map));
  }
}

export function CategorySelect({ type, value, onChange, onTypeHint }: CategorySelectProps) {
  const [categories, setCategories] = useState<BackendCategoria[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const userId = useMemo(() => getCurrentUserId(), []);
  const [ownedCustomIds, setOwnedCustomIds] = useState<Set<number>>(() =>
    getOwnedCustomIds(userId),
  );

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get<BackendCategoria[]>("/categorias");
      setCategories(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const visibleCategories = useMemo(() => {
    return categories.filter((cat) => {
      const matchesType =
        !type ||
        !cat.tipoCategoria ||
        cat.tipoCategoria === type ||
        cat.tipoCategoria === "AMBOS";
      if (!matchesType) return false;

      if (cat.exclusivaPerfilSolo) {
        return ownedCustomIds.has(cat.idCategoria);
      }
      return true;
    });
  }, [categories, type, ownedCustomIds]);

  const handleCreated = (created: Category) => {
    addOwnedCustomId(userId, created.idCategoria);
    setOwnedCustomIds(getOwnedCustomIds(userId));
    fetchCategories();
    onChange(created.idCategoria);
  };

  return (
    <div className="input-group category-select-group">
      <div className="category-select-header">
        <label htmlFor="categoria">Categoría</label>
        <button
          type="button"
          className="btn-create-category"
          onClick={() => setIsModalOpen(true)}
          aria-label="Crear categoría personalizada"
        >
          <span className="material-symbols-outlined">add</span>
          Crear categoría
        </button>
      </div>

      <select
        id="categoria"
        value={value}
        onChange={(e) => {
          const id = Number(e.target.value);
          onChange(id);
          if (onTypeHint) {
            const selected = visibleCategories.find((c) => c.idCategoria === id);
            onTypeHint(selected?.tipoCategoria ?? null);
          }
        }}
        required
      >
        <option value="" disabled>
          Seleccionar categoría
        </option>
        {visibleCategories.map((cat) => (
          <option key={cat.idCategoria} value={cat.idCategoria}>
            {cat.exclusivaPerfilSolo ? `★ ${cat.nombre}` : cat.nombre}
          </option>
        ))}
      </select>

      <CustomCategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleCreated}
        defaultTipo={type ?? "RETIRO"}
      />
    </div>
  );
}
