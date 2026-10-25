using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Slotly.Domain.Bookings;

namespace Slotly.Api.Infrastructure;

internal sealed partial class GlobalExceptionHandler(
    ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        if (IsBookingConflict(exception))
        {
            LogConflictException(logger, exception);
            var conflict = new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Booking conflict",
                Detail = "The requested slot is no longer available. Refresh availability and choose another slot.",
                Type = "https://www.rfc-editor.org/rfc/rfc9110#section-15.5.10",
                Instance = httpContext.Request.Path,
            };
            conflict.Extensions["traceId"] = httpContext.TraceIdentifier;
            httpContext.Response.StatusCode = conflict.Status.Value;
            await httpContext.Response.WriteAsJsonAsync(
                conflict,
                options: null,
                contentType: "application/problem+json",
                cancellationToken: cancellationToken);
            return true;
        }

        LogUnhandledException(logger, exception);

        var problemDetails = new ProblemDetails
        {
            Status = StatusCodes.Status500InternalServerError,
            Title = "An unexpected error occurred.",
            Type = "https://www.rfc-editor.org/rfc/rfc9110#section-15.6.1",
            Instance = httpContext.Request.Path,
        };

        problemDetails.Extensions["traceId"] = httpContext.TraceIdentifier;
        httpContext.Response.StatusCode = problemDetails.Status.Value;

        await httpContext.Response.WriteAsJsonAsync(
            problemDetails,
            options: null,
            contentType: "application/problem+json",
            cancellationToken: cancellationToken);

        return true;
    }

    private static bool IsBookingConflict(Exception exception)
    {
        for (var current = exception; current is not null; current = current.InnerException)
        {
            if (current is DbUpdateConcurrencyException concurrencyException
                && concurrencyException.Entries.Any(entry => entry.Entity is Booking))
            {
                return true;
            }

            if (current is PostgresException postgresException
                && postgresException.SqlState is PostgresErrorCodes.ExclusionViolation
                    or PostgresErrorCodes.SerializationFailure
                    or PostgresErrorCodes.DeadlockDetected)
            {
                return true;
            }
        }

        return false;
    }

    [LoggerMessage(
        EventId = 1,
        Level = LogLevel.Error,
        Message = "An unhandled exception occurred while processing the request.")]
    private static partial void LogUnhandledException(
        ILogger logger,
        Exception exception);

    [LoggerMessage(
        EventId = 2,
        Level = LogLevel.Warning,
        Message = "A database concurrency or booking overlap conflict occurred.")]
    private static partial void LogConflictException(
        ILogger logger,
        Exception exception);
}
