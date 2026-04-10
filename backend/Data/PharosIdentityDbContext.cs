using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Pharos.Api.Models;

namespace Pharos.Api.Data;

public class PharosIdentityDbContext : IdentityDbContext<ApplicationUser>
{
    public PharosIdentityDbContext(DbContextOptions<PharosIdentityDbContext> options)
        : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<ApplicationUser>(entity =>
        {
            entity.Property(e => e.LinkedSupporterId).HasColumnName("linked_supporter_id");
            entity.Property(e => e.DisplayName).HasColumnName("display_name").HasMaxLength(200);
        });
    }
}
