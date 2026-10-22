using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using Slotly.Api.Infrastructure;

namespace Slotly.Api.IntegrationTests;

public sealed class GlobalExceptionHandlerTests
{
    [Fact]
    public async Task HandlerWritesRfc7807ProblemDetails()
    {
        var context = new DefaultHttpContext
        {
            TraceIdentifier = "slotly-test-trace",
        };
        context.Request.Path = "/bookings";
        await using var responseBody = new MemoryStream();
        context.Response.Body = responseBody;

        var handler = new GlobalExceptionHandler(
            NullLogger<GlobalExceptionHandler>.Instance);

        var handled = await handler.TryHandleAsync(
            context,
            new InvalidOperationException("Database unavailable."),
            CancellationToken.None);

        responseBody.Position = 0;
        using var document = await JsonDocument.ParseAsync(
            responseBody,
            cancellationToken: CancellationToken.None);

        handled.Should().BeTrue();
        context.Response.StatusCode.Should().Be(StatusCodes.Status500InternalServerError);
        context.Response.ContentType.Should().StartWith("application/problem+json");
        document.RootElement.GetProperty("title").GetString()
            .Should().Be("An unexpected error occurred.");
        document.RootElement.GetProperty("status").GetInt32()
            .Should().Be(StatusCodes.Status500InternalServerError);
        document.RootElement.GetProperty("traceId").GetString()
            .Should().Be("slotly-test-trace");
    }
}
