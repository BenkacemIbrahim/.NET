namespace Slotly.Infrastructure.Authentication;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string SigningKey { get; set; } = "slotly-dev-signing-key-must-be-at-least-32-chars-long-for-hmac-sha256!";

    public string Issuer { get; set; } = "slotly-api";

    public string Audience { get; set; } = "slotly-clients";

    public int AccessTokenLifetimeMinutes { get; set; } = 15;

    public int RefreshTokenLifetimeDays { get; set; } = 7;
}
