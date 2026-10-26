namespace Slotly.Infrastructure.Jobs;

public sealed class BackgroundJobOptions
{
    public const string SectionName = "BackgroundJobs";

    public int PendingBookingExpiryMinutes { get; set; }

    public int RetentionDays { get; set; }
}
