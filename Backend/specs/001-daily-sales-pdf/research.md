# Research: Daily Sales PDF Report Module

**Date**: 2026-03-24

## Decision: Oracle Stored Procedure Integration

**Chosen Approach**: Spring JdbcTemplate with SimpleJdbcCall

**Rationale**:
- Provides fine-grained control over stored procedure parameters
- Supports OUT parameters (REF CURSOR) needed for this use case
- Integrates with Spring's transaction management
- Well-established pattern in Spring Boot applications

**Implementation**:
```java
SimpleJdbcCall jdbcCall = new SimpleJdbcCall(jdbcTemplate)
    .withProcedureName("SP_GET_DAILY_SALES")
    .declareParameters(
        new SqlParameter("p_sales_date", Types.DATE),
        new SqlOutParameter("p_cursor", Types.CURSOR, new SalesRowMapper())
    );
```

**Alternatives Considered**:
- `@Procedure` annotation: Simpler but less flexible for complex OUT parameters
- MyBatis: Overkill for single procedure call
- JPA native query: Doesn't support REF CURSOR well

---

## Decision: PDF Generation Library

**Chosen Approach**: iText 7

**Rationale**:
- Current stable version with improved API over iText 5
- Excellent table support for sales line items
- Professional PDF output quality
- Active maintenance and community support

**Implementation Plan**:
- Use `PdfWriter` for document creation
- Use `Table` for sales line items
- Simple header with company info and date
- Footer with generation timestamp

**Alternatives Considered**:
- JasperReports: More powerful but steeper learning curve
- Apache PDFBox: Lower-level, more code needed
- OpenPDF: Open source iText fork, less feature-rich

---

## Decision: Exception Handling Strategy

**Chosen Approach**: Custom exceptions with @ControllerAdvice

**Rationale**:
- Follows Spring Best Practices
- Consistent error response structure
- Maps Oracle-specific errors to user-friendly messages
- Allows specific handling for database connection vs. procedure execution errors

**Exception Hierarchy**:
- `DatabaseConnectionException` (extends RuntimeException): Oracle connection failures
- `StoredProcedureException` (extends RuntimeException): Procedure execution errors
- `SalesDataNotFoundException` (extends RuntimeException): No data for date

**Global Exception Handler**:
```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(DatabaseConnectionException.class)
    public ResponseEntity<ApiResponse<Void>> handleConnectionError(...) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(ApiResponse.error("Unable to connect to database"));
    }
}
```

---

## Decision: VAT Calculation

**Chosen Approach**: BigDecimal with explicit scale

**Rationale**:
- Precise decimal arithmetic required for financial calculations
- Avoids floating-point rounding errors
- Standard practice for currency in Java

**Implementation**:
```java
BigDecimal vatRate = new BigDecimal("0.19");
BigDecimal vatAmount = subtotal.multiply(vatRate).setScale(2, RoundingMode.HALF_UP);
BigDecimal total = subtotal.add(vatAmount);
```
