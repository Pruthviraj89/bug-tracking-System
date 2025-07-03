using BugTrackingSystem.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BugTrackingSystem.Api.Data
{
    // ApplicationDbContext inherits from DbContext, which is provided by Entity Framework Core
    public class ApplicationDbContext : DbContext
    {
        // Constructor that takes DbContextOptions. This is how you configure the database connection.
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        // DbSet properties represent the tables in your database.
        // Each DbSet corresponds to one of your model classes.
        public DbSet<Employee> Employees { get; set; }
        public DbSet<Bug> Bugs { get; set; }

        // This method is used to configure the model that is being created.
        // We can use it to define constraints or relationships not covered by attributes.
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Ensure Username is unique
            modelBuilder.Entity<Employee>()
                .HasIndex(e => e.Username)
                .IsUnique();

            // Define the relationship for ReportedBy
            // An Employee can report many Bugs (one-to-many)
            modelBuilder.Entity<Bug>()
                .HasOne(b => b.ReportedBy) // A Bug has one ReportedBy Employee
                .WithMany() // An Employee can be ReportedBy for many Bugs
                .HasForeignKey(b => b.ReportedById) // The foreign key in the Bug table
                .OnDelete(DeleteBehavior.Restrict); // Prevent cascading deletes (e.g., deleting an employee shouldn't delete their reported bugs automatically)

            // Define the relationship for AssignedTo
            // An Employee can be AssignedTo many Bugs (one-to-many)
            modelBuilder.Entity<Bug>()
                .HasOne(b => b.AssignedTo) // A Bug has one AssignedTo Employee
                .WithMany() // An Employee can be AssignedTo for many Bugs
                .HasForeignKey(b => b.AssignedToId) // The foreign key in the Bug table
                .IsRequired(false) // AssignedToId is nullable
                .OnDelete(DeleteBehavior.Restrict); // Prevent cascading deletes
        }
    }
}
