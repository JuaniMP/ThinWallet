import { api } from './api';
import type { Category } from '../types';

export const categoryService = {
  async getAll(): Promise<{ data: Category[] }> {
    return api.get<{ data: Category[] }>('/categories');
  },
};