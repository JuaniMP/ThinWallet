# Sales Report API Contract

## Overview

REST API endpoint for generating daily sales PDF reports for bakery products.

## Base URL

```
GET /api/v1/reports/sales?date={date}
```

---

## Request

### Query Parameters

| Parameter | Type | Required | Format | Description |
|-----------|------|----------|--------|-------------|
| date | string | Yes | ISO date (YYYY-MM-DD) | Date to generate report for |

### Example Request

```
GET /api/v1/reports/sales?date=2026-03-24
```

---

## Response: Success (200 OK)

### With Sales Data

```json
{
  "success": true,
  "message": "Report generated successfully",
  "data": {
    "reportDate": "2026-03-24",
    "lineItems": [
      {
        "productName": "Pan Francés",
        "quantity": 50,
        "unitPrice": 1.50,
        "lineTotal": 75.00
      },
      {
        "productName": "Concha",
        "quantity": 30,
        "unitPrice": 2.00,
        "lineTotal": 60.00
      }
    ],
    "subtotal": 135.00,
    "vatRate": 0.19,
    "vatAmount": 25.65,
    "total": 160.65,
    "generatedAt": "2026-03-24T10:30:00Z"
  },
  "errors": null
}
```

### Without Sales Data

```json
{
  "success": true,
  "message": "No sales data found for the specified date",
  "data": {
    "reportDate": "2026-03-25",
    "lineItems": [],
    "subtotal": 0.00,
    "vatRate": 0.19,
    "vatAmount": 0.00,
    "total": 0.00,
    "generatedAt": "2026-03-24T10:30:00Z"
  },
  "errors": null
}
```

---

## Response: Client Error (400 Bad Request)

### Invalid Date Format

```json
{
  "success": false,
  "message": "Invalid request parameters",
  "data": null,
  "errors": [
    {
      "field": "date",
      "message": "Invalid date format. Use YYYY-MM-DD"
    }
  ]
}
```

### Date Required

```json
{
  "success": false,
  "message": "Invalid request parameters",
  "data": null,
  "errors": [
    {
      "field": "date",
      "message": "Date is required"
    }
  ]
}
```

### Future Date

```json
{
  "success": false,
  "message": "Invalid request parameters",
  "data": null,
  "errors": [
    {
      "field": "date",
      "message": "Date cannot be in the future"
    }
  ]
}
```

---

## Response: Server Error (500 Internal Server Error)

### Database Connection Failed

```json
{
  "success": false,
  "message": "Unable to connect to database. Please try again later.",
  "data": null,
  "errors": [
    {
      "field": "database",
      "message": "Connection timeout"
    }
  ]
}
```

### Stored Procedure Error

```json
{
  "success": false,
  "message": "Error generating report. Please contact support.",
  "data": null,
  "errors": [
    {
      "field": "procedure",
      "message": "SP_GET_DAILY_SALES execution failed"
    }
  ]
}
```

---

## Response: Service Unavailable (503)

```json
{
  "success": false,
  "message": "Database service is temporarily unavailable",
  "data": null,
  "errors": [
    {
      "field": "service",
      "message": "Oracle database connection failed"
    }
  ]
}
```

---

## Stored Procedure Contract

### Procedure: SP_GET_DAILY_SALES

Retrieves daily sales data from Oracle database.

**Input Parameters**:

| Name | Type | Description |
|------|------|-------------|
| p_sales_date | DATE | Date to query sales for |

**Output Parameters**:

| Name | Type | Description |
|------|------|-------------|
| p_cursor | SYS_REFCURSOR | Cursor containing sales data |

**Result Set Columns**:

| Column | Type | Description |
|--------|------|-------------|
| PRODUCT_NAME | VARCHAR2(100) | Name of the bakery product |
| QUANTITY_SOLD | NUMBER | Quantity sold |
| UNIT_PRICE | NUMBER(10,2) | Price per unit |

### Example SQL

```sql
CREATE OR REPLACE PROCEDURE SP_GET_DAILY_SALES(
    p_sales_date IN DATE,
    p_cursor OUT SYS_REFCURSOR
)
AS
BEGIN
    OPEN p_cursor FOR
        SELECT 
            PRODUCT_NAME,
            QUANTITY_SOLD,
            UNIT_PRICE
        FROM DAILY_SALES
        WHERE TRUNC(SALE_DATE) = TRUNC(p_sales_date)
        ORDER BY PRODUCT_NAME;
END SP_GET_DAILY_SALES;
/
```

---

## PDF Report Structure

### Header
- Company Name: "Thin Wallet Panadería"
- Report Title: "Reporte de Ventas Diarias"
- Date: Selected date (formatted: DD/MM/YYYY)

### Content
- Table with columns: Producto, Cantidad, Precio Unitario, Total
- Subtotal row
- IVA (19%) row
- Total row (bold)

### Footer
- Generation timestamp
- Page number (if multi-page)
