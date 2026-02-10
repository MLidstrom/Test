using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

var builder = WebApplication.CreateBuilder(args);

// Register DbContext
builder.Services.AddDbContext<FormDataContext>(options =>
    options.UseSqlite("Data Source=formdata.db"));

// Enable CORS for local development
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Middleware
app.UseCors("AllowAll");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Create database if it doesn't exist
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<FormDataContext>();
    db.Database.EnsureCreated();
}

// Health check
app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }))
    .WithName("Health")
    .WithOpenApi();

// Get all submissions
app.MapGet("/api/submissions", async (FormDataContext db) =>
{
    var submissions = await db.Submissions.OrderByDescending(s => s.CreatedAt).ToListAsync();
    return Results.Ok(submissions);
})
.WithName("GetSubmissions")
.WithOpenApi();

// Post new submission
app.MapPost("/api/submissions", async (CreateSubmissionRequest request, FormDataContext db) =>
{
    if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Email))
    {
        return Results.BadRequest(new { error = "Name and Email are required" });
    }

    var submission = new FormSubmission
    {
        Name = request.Name,
        Email = request.Email,
        Message = request.Message ?? "",
        CreatedAt = DateTime.UtcNow
    };

    db.Submissions.Add(submission);
    await db.SaveChangesAsync();

    return Results.Created($"/api/submissions/{submission.Id}", submission);
})
.WithName("CreateSubmission")
.WithOpenApi();

app.Run();

// Models
public class FormSubmission
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string Email { get; set; }
    public string Message { get; set; } = "";
    public DateTime CreatedAt { get; set; }
}

public class CreateSubmissionRequest
{
    public required string Name { get; set; }
    public required string Email { get; set; }
    public string? Message { get; set; }
}

// DbContext
public class FormDataContext : DbContext
{
    public FormDataContext(DbContextOptions<FormDataContext> options) : base(options) { }

    public DbSet<FormSubmission> Submissions { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<FormSubmission>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Message).HasMaxLength(1000);
            entity.Property(e => e.CreatedAt).IsRequired();
        });
    }
}
