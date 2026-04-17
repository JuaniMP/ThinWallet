import { useState, useEffect } from 'react';
import { categoryService } from '../../services/categoryService';
import type { Category } from '../../types';

interface CategorySelectProps {
  type: 'income' | 'expense';
  value: string;
  onChange: (categoryId: string) => void;
}

export function CategorySelect({ type, value, onChange }: CategorySelectProps) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryService.getAll();
        const filtered = response.data.filter(
          (cat) => cat.type === type || cat.type === 'both'
        );
        setCategories(filtered);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, [type]);

  return (
    <div className="input-group">
      <label>Categoría</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} required>
        <option value="">Seleccionar categoría</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>
    </div>
  );
}
