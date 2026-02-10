# Test App

En enkel form-applikation med HTML-frontend och .NET Core backend. Sparar formulärdata i SQLite-databas.

## Arkitektur

```
┌─────────────────┐
│   HTML Form     │ (localhost:5298 - static)
│  (Frontend)     │
└────────┬────────┘
         │ (HTTP)
         ▼
┌─────────────────┐
│  .NET Core API  │ (localhost:5298 - /api/)
│   (Backend)     │
└────────┬────────┘
         │ (Entity Framework)
         ▼
┌─────────────────┐
│     SQLite      │ (formdata.db)
│   (Database)    │
└─────────────────┘
```

## Snabbstart

### Option 1: Docker Compose (rekommenderad)

```bash
# Klona repot
git clone https://github.com/gothiaai/Test.git
cd Test

# Starta alla tjänster
docker compose up

# Öppna i webbläsare
open http://localhost:5298
```

Det är det. Backend + databas startar automatiskt.

### Option 2: Manuell setup (utan Docker)

**Krav:**
- .NET 9 SDK (https://dotnet.microsoft.com/download)

**Steg:**

```bash
# Klona repot
git clone https://github.com/gothiaai/Test.git
cd Test

# Starta backend
dotnet run

# I en annan terminal, servera frontend
cd wwwroot
python -m http.server 5298
# eller med Node.js:
# npx http-server -p 5298
```

Sedan öppna: `http://localhost:5298`

## Hur det fungerar

1. **HTML-form** (`wwwroot/index.html`)
   - Användarens namn, email, meddelande
   - Visar tidigare inlagor

2. **API-endpoints** (Backend)
   - `POST /api/submissions` - Spara nytt formulär
   - `GET /api/submissions` - Hämta alla inlagor
   - `GET /api/health` - Health check

3. **Database** (SQLite)
   - Skapad automatiskt första gången
   - Lagrar: Id, Name, Email, Message, CreatedAt

## Fil-struktur

```
Test/
├── Program.cs                # Backend (ASP.NET Core)
├── TestApp.csproj           # .NET projekt-fil
├── Dockerfile               # Docker image definition
├── docker-compose.yml       # Docker Compose config
├── .gitignore
├── README.md               # (Du är här)
└── wwwroot/
    └── index.html          # HTML-frontend + JavaScript
```

## Konfiguration

### Databaskonfiguration

Ändra connection string i `Program.cs`:

```csharp
builder.Services.AddDbContext<FormDataContext>(options =>
    options.UseSqlite("Data Source=formdata.db"));
```

Standard använder SQLite (lokalt i `formdata.db`). För att byta till PostgreSQL:

```csharp
builder.Services.AddDbContext<FormDataContext>(options =>
    options.UseNpgsql("Host=localhost;Database=testapp;Username=postgres;Password=password"));
```

### API CORS

Frontend och backend kan köra på olika portar under dev. CORS är redan konfigurerad:

```csharp
options.AddPolicy("AllowAll", policy =>
{
    policy.AllowAnyOrigin()
          .AllowAnyMethod()
          .AllowAnyHeader();
});
```

Ändra detta för production.

## Development

### Med Docker Compose

```bash
# Starta med hot reload
docker compose up

# Backend restartar automatiskt när du ändrar Program.cs
# Öppna http://localhost:5298 i webbläsare
```

### Manuellt

```bash
# Terminal 1: Backend med hot reload
dotnet watch run

# Terminal 2: Frontend
cd wwwroot
python -m http.server 5298
```

## API-dokumentation

Swagger UI är tillgänglig på: `http://localhost:5298/swagger`

### Endpoints

**POST /api/submissions**

Spara ett nytt formulär-inlägg.

Request:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello world"
}
```

Response (201 Created):
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello world",
  "createdAt": "2026-02-10T17:03:00Z"
}
```

---

**GET /api/submissions**

Hämta alla inlagor sorterade senast först.

Response (200 OK):
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "message": "Hello world",
    "createdAt": "2026-02-10T17:03:00Z"
  }
]
```

---

**GET /api/health**

Health check.

Response (200 OK):
```json
{
  "status": "ok"
}
```

## Databaskonfiguration

Databasen skapas automatiskt första gången appen startar (`EnsureCreated()`).

**Schema:**

```sql
CREATE TABLE Submissions (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL (max 255),
    Email TEXT NOT NULL (max 255),
    Message TEXT (max 1000),
    CreatedAt TIMESTAMP NOT NULL
);
```

## Deployment

### Till ett public server (t.ex. Linux VPS)

1. Installera .NET 9 runtime på servern
2. Clone repot
3. Bygga release:
   ```bash
   dotnet publish -c Release
   ```
4. Starta från `bin/Release/net9.0/publish/`

Eller använd Docker:
```bash
docker build -t test-app .
docker run -p 5298:8080 test-app
```

## Felsökning

### "API is not available"
- Kontrollera att backend körs på `localhost:5298`
- Slå på Swagger UI och testa endpoints: `http://localhost:5298/swagger`

### "Could not connect to database"
- SQLite-filen `formdata.db` måste ha write-permission
- Kontrollera att du kör från rätt katalog

### Port redan i bruk
- Ändra port i `docker-compose.yml` eller starta manuellt med annan port:
  ```bash
  dotnet run --urls="http://localhost:5299"
  ```

## Todo

- [ ] Validering på frontend (redan på backend)
- [ ] Redigering/radering av inlagor
- [ ] Siduppdelning för många inlagor
- [ ] Export till CSV
- [ ] Email-notifikation vid nytt inlägg

## Licens

MIT

## Support

Fler frågor? Slå på Swagger UI (`/swagger`) för interaktiv API-dokumentation.
