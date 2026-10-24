using Slotly.Domain.Common;

namespace Slotly.Domain.Users;

public sealed class RefreshToken : Entity, ITenantOwned
{
    private RefreshToken()
    {
    }

    private RefreshToken(
        Guid tenantId,
        Guid userId,
        string tokenHash,
        DateTimeOffset expiresAt,
        string? createdByIp)
    {
        TenantId = DomainGuard.NotEmpty(tenantId, nameof(tenantId));
        UserId = DomainGuard.NotEmpty(userId, nameof(userId));
        TokenHash = DomainGuard.NotBlank(tokenHash, nameof(tokenHash), 128);
        ExpiresAt = expiresAt;
        CreatedByIp = createdByIp;
    }

    public Guid TenantId { get; private set; }

    public Guid UserId { get; private set; }

    public string TokenHash { get; private set; } = string.Empty;

    public DateTimeOffset ExpiresAt { get; private set; }

    public DateTimeOffset? RevokedAt { get; private set; }

    public string? ReplacedByTokenHash { get; private set; }

    public string? CreatedByIp { get; private set; }

    public string? RevokedByIp { get; private set; }

    public string? RevocationReason { get; private set; }

    public bool IsExpired(DateTimeOffset now) => now >= ExpiresAt;

    public bool IsRevoked => RevokedAt.HasValue;

    public bool IsActive(DateTimeOffset now) => !IsRevoked && !IsExpired(now);

    public static RefreshToken Create(
        Guid tenantId,
        Guid userId,
        string tokenHash,
        DateTimeOffset expiresAt,
        string? createdByIp)
        => new(tenantId, userId, tokenHash, expiresAt, createdByIp);

    public void Revoke(DateTimeOffset now, string? revokedByIp, string reason, string? replacedByTokenHash = null)
    {
        if (IsRevoked)
        {
            return;
        }

        RevokedAt = now;
        RevokedByIp = revokedByIp;
        RevocationReason = DomainGuard.NotBlank(reason, nameof(reason), 200);
        ReplacedByTokenHash = replacedByTokenHash;
    }
}
