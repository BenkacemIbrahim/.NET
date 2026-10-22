namespace Slotly.Domain.Common;

internal static class DomainGuard
{
    public static Guid NotEmpty(Guid value, string parameterName)
    {
        return value == Guid.Empty
            ? throw new ArgumentException("The identifier cannot be empty.", parameterName)
            : value;
    }

    public static string NotBlank(string value, string parameterName, int maximumLength)
    {
        ArgumentNullException.ThrowIfNull(value);

        var normalized = value.Trim();
        if (normalized.Length == 0)
        {
            throw new ArgumentException("The value cannot be blank.", parameterName);
        }

        if (normalized.Length > maximumLength)
        {
            throw new ArgumentOutOfRangeException(
                parameterName,
                $"The value cannot exceed {maximumLength} characters.");
        }

        return normalized;
    }

    public static string Email(string value, string parameterName)
    {
        var normalized = NotBlank(value, parameterName, 320).ToLowerInvariant();
        var separatorIndex = normalized.IndexOf('@', StringComparison.Ordinal);

        if (separatorIndex <= 0 || separatorIndex == normalized.Length - 1)
        {
            throw new ArgumentException("A valid email address is required.", parameterName);
        }

        return normalized;
    }
}
