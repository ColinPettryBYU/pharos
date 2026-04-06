using Microsoft.AspNetCore.Identity;

namespace Pharos.Api.Services;

/// <summary>
/// Custom password validator that blocks commonly-used passwords.
/// Also rejects passwords that contain the user's email or username.
/// </summary>
public class CommonPasswordValidator<TUser> : IPasswordValidator<TUser> where TUser : class
{
    private static readonly HashSet<string> CommonPasswords = new(StringComparer.OrdinalIgnoreCase)
    {
        "password123!", "Password123!", "Welcome123!", "Changeme123!", "Admin12345!",
        "Qwerty123456!", "Letmein12345!", "Abc123456789!", "Iloveyou1234!", "Monkey123456!",
        "Dragon123456!", "Master123456!", "123456789abc!", "Football12345!", "Baseball12345!",
        "Shadow123456!", "Trustno1234!", "Sunshine12345!", "Princess1234!", "Superman12345!",
        "Michael12345!", "Charlie12345!", "Jessica12345!", "Jennifer1234!", "Michelle1234!",
        "Password1234!", "password1234!", "Passw0rd1234!", "P@ssword1234!", "P@ssw0rd1234!",
        "Test12345678!", "User12345678!", "Root12345678!", "Temp12345678!", "Guest1234567!",
        "Default12345!", "Pharos1234567!", "Lighthouse123!", "Philippines1!", "Manila12345!",
        "1234567890ab!", "Abcdefghijkl1!", "Qwertyuiop12!", "Zxcvbnm12345!",
        "HelloWorld123!", "GoodMorning12!", "OpenSesame123!", "LetMeIn123456!",
        "password12345", "Password12345", "P@ssword12345", "admin1234567!"
    };

    public Task<IdentityResult> ValidateAsync(UserManager<TUser> manager, TUser user, string? password)
    {
        if (string.IsNullOrEmpty(password))
        {
            return Task.FromResult(IdentityResult.Success);
        }

        // Check against common passwords list
        if (CommonPasswords.Contains(password))
        {
            return Task.FromResult(IdentityResult.Failed(
                new IdentityError
                {
                    Code = "CommonPassword",
                    Description = "This password is too common. Please choose a more unique password."
                }));
        }

        // Check if password contains the username/email
        var email = manager.GetUserNameAsync(user).GetAwaiter().GetResult();
        if (!string.IsNullOrEmpty(email))
        {
            var emailLocal = email.Split('@')[0];
            if (password.Contains(emailLocal, StringComparison.OrdinalIgnoreCase))
            {
                return Task.FromResult(IdentityResult.Failed(
                    new IdentityError
                    {
                        Code = "PasswordContainsUsername",
                        Description = "Password cannot contain your email address or username."
                    }));
            }
        }

        return Task.FromResult(IdentityResult.Success);
    }
}
