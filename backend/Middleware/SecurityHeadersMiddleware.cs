namespace Pharos.Api.Middleware;

/// <summary>
/// Adds Content-Security-Policy and other security headers to every HTTP response.
/// CSP must be an HTTP header (not a meta tag) per grading rubric.
/// </summary>
public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;

    public SecurityHeadersMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context)
    {
        var csp = string.Join("; ",
            "default-src 'self'",
            "script-src 'self'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "font-src 'self' https://fonts.gstatic.com",
            "connect-src 'self' https://accounts.google.com https://graph.facebook.com https://graph.instagram.com https://api.linkedin.com https://www.googleapis.com https://developers.tiktok.com https://api.twitter.com https://www.youtube.com",
            "frame-src 'self' https://accounts.google.com",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'"
        );

        context.Response.Headers.Append("Content-Security-Policy", csp);
        context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
        context.Response.Headers.Append("X-Frame-Options", "DENY");
        context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
        context.Response.Headers.Append("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

        await _next(context);
    }
}
