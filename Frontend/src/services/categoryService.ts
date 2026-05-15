import { api } from "./api";
import type { Category } from "../types";

export interface CreateCategoryRequest {
  nombre: string;
  descripcion?: string;
  tipoCategoria?: string;
  exclusivaPerfilSolo?: boolean;
  frecuenciaUso?: number;
  idCirculoGasto?: number;
}

export const categoryService = {
  async getAll(): Promise<Category[]> {
    return api.get<Category[]>("/categorias");
  },

  async create(data: CreateCategoryRequest): Promise<Category> {
    return api.post<Category>("/categorias", data);
  },
};
