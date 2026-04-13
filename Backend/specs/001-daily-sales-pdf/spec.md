# Feature Specification: Daily Sales PDF Report Module

**Feature Branch**: `001-daily-sales-pdf`  
**Created**: 2026-03-24  
**Status**: Draft  
**Input**: User description: "Crea el módulo de Reporte de Ventas Diarias en formato PDF. Requisitos: Filtro por fecha, cálculo de IVA del 19%, y listado de productos de panadería vendidos. Usa iText para el PDF y asegúrate de que el contrato incluya la consulta a Oracle mediante un Procedimiento Almacenado."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Generate Daily Sales Report (Priority: P1)

As a store manager or accountant, I want to generate a PDF report of daily bakery sales so that I can review the day's transactions and financial summary.

**Why this priority**: This is the core functionality of the module - without the ability to generate the PDF report, the entire feature is non-functional. All other features are enhancements to this primary use case.

**Independent Test**: Can be fully tested by selecting a date and generating the PDF. Delivers a complete downloadable PDF with sales data for that specific day.

**Acceptance Scenarios**:

1. **Given** the user has selected a valid date, **When** they request the sales report, **Then** the system generates a PDF containing all bakery product sales for that date
2. **Given** the user has selected a date with no sales, **When** they request the sales report, **Then** the system generates a PDF with zero sales items and appropriate message
3. **Given** the user has entered an invalid date format, **When** they attempt to generate the report, **Then** the system displays an error message and does not generate the PDF

---

### User Story 2 - Filter Report by Date (Priority: P2)

As a store manager, I want to be able to select a specific date for the report so that I can view sales for any given day.

**Why this priority**: Allows flexibility in report generation. Users need to specify which day's sales to report on. This is a prerequisite for generating any meaningful report.

**Independent Test**: Can be tested by selecting different dates and verifying the PDF reflects sales only for the selected date.

**Acceptance Scenarios**:

1. **Given** a valid date in the past, **When** the user selects that date, **Then** the report contains only sales from that specific date
2. **Given** a future date, **When** the user selects that date, **Then** the report shows zero sales with a note indicating no sales data for that date

---

### User Story 3 - View VAT Breakdown (Priority: P2)

As a store manager or accountant, I want to see the VAT (IVA) calculation in the report so that I can verify tax compliance and financial accuracy.

**Why this priority**: Tax calculation is a critical component of any sales report. The 19% VAT must be clearly displayed for accounting and compliance purposes.

**Independent Test**: Can be verified by generating a report with known sales amounts and confirming the VAT calculation is correct (subtotal × 19%).

**Acceptance Scenarios**:

1. **Given** a sale of $100, **When** the report is generated, **Then** the VAT amount shows $19 (19% of $100)
2. **Given** multiple sales totaling $500, **When** the report is generated, **Then** the VAT shows $95 (19% of $500) and total shows $595

---

### User Story 4 - View Product Details (Priority: P3)

As a store manager, I want to see a detailed list of each bakery product sold in the report so that I can analyze product performance.

**Why this priority**: Provides visibility into which products are selling well. Helps with inventory planning and business decisions.

**Independent Test**: Can be verified by generating a report and checking that all products sold on that date are listed with correct quantities and prices.

**Acceptance Scenarios**:

1. **Given** multiple products sold on a date, **When** the report is generated, **Then** each product appears with its name, quantity sold, unit price, and total
2. **Given** products with the same name sold at different times, **When** the report is generated, **Then** they are consolidated under a single line item with total quantity

---

### Edge Cases

- What happens when the Oracle database is unavailable?
- What happens when the stored procedure returns an error?
- How does the system handle extremely large sales volumes (performance)?
- What happens when there are decimal rounding issues in VAT calculations?
- How is the report formatted if product names are very long?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to select a specific date for report generation
- **FR-002**: System MUST generate a PDF document containing the daily sales report
- **FR-003**: System MUST retrieve sales data from the Oracle database via a stored procedure
- **FR-004**: System MUST list all bakery products sold on the selected date with quantity and price
- **FR-005**: System MUST calculate and display subtotal (sum of all product totals)
- **FR-006**: System MUST calculate and display VAT at 19% rate
- **FR-007**: System MUST display the grand total (subtotal + VAT)
- **FR-008**: System MUST validate date input before generating the report
- **FR-009**: System MUST return an appropriate error message if no sales data exists for the selected date
- **FR-010**: System MUST return an error if the database connection fails

### Key Entities *(include if feature involves data)*

- **Sales Report**: Represents the generated PDF report containing sales data for a specific date
- **Sales Line Item**: Individual product entry in the report with product name, quantity, unit price, and total
- **VAT Calculation**: The 19% tax applied to the subtotal
- **Date Filter**: The selected date used to retrieve sales data

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can generate a PDF report for any selected date within 5 seconds
- **SC-002**: The PDF report displays all bakery products sold on the selected date with accurate quantities and prices
- **SC-003**: VAT calculation is mathematically correct (exactly 19% of subtotal) for all transactions
- **SC-004**: The report is downloadable as a properly formatted PDF file
- **SC-005**: Users receive clear error messages when no data exists or when errors occur
- **SC-006**: The stored procedure successfully retrieves sales data from the Oracle database

## Assumptions

- Users have appropriate permissions to generate reports (authenticated users)
- The Oracle database is accessible and contains sales transaction data
- The stored procedure already exists or will be created as part of this feature
- PDF reports should include header with company name, report title, and date
- PDF reports should include footer with generation timestamp
- Product prices in the database include the base price (VAT will be calculated on top)
