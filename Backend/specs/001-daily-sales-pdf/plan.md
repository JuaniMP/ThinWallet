# Implementation Plan: Daily Sales PDF Report

**Branch**: `001-daily-sales-pdf` | **Date**: 2026-03-24 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-daily-sales-pdf/spec.md`

## Summary

Create a Daily Sales PDF Report module for bakery products. The solution uses a three-layer architecture: Response DTO for data transfer, Service for business logic (VAT calculation, data aggregation), and Spring Boot Controller for REST API. Data is retrieved from Oracle via stored procedure. Exception handling for database connection failures is included.

## Technical Context

**Language/Version**: Java 17  
**Primary Dependencies**: Spring Boot 3.x, iText 7.x (PDF generation), Oracle JDBC driver  
**Storage**: Oracle Database (via stored procedure)  
**Testing**: JUnit 5, Mockito for unit tests; MockMvc for integration tests  
**Target Platform**: Linux server (Spring Boot REST API)  
**Project Type**: Web service (REST API)  
**Performance Goals**: Report generation under 5 seconds  
**Constraints**: VAT rate fixed at 19%, PDF format required  
**Scale**: Single store daily reports (up to ~1000 line items per report)

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Domain-Driven Architecture | PASS | Code organized by domain (report/sales), not technical layer |
| II. API-First Design | PASS | REST endpoint at /api/v1/reports/sales, ApiResponse wrapper |
| III. Test-First Development | TO VERIFY | TDD approach required during implementation |
| IV. Security-First | PASS | Endpoint protected, no sensitive data in logs |
| V. Observability | PASS | Structured logging with @Slf4j |

## Project Structure

### Documentation (this feature)

```text
specs/001-daily-sales-pdf/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── sales-report-api.md
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
src/main/java/com/thinwallet/
├── controller/
│   └── SalesReportController.java      # REST endpoint
├── service/
│   └── SalesReportService.java         # Business logic
├── dto/
│   ├── SalesReportRequest.java          # Request DTO (date filter)
│   └── SalesReportResponse.java         # Response DTO
├── exception/
│   ├── DatabaseConnectionException.java # Oracle connection failure
│   ├── StoredProcedureException.java    # Procedure execution error
│   └── SalesDataNotFoundException.java  # No sales for date
├── config/
│   └── OracleDataSourceConfig.java      # Oracle connection config
└── repository/
    └── SalesReportRepository.java       # Stored procedure call

src/main/java/com/thinwallet/pdf/
└── SalesReportPdfGenerator.java         # iText PDF generation

src/test/java/com/thinwallet/
├── service/
│   └── SalesReportServiceTest.java      # Unit tests
└── controller/
    └── SalesReportControllerTest.java   # Integration tests
```

**Structure Decision**: Following domain-driven structure in `com.thinwallet` package. PDF generator in separate `pdf` subpackage for cleaner separation. DTOs in dedicated `dto` package. Exceptions in `exception` package.

## Complexity Tracking

No complexity violations - standard three-tier architecture with proper separation:
- DTO: Data transfer only, no business logic
- Service: Business logic (VAT calc, data aggregation)
- Controller: HTTP handling, validation, response wrapping
- Exception handling: Custom exceptions for Oracle database errors

---

## Phase 0: Research

### Research: Oracle Stored Procedure Integration

**Decision**: Use Spring's `JdbcTemplate` or `@Procedure` annotation to call Oracle stored procedure.

**Rationale**: 
- `JdbcTemplate` provides fine-grained control over procedure parameters and result set mapping
- `@Procedure` annotation is cleaner for simple procedure calls
- Both integrate well with Spring's transaction management

**Alternatives considered**:
- MyBatis: Overkill for single procedure call
- JPA native query: Less flexible for OUT parameters

### Research: iText PDF Generation

**Decision**: Use iText 7 with Apache PDFBox for additional image handling if needed.

**Rationale**: 
- iText 7 is the current stable version with better API
- Supports table layouts needed for sales line items
- Compatible with Java 17

**Alternatives considered**:
- JasperReports: More complex, better for complex layouts
- Apache PDFBox: Lower-level, would require more code

---

## Phase 1: Design & Contracts

### Data Model

**SalesReportRequest** (Request DTO)
- `date: LocalDate` - Required, the date for the report

**SalesReportResponse** (Response DTO)
- `reportDate: LocalDate` - The date of the sales
- `lineItems: List<SalesLineItem>` - List of products sold
- `subtotal: BigDecimal` - Sum of all line items (before VAT)
- `vatRate: BigDecimal` - Fixed at 19%
- `vatAmount: BigDecimal` - Calculated as subtotal × 0.19
- `total: BigDecimal` - subtotal + vatAmount
- `generatedAt: Instant` - Report generation timestamp

**SalesLineItem**
- `productName: String` - Name of bakery product
- `quantity: Integer` - Units sold
- `unitPrice: BigDecimal` - Price per unit
- `lineTotal: BigDecimal` - quantity × unitPrice

### API Contract

**Endpoint**: `GET /api/v1/reports/sales`

**Request Parameters**:
| Parameter | Type | Required | Format |
|-----------|------|----------|--------|
| date | Query | Yes | ISO date (YYYY-MM-DD) |

**Response (Success - 200 OK)**:
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
      }
    ],
    "subtotal": 75.00,
    "vatRate": 0.19,
    "vatAmount": 14.25,
    "total": 89.25,
    "generatedAt": "2026-03-24T10:30:00Z"
  },
  "errors": null
}
```

**Response (No Data - 200 OK)**:
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

**Response (Error - 4xx/5xx)**:
```json
{
  "success": false,
  "message": "Error message",
  "data": null,
  "errors": [
    {
      "field": "date",
      "message": "Invalid date format"
    }
  ]
}
```

### Exception Handling

| Exception | HTTP Status | Message |
|-----------|-------------|---------|
| DatabaseConnectionException | 503 | "Unable to connect to database" |
| StoredProcedureException | 500 | "Error executing stored procedure" |
| SalesDataNotFoundException | 200 | "No sales data found" (success=true, empty data) |
| MethodArgumentTypeMismatchException | 400 | "Invalid date format" |
| ConstraintViolationException | 400 | "Date is required" |

### Stored Procedure Contract

**Procedure Name**: `SP_GET_DAILY_SALES`

**Parameters**:
| Name | Type | Direction | Description |
|------|------|----------|-------------|
| p_sales_date | DATE | IN | Date to query |
| p_cursor | SYS_REFCURSOR | OUT | Result set with sales data |

**Result Set Structure**:
| Column | Type | Description |
|--------|------|-------------|
| PRODUCT_NAME | VARCHAR2 | Name of bakery product |
| QUANTITY_SOLD | NUMBER | Units sold |
| UNIT_PRICE | NUMBER | Price per unit |

---

## Implementation Notes

1. **VAT Calculation**: Must use `BigDecimal` with scale 2 for precision. VAT = subtotal × 0.19
2. **Date Validation**: Use `@Valid` and `@NotNull` on request DTO. Date must not be in the future.
3. **Oracle Connection**: Configure in `application.properties` or `application.yml`
4. **PDF Generation**: Use iText Table for line items, simple header/footer layout
5. **Logging**: Use `@Slf4j`, log report generation start/end, log errors with correlation ID
