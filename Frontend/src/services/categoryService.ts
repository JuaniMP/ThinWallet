import { api } from './api';
import type { Category } from '../types';

export const categoryService = {
  async getAll(): Promise<Category[]> {
    return api.get<Category[]>('/categorias');
  },
};
