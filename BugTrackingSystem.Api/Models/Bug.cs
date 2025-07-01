using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BugTrackingSystem.Api.Models
{
    public class Bug
    {
        // Primary Key for the Bug table
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int BugId { get; set; }

        // Name or title of the bug
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        // Detailed description of the bug
        [Required]
        public string Description { get; set; } = string.Empty;

        // Foreign Key to the Employee who reported this bug
        [Required]
        public int ReportedById { get; set; }

        // Navigation property to the Employee who reported the bug
        // This allows EF Core to automatically load the related Employee object
        [ForeignKey("ReportedById")]
        public Employee? ReportedBy { get; set; }

        // Current status of the bug (e.g., "New", "Assigned", "Resolved", "Closed")
        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "New"; // Default status for new bugs

        // Foreign Key to the Employee (programmer) assigned to this bug
        // Nullable because a bug might not be assigned yet
        public int? AssignedToId { get; set; }

        // Navigation property to the Employee assigned to the bug
        [ForeignKey("AssignedToId")]
        public Employee? AssignedTo { get; set; } // Nullable

        // Timestamp for when the bug was reported
        public DateTime ReportedAt { get; set; } = DateTime.UtcNow;

        // Timestamp for when the bug was assigned (nullable)
        public DateTime? AssignedAt { get; set; } // Nullable DateTime

        // Timestamp for the last modification to the bug
        public DateTime LastModifiedAt { get; set; } = DateTime.UtcNow;

        // Flag indicating if the bug can be modified by the reporter
        // Set to false when assigned
        public bool IsModifiable { get; set; } = true; // Default to true for new bugs
    }
}
