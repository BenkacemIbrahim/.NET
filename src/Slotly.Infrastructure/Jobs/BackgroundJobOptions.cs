namespace Slotly.Infrastructure.Jobs;

public sealed class BackgroundJobOptions
{
    public const string SectionName = "BackgroundJobs";

    public int PendingBookingExpiryMinutes { get; set; } = 15;

    public int RetentionDays { get; set; } = 30;
}
