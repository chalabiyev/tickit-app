# ── Stage 1: Build ────────────────────────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Сначала копируем только pom.xml — кешируем зависимости отдельно.
# Пока код не менялся, этот слой не перестраивается.
COPY pom.xml .
RUN mvn dependency:go-offline -q

COPY src ./src
RUN mvn clean package -DskipTests -q

# ── Stage 2: Run ──────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Создаём папку для загруженных файлов
RUN mkdir -p /app/uploads

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

# Активируем prod профиль — читает application-prod.properties
# Все секреты (MONGODB_URI, JWT_SECRET и т.д.) передаются через env vars при запуске
ENTRYPOINT ["java", \
  "-Dspring.profiles.active=prod", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-jar", "app.jar"]