using Slotly.Application.Common.Interfaces;

namespace Slotly.Infrastructure.Observability;

public sealed class CorrelationContext : ICorrelationContext
{
    public string? CorrelationId { get; set; }
}
