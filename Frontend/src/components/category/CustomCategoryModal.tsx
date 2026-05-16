import { useState } from "react";
import { createPortal } from "react-dom";
import { Input } from "../common/Input";
import { Button } from "../common/Button";
import {
  categoryService,
  type CreateCategoryRequest,
} from "../../services/categoryService";
import type { Category } from "../../types";

interface CustomCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (category: Category) => void;
  defaultTipo?: "DEPOSITO" | "RETIRO";
}

export function CustomCategoryModal({
  isOpen,
  onClose,
  onCreated,
  defaultTipo = "RETIRO",
}: CustomCategoryModalProps) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipoCategoria, setTipoCategoria] = useState<
    "DEPOSITO" | "RETIRO" | "AMBOS" | ""
  >("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const resetForm = () => {
    setNombre("");
    setDescripcion("");
    setTipoCategoria("");
    setError("");
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    if (!descripcion.trim()) {
      setError("La descripción es obligatoria");
      return;
    }
    if (!tipoCategoria) {
      setError("El tipo de categoría es obligatorio");
      return;
    }

    const payload: CreateCategoryRequest = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      tipoCategoria,
      exclusivaPerfilSolo: true,
      frecuenciaUso: 0,
    };

    try {
      setIsSubmitting(true);
      const created = await categoryService.create(payload);
      onCreated(created);
      resetForm();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo crear la categoría",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="custom-category-modal-overlay" onClick={handleClose}>
      <div
        className="custom-category-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="custom-category-modal__header">
          <h3>Crear categoría personalizada</h3>
          <button
            type="button"
            className="custom-category-modal__close"
            onClick={handleClose}
            aria-label="Cerrar"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <p className="custom-category-modal__hint">
          Esta categoría solo se mostrará en tu perfil.
        </p>

        <form onSubmit={handleSubmit} className="custom-category-form">
          {error && <div className="error-alert">{error}</div>}

          <Input
            label="Nombre *"
            type="text"
            name="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={100}
            required
          />

          <Input
            label="Descripción *"
            type="text"
            name="descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            maxLength={255}
            required
          />

          <div className="input-group">
            <label htmlFor="tipoCategoria">Tipo de categoría *</label>
            <select
              id="tipoCategoria"
              value={tipoCategoria}
              onChange={(e) =>
                setTipoCategoria(
                  e.target.value as "DEPOSITO" | "RETIRO" | "AMBOS" | "",
                )
              }
              required
            >
              <option value="" disabled>Seleccionar categoría</option>
              <option value="RETIRO">Retiro (Gasto)</option>
              <option value="DEPOSITO">Depósito (Ingreso)</option>
              <option value="AMBOS">Ambos</option>
            </select>
          </div>

          <div className="custom-category-modal__actions">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Crear categoría
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
