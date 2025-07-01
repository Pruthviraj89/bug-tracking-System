using BugTrackingSystem.Api.Data;
using BugTrackingSystem.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using BCrypt.Net;
using Microsoft.AspNetCore.Authorization;
using System.Linq; // Required for .CountAsync()

namespace BugTrackingSystem.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Apply [Authorize] to the entire controller. All actions require authentication.
    public class EmployeesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public EmployeesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Employees
        // Only Administrators can view all employees
        [HttpGet]
        [Authorize(Roles = "Administrator")] // Only users with the "Administrator" role can access this
        public async Task<ActionResult<IEnumerable<Employee>>> GetEmployees()
        {
            return await _context.Employees
                .Select(e => new Employee
                {
                    EmployeeId = e.EmployeeId,
                    Username = e.Username,
                    Email = e.Email,
                    Role = e.Role,
                    FirstName = e.FirstName,
                    LastName = e.LastName,
                    CreatedAt = e.CreatedAt,
                    UpdatedAt = e.UpdatedAt
                })
                .ToListAsync();
        }

        // GET: api/Employees/5
        // Only Administrators can view a specific employee
        [HttpGet("{id}")]
        [Authorize(Roles = "Administrator")]
        public async Task<ActionResult<Employee>> GetEmployee(int id)
        {
            var employee = await _context.Employees.FindAsync(id);

            if (employee == null)
            {
                return NotFound();
            }

            return new Employee
            {
                EmployeeId = employee.EmployeeId,
                Username = employee.Username,
                Email = employee.Email,
                Role = employee.Role,
                FirstName = employee.FirstName,
                LastName = employee.LastName,
                CreatedAt = employee.CreatedAt,
                UpdatedAt = employee.UpdatedAt
            };
        }

        // POST: api/Employees
        // Only Administrators can create new employees
        [HttpPost]
        [Authorize(Roles = "Administrator")]
        public async Task<ActionResult<Employee>> PostEmployee(Employee employee)
        {
            employee.PasswordHash = BCrypt.Net.BCrypt.HashPassword(employee.PasswordHash);
            employee.CreatedAt = DateTime.UtcNow;
            employee.UpdatedAt = DateTime.UtcNow;

            _context.Employees.Add(employee);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetEmployee), new { id = employee.EmployeeId }, new Employee
            {
                EmployeeId = employee.EmployeeId,
                Username = employee.Username,
                Email = employee.Email,
                Role = employee.Role,
                FirstName = employee.FirstName,
                LastName = employee.LastName,
                CreatedAt = employee.CreatedAt,
                UpdatedAt = employee.UpdatedAt
            });
        }

        // PUT: api/Employees/5
        // Only Administrators can update employees
        [HttpPut("{id}")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> PutEmployee(int id, Employee employee)
        {
            if (id != employee.EmployeeId)
            {
                return BadRequest();
            }

            var existingEmployee = await _context.Employees.FindAsync(id);
            if (existingEmployee == null)
            {
                return NotFound();
            }

            existingEmployee.Username = employee.Username;
            existingEmployee.Email = employee.Email;
            existingEmployee.Role = employee.Role;
            existingEmployee.FirstName = employee.FirstName;
            existingEmployee.LastName = employee.LastName;
            existingEmployee.UpdatedAt = DateTime.UtcNow;

            if (!string.IsNullOrEmpty(employee.PasswordHash))
            {
                existingEmployee.PasswordHash = BCrypt.Net.BCrypt.HashPassword(employee.PasswordHash);
            }

            _context.Entry(existingEmployee).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!EmployeeExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/Employees/5
        // Only Administrators can delete employees
        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> DeleteEmployee(int id)
        {
            var employeeToDelete = await _context.Employees.FindAsync(id);
            if (employeeToDelete == null)
            {
                return NotFound();
            }

            // CRITICAL SAFEGUARD: Prevent deleting the last Administrator account
            if (employeeToDelete.Role == "Administrator")
            {
                var adminCount = await _context.Employees.CountAsync(e => e.Role == "Administrator");
                if (adminCount <= 1) // If there's 1 or fewer admins, prevent deletion
                {
                    return BadRequest("Cannot delete the last Administrator account. At least one Administrator must remain in the system.");
                }
            }

            _context.Employees.Remove(employeeToDelete);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // Helper method to check if an employee exists
        private bool EmployeeExists(int id)
        {
            return _context.Employees.Any(e => e.EmployeeId == id);
        }
    }
}
