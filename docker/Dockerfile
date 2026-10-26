FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS build
WORKDIR /source

COPY .editorconfig global.json Directory.Build.props Directory.Packages.props Slotly.sln ./
COPY src/Slotly.Domain/Slotly.Domain.csproj src/Slotly.Domain/
COPY src/Slotly.Application/Slotly.Application.csproj src/Slotly.Application/
COPY src/Slotly.Infrastructure/Slotly.Infrastructure.csproj src/Slotly.Infrastructure/
COPY src/Slotly.Api/Slotly.Api.csproj src/Slotly.Api/
RUN dotnet restore src/Slotly.Api/Slotly.Api.csproj

COPY src/ src/
RUN dotnet publish src/Slotly.Api/Slotly.Api.csproj \
    --configuration Release \
    --no-restore \
    --output /app/publish \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS final
RUN apk add --no-cache tzdata \
    && addgroup -S -g 10001 slotly \
    && adduser -S -u 10001 -G slotly -h /app slotly

WORKDIR /app
COPY --from=build --chown=slotly:slotly /app/publish .

ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
USER slotly

ENTRYPOINT ["dotnet", "Slotly.Api.dll"]
