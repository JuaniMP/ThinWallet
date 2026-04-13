# Data Model: Daily Sales PDF Report

## Request DTO

### SalesReportRequest

Represents the user's request for a sales report.

| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| date | LocalDate | @NotNull, @PastOrPresent | Date for the report |

---

## Response DTO

### SalesReportResponse

Represents the complete sales report data.

| Field | Type | Description |
|-------|------|-------------|
| reportDate | LocalDate | The date of the sales |
| lineItems | List<SalesLineItem> | List of products sold |
| subtotal | BigDecimal | Sum of all line items (before VAT) |
| vatRate | BigDecimal | Fixed at 0.19 (19%) |
| vatAmount | BigDecimal | Calculated as subtotal × 0.19 |
| total | BigDecimal | subtotal + vatAmount |
| generatedAt | Instant | Report generation timestamp |

### SalesLineItem

Individual product entry in the report.

| Field | Type | Description |
|-------|------|-------------|
| productName | String | Name of bakery product |
| quantity | Integer | Units sold |
| unitPrice | BigDecimal | Price per unit |
| lineTotal | BigDecimal | quantity × unitPrice |

---

## Entity (Internal)

### SalesData (Oracle Result Set Mapping)

Maps to the stored procedure result set.

| Column | Field | Type |
|--------|-------|------|
| PRODUCT_NAME | productName | String |
| QUANTITY_SOLD | quantity | Integer |
| UNIT_PRICE | unitPrice | BigDecimal |

---

## Validation Rules

1. **Date**: Must not be null, must be today or past (no future dates)
2. **Subtotal**: Must be >= 0
3. **Quantity**: Must be > 0
4. **Unit Price**: Must be > 0
5. **VAT Rate**: Fixed at 19%, cannot be modified

---

## State Transitions

1. **Request Received** → Validate date → Call stored procedure
2. **Data Retrieved** → Map to line items → Calculate subtotal
3. **Subtotal Calculated** → Calculate VAT (19%) → Calculate total
4. **PDF Generated** → Return response with PDF bytes

---

## Error States

| State | Condition | Response |
|-------|-----------|----------|
| INVALID_DATE | Date is null or future | 400 Bad Request |
| NO_DATA | No sales for date | 200 OK with empty lineItems |
| DB_CONNECTION_FAIL | Oracle unavailable | 503 Service Unavailable |
| PROCEDURE_ERROR | Procedure execution fails | 500 Internal Server Error |
