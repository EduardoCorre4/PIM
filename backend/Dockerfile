# syntax=docker/dockerfile:1
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
# Copia só os .csproj primeiro: a restauração de pacotes fica em cache enquanto as dependências não mudam.
COPY src/Jake.Domain/*.csproj src/Jake.Domain/
COPY src/Jake.Repository/*.csproj src/Jake.Repository/
COPY src/Jake.Service/*.csproj src/Jake.Service/
COPY src/Jake.Api/*.csproj src/Jake.Api/
RUN dotnet restore src/Jake.Api/Jake.Api.csproj
COPY src/ src/
RUN dotnet publish src/Jake.Api/Jake.Api.csproj -c Release -o /app --no-restore /p:UseAppHost=false

# Imagem final: só o runtime (sem SDK), usuário sem privilégios, sistema de arquivos pode ser somente leitura.
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
ARG VERSION=dev
ARG REVISION=unknown
LABEL org.opencontainers.image.title="jake-api" \
      org.opencontainers.image.version="$VERSION" \
      org.opencontainers.image.revision="$REVISION"
WORKDIR /app
COPY --from=build /app .
ENV ASPNETCORE_URLS=http://+:8080 \
    DOTNET_EnableDiagnostics=0
EXPOSE 8080
USER $APP_UID
ENTRYPOINT ["dotnet", "Jake.Api.dll"]
