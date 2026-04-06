using Microsoft.AspNetCore.Identity;

namespace Pharos.Api.Models;

public class ApplicationUser : IdentityUser
{
    public int? LinkedSupporterId { get; set; }
    public string? DisplayName { get; set; }
}
