# Data Model: Money Tracker App

## Entidades

### Usuario

| Campo | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| id | string (UUID) | Si | Identificador unico |
| name | string | Si | Nombre completo |
| email | string | Si | Email (unico) |
| password | string | Si | Contrasena hasheada |
| createdAt | Date | Si | Fecha de creacion |

### Transaccion

| Campo | Tipo | Requerido | Validacion |
|-------|------|-----------|------------|
| id | string (UUID) | Si | Identificador unico |
| userId | string | Si | Referencia al usuario |
| amount | number | Si | > 0 |
| description | string | Si | Max 500 caracteres |
| type | enum | Si | 'income' o 'expense' |
| categoryId | string | Si | Referencia a categoria |
| date | Date | Si | Fecha de la transaccion |
| createdAt | Date | Si | Fecha de creacion |

### Categoria

| Campo | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| id | string | Si | Identificador |
| name | string | Si | Nombre de categoria |
| type | enum | Si | 'income', 'expense', 'both' |
| icon | string | No | Icono representativo |

## Relaciones

```
Usuario 1 ---> * Transaccion
Categoria 1 ---> * Transaccion
```

## Reglas de validacion

- Transacciones: monto debe ser positivo
- Email: formato valido
- Password: minimo 8 caracteres
- Descripcion: max 500 caracteres, permitidos caracteres especiales

## Estados

### Transaccion
- `pending` - Guardada pero no confirmada
- `confirmed` - Confirmada y en balance

### Sesion
- `active` - Usuario autenticado
- `expired` - Token expirado
- `logged_out` - Sin sesion activa