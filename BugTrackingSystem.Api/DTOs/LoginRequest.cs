using System.ComponentModel.DataAnnotations;

namespace BugTrackingSystem.Api.DTOs
{
    // Data Transfer Object for handling login requests
    public class LoginRequest
    {
        [Required] // Username is a mandatory field
        public string Username { get; set; } = string.Empty;

        [Required] // Password is a mandatory field
        public string Password { get; set; } = string.Empty;
    }
}
