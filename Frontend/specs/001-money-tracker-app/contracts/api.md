# API Contracts: Money Tracker App

## Autenticacion

### POST /api/auth/login
**Request**:
```json
{
  "email": "string",
  "password": "string"
}
```

**Response (200)**:
```json
{
  "user": { "id": "string", "name": "string", "email": "string" },
  "token": "string"
}
```

**Response (401)**: Credenciales invalidas

---

### POST /api/auth/register
**Request**:
```json
{
  "name": "string",
  "email": "string",
  "password": "string"
}
```

**Response (201)**:
```json
{
  "user": { "id": "string", "name": "string", "email": "string" },
  "token": "string"
}
```

**Response (400)**: Email ya existe

---

### POST /api/auth/logout
**Headers**: Authorization: Bearer {token}
**Response (200)**: { "success": true }

---

### POST /api/auth/forgot-password
**Request**:
```json
{
  "email": "string"
}
```

**Response (200)**: { "message": "Email de recuperacion enviado" }

---

## Transacciones

### GET /api/transactions
**Query Params**: `?type=expense&categoryId=xxx&page=1&limit=20`
**Headers**: Authorization: Bearer {token}

**Response (200)**:
```json
{
  "data": [
    {
      "id": "string",
      "amount": 100.00,
      "description": "string",
      "type": "expense",
      "categoryId": "string",
      "date": "2026-04-09T10:00:00Z",
      "createdAt": "2026-04-09T10:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 50 }
}
```

---

### POST /api/transactions
**Headers**: Authorization: Bearer {token}
**Request**:
```json
{
  "amount": 100.00,
  "description": "Almuerzo",
  "type": "expense",
  "categoryId": "food",
  "date": "2026-04-09"
}
```

**Response (201)**: Transaccion creada

---

### DELETE /api/transactions/:id
**Headers**: Authorization: Bearer {token}
**Response (200)**: { "success": true }

---

### GET /api/transactions/balance
**Headers**: Authorization: Bearer {token}

**Response (200)**:
```json
{
  "totalIncome": 5000.00,
  "totalExpense": 2500.00,
  "balance": 2500.00
}
```

---

## Categorias

### GET /api/categories
**Response (200)**:
```json
{
  "data": [
    { "id": "food", "name": "Comida", "type": "expense" },
    { "id": "salary", "name": "Salario", "type": "income" }
  ]
}
```