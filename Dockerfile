FROM mcr.microsoft.com/dotnet/sdk:9.0

WORKDIR /app

# Copy project file
COPY TestApp.csproj .

# Restore dependencies
RUN dotnet restore

# Copy source code
COPY Program.cs .
COPY wwwroot/ wwwroot/

# Expose port
EXPOSE 8080

# Run app
CMD ["dotnet", "run"]
