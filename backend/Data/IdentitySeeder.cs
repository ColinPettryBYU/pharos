using Microsoft.AspNetCore.Identity;
using Pharos.Api.Models;

namespace Pharos.Api.Data;

/// <summary>
/// Seeds the required Identity accounts and roles per grading requirements.
/// Creates 2 roles (Admin, Donor) and 4 accounts:
///   1. admin@pharos.org      - Admin, no MFA
///   2. donor@pharos.org      - Donor, no MFA, linked to supporter_id
///   3. admin-mfa@pharos.org  - Admin, TOTP MFA enabled
///   4. grader@pharos.org     - Admin, no MFA, simple password
/// </summary>
public static class IdentitySeeder
{
    public static async Task SeedAsync(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        IConfiguration configuration,
        ILogger logger)
    {
        // Create roles
        string[] roles = { "Admin", "Donor" };
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
                logger.LogInformation("Created role: {Role}", role);
            }
        }

        // Passwords — read from config/env, with secure fallbacks for development
        var adminPassword = configuration["SeedPasswords:Admin"] ?? "Pharos@Admin2025!";
        var donorPassword = configuration["SeedPasswords:Donor"] ?? "Pharos@Donor2025!";
        var mfaAdminPassword = configuration["SeedPasswords:MfaAdmin"] ?? "Pharos@MfaAdmin25!";
        var simpleAdminPassword = configuration["SeedPasswords:SimpleAdmin"] ?? "adminadminadmin";

        // 1. Admin (no MFA)
        await CreateUserIfNotExists(userManager, logger,
            email: "admin@pharos.org",
            displayName: "Pharos Admin",
            password: adminPassword,
            role: "Admin",
            linkedSupporterId: null,
            enableMfa: false);

        // 2. Donor (no MFA) — linked to supporter_id 1 (has donation history)
        await CreateUserIfNotExists(userManager, logger,
            email: "donor@pharos.org",
            displayName: "Sample Donor",
            password: donorPassword,
            role: "Donor",
            linkedSupporterId: 1,
            enableMfa: false);

        // 3. Admin with MFA
        await CreateUserIfNotExists(userManager, logger,
            email: "admin-mfa@pharos.org",
            displayName: "Pharos MFA Admin",
            password: mfaAdminPassword,
            role: "Admin",
            linkedSupporterId: null,
            enableMfa: true);

        // 4. Simple admin (no MFA) — easy access for grading
        await CreateUserIfNotExists(userManager, logger,
            email: "grader@pharos.org",
            displayName: "Grader Admin",
            password: simpleAdminPassword,
            role: "Admin",
            linkedSupporterId: null,
            enableMfa: false);

        logger.LogInformation("Identity seeding completed.");
    }

    private static async Task CreateUserIfNotExists(
        UserManager<ApplicationUser> userManager,
        ILogger logger,
        string email,
        string displayName,
        string password,
        string role,
        int? linkedSupporterId,
        bool enableMfa)
    {
        var existingUser = await userManager.FindByEmailAsync(email);
        if (existingUser != null)
        {
            logger.LogInformation("User {Email} already exists. Skipping.", email);
            return;
        }

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            EmailConfirmed = true,
            DisplayName = displayName,
            LinkedSupporterId = linkedSupporterId
        };

        var result = await userManager.CreateAsync(user, password);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            logger.LogError("Failed to create user {Email}: {Errors}", email, errors);
            return;
        }

        await userManager.AddToRoleAsync(user, role);
        logger.LogInformation("Created user {Email} with role {Role}", email, role);

        if (enableMfa)
        {
            // Generate and set authenticator key for MFA
            await userManager.ResetAuthenticatorKeyAsync(user);
            var key = await userManager.GetAuthenticatorKeyAsync(user);
            await userManager.SetTwoFactorEnabledAsync(user, true);
            logger.LogInformation("MFA enabled for {Email}. Authenticator key: {Key}", email, key);
            logger.LogInformation("TOTP URI: otpauth://totp/Pharos:{Email}?secret={Key}&issuer=Pharos", email, key);
        }
    }
}
