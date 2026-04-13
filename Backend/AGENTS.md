# Thin Wallet - AGENTS.md

## Build, Lint & Test Commands

### Maven (Java 17+)
```bash
# Build
./mvnw clean package -DskipTests

# Run single test
./mvnw test -Dtest=UserServiceTest

# Run specific test method
./mvnw test -Dtest=UserServiceTest#createUser_ShouldThrowException_WhenEmailExists

# Run tests with pattern
./mvnw test -Dtest="*ServiceTest"

# Run all tests
./mvnw test

# Lint (checkstyle)
./mvnw checkstyle:check

# Full verify (tests + lint)
./mvnw verify
```

## Code Style Guidelines

### 1. Project Structure (Domain-Driven)
```
src/main/java/com/thinwallet/
├── config/           # Spring configurations
├── controller/       # REST controllers (v1/)
├── service/          # Business logic
├── repository/       # Data access (JPA)
├── entity/           # JPA entities
├── dto/              # Data Transfer Objects
├── mapper/           # DTO <-> Entity mappers
├── exception/        # Custom exceptions
├── security/         # OAuth2, JWT, filters
└── util/             # Constants, helpers
```

### 2. Naming Conventions
- **Classes**: PascalCase (`UserService`, `TransactionController`)
- **Methods**: camelCase (`findById`, `createUser`)
- **Variables**: camelCase (`userRepository`, `balanceAmount`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`)
- **Packages**: lowercase, single words or grouped (`user`, `circle`, `transaction`)
- **DTOs**: `{Entity}Request`, `{Entity}Response`, `{Entity}DTO`
- **Tests**: `{ClassName}Test` (`UserServiceTest`)

### 3. Imports Organization (IntelliJ/Google Style)
```java
// 1. java/javax
// 2. org.springframework
// 3. com.thinwallet (project)
// 4. org.apache (commons)
// 5. static imports
```

### 4. Controller Best Practices
- Use `@RestController` with `@RequestMapping("/api/v1")`
- Always annotate with `@Validated` for validation
- Use `@Valid` on request bodies
- Return `ResponseEntity<T>` consistently
- Document with OpenAPI/Swagger annotations

```java
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.findById(id));
    }
}
```

### 5. Service Layer Rules
- Use `@Service` annotation
- Mark transactions with `@Transactional(readOnly = true)` at class level
- Override with `@Transactional` for write operations
- Never expose entities directly; use DTOs
- Log with Lombok's `@Slf4j`

```java
@Service
@Slf4j
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @Transactional(readOnly = true)
    public UserResponse findById(Long id) {
        return userMapper.toResponse(
            userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id))
        );
    }
}
```

### 6. Repository Layer
- Extend `JpaRepository<Entity, Long>`
- Use method naming conventions (`findByEmail`)
- Use `@Query` for complex queries
- Never include business logic

### 7. DTOs & Mappers
- Use Lombok `@Data` or records (Java 17+)
- Use MapStruct or manual mappers
- Validate DTOs with Jakarta Bean Validation

```java
public record UserRequest(
    @NotBlank @Email String email,
    @NotBlank String name,
    @NotNull Role role
) {}
```

### 8. Error Handling Strategy
- Use `@ControllerAdvice` for global exception handling
- Create custom exceptions extending `RuntimeException`
- Return consistent error response structure

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(UserNotFoundException ex) {
        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse("USER_NOT_FOUND", ex.getMessage()));
    }
}
```

### 9. Validation Annotations
Use Jakarta Bean Validation on DTOs:
- `@NotNull`, `@NotBlank`, `@NotEmpty`
- `@Email`, `@Size`, `@Pattern`
- `@Min`, `@Max`, `@DecimalMin`
- Custom validators for business rules

### 10. Logging Standards
- Use `log.info()` for business operations
- Use `log.debug()` for development details
- Never log sensitive data (passwords, tokens)
- Include correlation IDs for tracing

### 11. Response Wrapper Pattern
```java
public record ApiResponse<T>(
    boolean success,
    String message,
    T data,
    List<ErrorDetail> errors
) {
    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, "Success", data, null);
    }
}
```

### 12. Pagination
```java
public record PagedResponse<T>(
    List<T> content,
    int page,
    int size,
    long totalElements,
    int totalPages
) {}
```

### 13. Database Conventions
- Use `@Column(updatable = false)` for audit fields
- Implement Soft Delete with `@SQLDelete` and `@Where`
- Use `createdAt`, `updatedAt` with `@CreationTimestamp`, `@UpdateTimestamp`
- Index foreign keys and frequently queried columns

### 14. Security (OAuth2)
- Protect endpoints with `@PreAuthorize`
- Use JWT tokens for stateless auth
- Validate scopes/roles on sensitive operations

### 15. Testing Strategy
- Unit tests: Service layer with Mockito
- Integration tests: Controller with MockMvc
- Use `@DataJpaTest` for repository tests
- Test exception paths

### 16. Code Review Checklist
- [ ] No TODO/FIXME in production code
- [ ] All exceptions are handled
- [ ] No hardcoded strings (use constants)
- [ ] Sensitive data not logged
- [ ] Transactions properly scoped
- [ ] Indexes for query performance

---

*Last updated: March 2026*

## Active Technologies
- Java 17 + Spring Boot 3.x, iText 7.x (PDF generation), Oracle JDBC driver (001-daily-sales-pdf)
- Oracle Database (via stored procedure) (001-daily-sales-pdf)

## Recent Changes
- 001-daily-sales-pdf: Added Java 17 + Spring Boot 3.x, iText 7.x (PDF generation), Oracle JDBC driver
