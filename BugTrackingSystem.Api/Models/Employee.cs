using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BugTrackingSystem.Api.Models
{
    public class Employee
    {
        // Primary Key for the Employee table
        [Key]
        // DatabaseGeneratedOption.Identity ensures the database generates the ID
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int EmployeeId { get; set; }

        // Username for login, must be unique
        [Required] // This makes the field mandatory
        [MaxLength(50)] // Sets a maximum length for the string
        public string Username { get; set; } = string.Empty;

        // Hashed password for security. NEVER store plain passwords!
        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        // Employee's email address (optional)
        [MaxLength(100)]
        public string? Email { get; set; } // Nullable string

        // Role of the employee (e.g., "Administrator", "Tester", "Programmer")
        [Required]
        [MaxLength(20)]
        public string Role { get; set; } = string.Empty;

        // Employee's first name
        [Required]
        [MaxLength(50)]
        public string FirstName { get; set; } = string.Empty;

        // Employee's last name
        [Required]
        [MaxLength(50)]
        public string LastName { get; set; } = string.Empty;

        // Timestamp for when the account was created
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow; // Default to current UTC time

        // Timestamp for the last update to the account
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow; // Default to current UTC time
    }
}
