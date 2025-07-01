using BugTrackingSystem.Api.Data;
using BugTrackingSystem.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization; // Required for [Authorize]
using System.Security.Claims; // Required to access user claims

namespace BugTrackingSystem.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // All actions in this controller require authentication by default
    public class BugsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public BugsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // Helper to get current authenticated user's ID
        private int GetCurrentUserId()
        {
            // The NameIdentifier claim (ClaimTypes.NameIdentifier) holds the EmployeeId
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                // This should ideally not happen if [Authorize] is working correctly
                throw new UnauthorizedAccessException("User ID not found or invalid in token.");
            }
            return userId;
        }

        // Helper to get current authenticated user's Role
        private string GetCurrentUserRole()
        {
            var roleClaim = User.FindFirst(ClaimTypes.Role);
            if (roleClaim == null)
            {
                throw new UnauthorizedAccessException("User role not found in token.");
            }
            return roleClaim.Value;
        }

        // GET: api/Bugs
        // All authenticated users can view bugs
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Bug>>> GetBugs()
        {
            return await _context.Bugs
                .Include(b => b.ReportedBy)
                .Include(b => b.AssignedTo)
                .Select(b => new Bug
                {
                    BugId = b.BugId,
                    Name = b.Name,
                    Description = b.Description,
                    ReportedById = b.ReportedById,
                    ReportedBy = b.ReportedBy != null ? new Employee
                    {
                        EmployeeId = b.ReportedBy.EmployeeId,
                        Username = b.ReportedBy.Username,
                        FirstName = b.ReportedBy.FirstName,
                        LastName = b.ReportedBy.LastName,
                        Role = b.ReportedBy.Role
                    } : null,
                    Status = b.Status,
                    AssignedToId = b.AssignedToId,
                    AssignedTo = b.AssignedTo != null ? new Employee
                    {
                        EmployeeId = b.AssignedTo.EmployeeId,
                        Username = b.AssignedTo.Username,
                        FirstName = b.AssignedTo.FirstName,
                        LastName = b.AssignedTo.LastName,
                        Role = b.AssignedTo.Role
                    } : null,
                    ReportedAt = b.ReportedAt,
                    AssignedAt = b.AssignedAt,
                    LastModifiedAt = b.LastModifiedAt,
                    IsModifiable = b.IsModifiable
                })
                .ToListAsync();
        }

        // GET: api/Bugs/5
        // All authenticated users can view a specific bug
        [HttpGet("{id}")]
        public async Task<ActionResult<Bug>> GetBug(int id)
        {
            var bug = await _context.Bugs
                .Include(b => b.ReportedBy)
                .Include(b => b.AssignedTo)
                .FirstOrDefaultAsync(b => b.BugId == id);

            if (bug == null)
            {
                return NotFound();
            }

            return new Bug
            {
                BugId = bug.BugId,
                Name = bug.Name,
                Description = bug.Description,
                ReportedById = bug.ReportedById,
                ReportedBy = bug.ReportedBy != null ? new Employee
                {
                    EmployeeId = bug.ReportedBy.EmployeeId,
                    Username = bug.ReportedBy.Username,
                    FirstName = bug.ReportedBy.FirstName,
                    LastName = bug.ReportedBy.LastName,
                    Role = bug.ReportedBy.Role
                } : null,
                Status = bug.Status,
                AssignedToId = bug.AssignedToId,
                AssignedTo = bug.AssignedTo != null ? new Employee
                {
                    EmployeeId = bug.AssignedTo.EmployeeId,
                    Username = bug.AssignedTo.Username,
                    FirstName = bug.AssignedTo.FirstName,
                    LastName = bug.AssignedTo.LastName,
                    Role = bug.AssignedTo.Role
                } : null,
                ReportedAt = bug.ReportedAt,
                AssignedAt = bug.AssignedAt,
                LastModifiedAt = bug.LastModifiedAt,
                IsModifiable = bug.IsModifiable
            };
        }

        // POST: api/Bugs
        // Only Testers can report new bugs
        [HttpPost]
        [Authorize(Roles = "Tester")]
        public async Task<ActionResult<Bug>> PostBug(Bug bug)
        {
            // Ensure the reportedById matches the authenticated user's ID
            var currentUserId = GetCurrentUserId();
            if (bug.ReportedById != currentUserId)
            {
                return Forbid("You can only report bugs as yourself.");
            }

            bug.Status = "New";
            bug.ReportedAt = DateTime.UtcNow;
            bug.LastModifiedAt = DateTime.UtcNow;
            bug.IsModifiable = true;

            _context.Bugs.Add(bug);
            await _context.SaveChangesAsync();

            await _context.Entry(bug).Reference(b => b.ReportedBy).LoadAsync();
            bug.AssignedTo = null;

            return CreatedAtAction(nameof(GetBug), new { id = bug.BugId }, new Bug
            {
                BugId = bug.BugId,
                Name = bug.Name,
                Description = bug.Description,
                ReportedById = bug.ReportedById,
                ReportedBy = bug.ReportedBy != null ? new Employee
                {
                    EmployeeId = bug.ReportedBy.EmployeeId,
                    Username = bug.ReportedBy.Username,
                    FirstName = bug.ReportedBy.FirstName,
                    LastName = bug.ReportedBy.LastName,
                    Role = bug.ReportedBy.Role
                } : null,
                Status = bug.Status,
                AssignedToId = bug.AssignedToId,
                AssignedTo = bug.AssignedTo != null ? new Employee
                {
                    EmployeeId = bug.AssignedTo.EmployeeId,
                    Username = bug.AssignedTo.Username,
                    FirstName = bug.AssignedTo.FirstName,
                    LastName = bug.AssignedTo.LastName,
                    Role = bug.AssignedTo.Role
                } : null,
                ReportedAt = bug.ReportedAt,
                AssignedAt = bug.AssignedAt,
                LastModifiedAt = bug.LastModifiedAt,
                IsModifiable = bug.IsModifiable
            });
        }

        // PUT: api/Bugs/5
        // Complex authorization:
        // - Testers can modify their own bugs IF IsModifiable is true.
        // - Programmers can assign/reassign bugs and change status.
        // - Administrators can do anything.
        [HttpPut("{id}")]
        public async Task<IActionResult> PutBug(int id, Bug bug)
        {
            if (id != bug.BugId)
            {
                return BadRequest();
            }

            var existingBug = await _context.Bugs
                .Include(b => b.ReportedBy)
                .Include(b => b.AssignedTo)
                .FirstOrDefaultAsync(b => b.BugId == id);

            if (existingBug == null)
            {
                return NotFound();
            }

            var currentUserId = GetCurrentUserId();
            var currentUserRole = GetCurrentUserRole();

            // --- Authorization Logic ---

            // 1. Administrator can do anything
            if (currentUserRole == "Administrator")
            {
                // Admin can update all fields freely
                existingBug.Name = bug.Name;
                existingBug.Description = bug.Description;
                existingBug.Status = bug.Status;
                existingBug.AssignedToId = bug.AssignedToId;
                existingBug.AssignedAt = bug.AssignedToId.HasValue ? DateTime.UtcNow : (DateTime?)null;
                existingBug.IsModifiable = bug.IsModifiable; // Admin can even override this flag
            }
            // 2. Tester's permissions
            else if (currentUserRole == "Tester")
            {
                // Tester can only modify THEIR OWN bugs
                if (existingBug.ReportedById != currentUserId)
                {
                    return Forbid("You can only modify bugs you have reported.");
                }

                // Tester can only modify if IsModifiable is true (i.e., not assigned)
                if (!existingBug.IsModifiable)
                {
                    return Forbid("This bug is currently assigned and cannot be modified by the reporter.");
                }

                // Tester can only update Name and Description
                existingBug.Name = bug.Name;
                existingBug.Description = bug.Description;

                // Prevent tester from changing status or assignment
                if (existingBug.Status != bug.Status || existingBug.AssignedToId != bug.AssignedToId)
                {
                    return Forbid("Testers cannot change bug status or assignment.");
                }
            }
            // 3. Programmer's permissions
            else if (currentUserRole == "Programmer")
            {
                // Programmers can only update Status and Assignment
                // They cannot change Name or Description
                if (existingBug.Name != bug.Name || existingBug.Description != bug.Description)
                {
                    return Forbid("Programmers cannot modify bug name or description.");
                }

                existingBug.Status = bug.Status;
                existingBug.AssignedToId = bug.AssignedToId;

                // If a programmer assigns the bug, IsModifiable becomes false
                if (bug.AssignedToId.HasValue && existingBug.AssignedToId != bug.AssignedToId)
                {
                    existingBug.AssignedAt = DateTime.UtcNow;
                    existingBug.IsModifiable = false;
                    existingBug.Status = "Assigned"; // Set status to assigned by default on assignment
                }
                // If a programmer unassigns the bug (sets AssignedToId to null)
                else if (!bug.AssignedToId.HasValue && existingBug.AssignedToId.HasValue)
                {
                    existingBug.AssignedAt = null;
                    existingBug.IsModifiable = true; // Becomes modifiable again if unassigned
                    // Status might revert to "New" or stay as is, depending on desired flow.
                    // For now, let's keep the status as is unless explicitly changed.
                }
                // If programmer changes status to Resolved/Closed, it's no longer modifiable by reporter
                else if (bug.Status == "Resolved" || bug.Status == "Closed")
                {
                    existingBug.IsModifiable = false;
                }
            }
            else
            {
                // Should not happen with [Authorize] but good for safety
                return Forbid("Unauthorized role.");
            }

            existingBug.LastModifiedAt = DateTime.UtcNow;
            _context.Entry(existingBug).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!BugExists(id))
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

        // DELETE: api/Bugs/5
        // Only Administrators can delete bugs.
        // Testers can delete their own bugs IF they are not assigned.
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBug(int id)
        {
            var bug = await _context.Bugs.FindAsync(id);
            if (bug == null)
            {
                return NotFound();
            }

            var currentUserId = GetCurrentUserId();
            var currentUserRole = GetCurrentUserRole();

            // Authorization check for deletion
            if (currentUserRole == "Administrator")
            {
                // Admin can delete any bug
            }
            else if (currentUserRole == "Tester")
            {
                // Tester can only delete their own bug if it's not assigned
                if (bug.ReportedById != currentUserId)
                {
                    return Forbid("You can only delete bugs you have reported.");
                }
                if (!bug.IsModifiable) // If IsModifiable is false, it means it's assigned
                {
                    return Forbid("Cannot delete an assigned bug.");
                }
            }
            else
            {
                // Programmers cannot delete bugs
                return Forbid("You are not authorized to delete bugs.");
            }

            _context.Bugs.Remove(bug);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool BugExists(int id)
        {
            return _context.Bugs.Any(e => e.BugId == id);
        }
    }
}
