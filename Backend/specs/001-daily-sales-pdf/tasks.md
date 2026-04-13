---

description: "Task list for Daily Sales PDF Report Module implementation"
---

# Tasks: Daily Sales PDF Report

**Input**: Design documents from `/specs/001-daily-sales-pdf/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), data-model.md, contracts/sales-report-api.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Java project: `src/main/java/com/thinwallet/`, `src/test/java/com/thinwallet/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependency configuration

- [X] T001 Configure iText 7.x dependency in pom.xml
- [X] T002 Configure Oracle JDBC driver in pom.xml
- [X] T003 Add Oracle connection properties to application.properties
- [X] T004 [P] Create OracleDataSourceConfig.java in src/main/java/com/thinwallet/config/

---

## Phase 2: DTO Layer (Priority: HIGHEST)

**Purpose**: Create data transfer objects as specified in data-model.md

- [X] T005 [P] [US1] Create SalesReportRequest.java in src/main/java/com/thinwallet/dto/
- [X] T006 [P] [US1] Create SalesLineItem.java in src/main/java/com/thinwallet/dto/
- [X] T007 [US1] Create SalesReportResponse.java in src/main/java/com/thinwallet/dto/

---

## Phase 3: Exception Handling

**Purpose**: Custom exceptions for database and validation errors

- [X] T008 [P] Create DatabaseConnectionException.java in src/main/java/com/thinwallet/exception/
- [X] T009 [P] Create StoredProcedureException.java in src/main/java/com/thinwallet/exception/
- [X] T010 Create GlobalExceptionHandler.java in src/main/java/com/thinwallet/exception/

---

## Phase 4: Repository Layer (SP Mapping)

**Purpose**: Map and call Oracle stored procedure

- [X] T011 [US1] Create SalesReportRepository.java in src/main/java/com/thinwallet/repository/
- [X] T012 [US1] Implement SP_GET_DAILY_SALES mapping in repository

---

## Phase 5: PDF Generator

**Purpose**: Generate PDF document using iText

- [X] T013 [P] Create SalesReportPdfGenerator.java in src/main/java/com/thinwallet/pdf/

---

## Phase 6: Service Layer (Business Logic)

**Purpose**: Implement business logic and PDF generation service

- [X] T014 [US1] Create SalesReportService.java in src/main/java/com/thinwallet/service/
- [X] T015 [US1] Implement VAT calculation (19%) in service
- [X] T016 [US1] Implement PDF generation integration in service

---

## Phase 7: Controller Layer (REST API)

**Purpose**: Expose REST endpoint for report generation

- [X] T017 [US1] Create SalesReportController.java in src/main/java/com/thinwallet/controller/

---

## Phase 8: Testing

**Purpose**: Verify implementation with unit and integration tests

- [X] T018 [P] Create SalesReportServiceTest.java in src/test/java/com/thinwallet/service/
- [X] T019 Create SalesReportControllerTest.java in src/test/java/com/thinwallet/controller/

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final integration and documentation

- [ ] T020 Update README with endpoint documentation
- [ ] T021 Run ./mvnw verify to ensure all checks pass
- [ ] T022 [P] Create integration test with Oracle database

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **DTO Layer (Phase 2)**: Depends on Setup - BLOCKS all other phases
- **Exceptions (Phase 3)**: Independent of DTO, can run parallel after Setup
- **Repository (Phase 4)**: Depends on DTO Layer completion
- **PDF Generator (Phase 5)**: Independent - can run parallel to Repository
- **Service (Phase 6)**: Depends on DTO, Repository, PDF Generator
- **Controller (Phase 7)**: Depends on Service completion
- **Testing (Phase 8)**: Depends on Controller completion
- **Polish (Phase 9)**: Depends on all phases complete

### Priority Order (as requested)

1. Phase 2: DTO Layer (T005-T007) - HIGHEST
2. Phase 4: Repository/SP Mapping (T011-T012)
3. Phase 6: Service Layer (T014-T016)
4. Phase 7: Controller (T017)

---

## Parallel Example: DTO Phase

```bash
# Launch all DTOs in parallel:
Task: "Create SalesReportRequest.java in src/main/java/com/thinwallet/dto/"
Task: "Create SalesLineItem.java in src/main/java/com/thinwallet/dto/"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: DTO Layer
3. Complete Phase 3: Exception Handling
4. Complete Phase 4: Repository
5. Complete Phase 5: PDF Generator
6. Complete Phase 6: Service
7. Complete Phase 7: Controller
8. **STOP and VALIDATE**: Test endpoint with date parameter

### Incremental Delivery

1. Complete Setup + DTO → Data layer ready
2. Add Repository → Database integration works
3. Add PDF Generator → PDF creation works
4. Add Service → Business logic integrated
5. Add Controller → API endpoint available

---

## Notes

- [P] tasks = different files, no dependencies
- DTOs are the foundation - complete Phase 2 first
- Service combines business logic + PDF generation
- Controller follows API-First design (constitution principle II)
- Use @Slf4j for logging (constitution principle V)
