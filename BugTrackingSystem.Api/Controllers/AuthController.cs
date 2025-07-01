using BugTrackingSystem.Api.Data;
using BugTrackingSystem.Api.DTOs;
using BugTrackingSystem.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using BCrypt.Net; // For password verification

namespace BugTrackingSystem.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration; // To access appsettings.json for JWT secret key

        public AuthController(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        // POST: api/Auth/login
        // Handles user login and issues a JWT upon successful authentication
        [HttpPost("login")]
        public async Task<ActionResult<string>> Login([FromBody] LoginRequest request)
        {
            // 1. Find the employee by username
            var employee = await _context.Employees
                .FirstOrDefaultAsync(e => e.Username == request.Username);

            // 2. Check if employee exists and password is correct
            if (employee == null || !BCrypt.Net.BCrypt.Verify(request.Password, employee.PasswordHash))
            {
                // Return 401 Unauthorized if credentials are invalid
                return Unauthorized("Invalid username or password.");
            }

            // 3. If credentials are valid, generate a JWT
            var token = GenerateJwtToken(employee);

            // Return the JWT as a string
            return Ok(token);
        }

        // Helper method to generate the JWT
        private string GenerateJwtToken(Employee employee)
        {
            // Get the JWT secret key from configuration (appsettings.json)
            var jwtSecret = _configuration["Jwt:Key"];
            if (string.IsNullOrEmpty(jwtSecret))
            {
                // This should ideally be handled during application startup configuration validation
                throw new InvalidOperationException("JWT Secret Key is not configured.");
            }

            // Convert the secret key to bytes
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));
            // Create signing credentials using HMAC SHA256
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            // Define claims for the token (e.g., EmployeeId, Username, Role)
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, employee.EmployeeId.ToString()), // User ID
                new Claim(ClaimTypes.Name, employee.Username), // Username
                new Claim(ClaimTypes.Role, employee.Role) // User Role
            };

            // Define token expiration (e.g., 7 days from now)
            var expires = DateTime.UtcNow.AddDays(7);

            // Create the JWT token
            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"], // Issuer (e.g., your API URL)
                audience: _configuration["Jwt:Audience"], // Audience (e.g., your frontend URL)
                claims: claims,
                expires: expires,
                signingCredentials: creds
            );

            // Write the token to a string
            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
