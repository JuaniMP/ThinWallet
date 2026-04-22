import { useState, useEffect } from 'react';
import { api } from '../../services/api';

interface BackendCategoria {
  idCategoria: number;
  nombre: string;
  tipoCategoria: string | null;
}

interface CategorySelectProps {
  type: 'DEPOSITO' | 'RETIRO';
  value: number | '';
  onChange: (categoryId: number) => void;
}

export function CategorySelect({ type, value, onChange }: CategorySelectProps) {
  const [categories, setCategories] = useState<BackendCategoria[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get<BackendCategoria[]>('/categorias');
        // El backend retorna un Array, filtramos por el tipo de movimiento o si es genérico
        const filtered = (Array.isArray(response) ? response : []).filter(
          (cat) => !cat.tipoCategoria || cat.tipoCategoria === type || cat.tipoCategoria === 'AMBOS'
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
      <select 
        value={value} 
        onChange={(e) => onChange(Number(e.target.value))} 
        required
      >
        <option value="" disabled>Seleccionar categoría</option>
        {categories.map((cat) => (
          <option key={cat.idCategoria} value={cat.idCategoria}>
            {cat.nombre}
          </option>
        ))}
      </select>
    </div>
  );
}
