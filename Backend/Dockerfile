# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -q
COPY src ./src
RUN mvn package -DskipTests -q

# ── Stage 2: Runtime + Tailscale ─────────────────────────────────────────────
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Instalar Tailscale + herramientas de red
RUN apt-get update && \
    apt-get install -y curl iptables iproute2 && \
    curl -fsSL https://tailscale.com/install.sh | sh && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/*.jar app.jar
COPY start.sh .
RUN chmod +x start.sh

EXPOSE 8080
ENTRYPOINT ["./start.sh"]
