namespace Slotly.Application.Common.Interfaces;

public interface ICorrelationContext
{
    string? CorrelationId { get; set; }
}
