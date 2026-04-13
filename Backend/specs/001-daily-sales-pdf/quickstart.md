# Quickstart: Daily Sales PDF Report

## Prerequisites

- Java 17+
- Maven 3.8+
- Oracle Database with `SP_GET_DAILY_SALES` stored procedure
- PostgreSQL/H2 for application metadata (if using)

## Build

```bash
./mvnw clean package -DskipTests
```

## Run

```bash
./mvnw spring-boot:run
```

## Test Report Generation

### Request Report for Today

```bash
curl "http://localhost:8080/api/v1/reports/sales?date=$(date +%Y-%m-%d)"
```

### Request Report for Specific Date

```bash
curl "http://localhost:8080/api/v1/reports/sales?date=2026-03-24"
```

### Expected Response

```json
{
  "success": true,
  "message": "Report generated successfully",
  "data": {
    "reportDate": "2026-03-24",
    "lineItems": [...],
    "subtotal": 135.00,
    "vatRate": 0.19,
    "vatAmount": 25.65,
    "total": 160.65,
    "generatedAt": "2026-03-24T10:30:00Z"
  }
}
```

## Integration Test Scenarios

### Scenario 1: Valid Date with Sales

1. Ensure Oracle database has sales data for a date
2. Call endpoint with that date
3. Verify response contains line items with correct calculations

### Scenario 2: Valid Date without Sales

1. Call endpoint with a date that has no sales
2. Verify response has empty lineItems array
3. Verify subtotal, vatAmount, total are all 0.00

### Scenario 3: Invalid Date Format

1. Call endpoint with malformed date (e.g., `?date=24-03-2026`)
2. Verify 400 Bad Request response
3. Verify error message indicates invalid format

### Scenario 4: Future Date

1. Call endpoint with future date
2. Verify 400 Bad Request response
3. Verify error message indicates date cannot be in future

### Scenario 5: Database Unavailable

1. Stop Oracle database or misconfigure connection
2. Call endpoint
3. Verify 503 Service Unavailable response

## Database Setup

### Create Stored Procedure

Execute the following in Oracle SQL*Plus or SQL Developer:

```sql
-- Sample table (adjust according to actual schema)
CREATE TABLE DAILY_SALES (
    SALE_ID NUMBER PRIMARY KEY,
    SALE_DATE DATE NOT NULL,
    PRODUCT_NAME VARCHAR2(100) NOT NULL,
    QUANTITY_SOLD NUMBER NOT NULL,
    UNIT_PRICE NUMBER(10,2) NOT NULL
);

-- Insert sample data
INSERT INTO DAILY_SALES VALUES (1, SYSDATE, 'Pan Francés', 50, 1.50);
INSERT INTO DAILY_SALES VALUES (2, SYSDATE, 'Concha', 30, 2.00);
COMMIT;

-- Create procedure
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

### Configure Oracle Connection

Add to `application.properties`:

```properties
spring.datasource.url=jdbc:oracle:thin:@localhost:1521:ORCL
spring.datasource.username=your_username
spring.datasource.password=your_password
spring.datasource.driver-class-name=oracle.jdbc.OracleDriver
```
