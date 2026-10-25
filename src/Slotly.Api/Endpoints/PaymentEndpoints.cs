using System.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Slotly.Application.Common.Interfaces;
using Slotly.Application.Payments;
using Slotly.Domain.Bookings;
using Slotly.Domain.Payments;
using Slotly.Infrastructure.Authentication;
using Slotly.Infrastructure.Persistence;
using Slotly.Infrastructure.Tenancy;
using Slotly.Api.Infrastructure;
using Stripe;

namespace Slotly.Api.Endpoints;

public static class PaymentEndpoints
{
    public static IEndpointRouteBuilder MapPaymentEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/v1/payments").WithTags("Payments");
        group.MapPut("/policy", UpdatePolicyAsync)
            .RequireAuthorization(AuthorizationPolicies.TenantOwnerOnly)
            .WithName("UpdatePaymentPolicy")
            .WithSummary("Configures online payment and optional deposit percentage for the tenant.")
            .WithDescription("Example body: {\"onlinePaymentsEnabled\":true,\"depositPercentage\":25}");
        group.MapGet("/{id:guid}", GetPaymentAsync)
            .RequireAuthorization(AuthorizationPolicies.CustomerOnly)
            .WithName("GetPayment")
            .WithSummary("Gets a tenant payment.")
            .WithDescription("Example: GET /api/v1/payments/11111111-1111-1111-1111-111111111111");
        group.MapPost("/{bookingId:guid}/refund", RefundAsync)
            .RequireAuthorization(AuthorizationPolicies.CustomerOnly)
            .WithName("RefundPayment")
            .WithSummary("Requests a Stripe refund within the tenant cancellation window.")
            .WithDescription("Example body: {\"bookingVersion\":\"22222222-2222-2222-2222-222222222222\",\"reason\":\"Customer cancellation\"}");
        group.MapPost("/webhook", HandleWebhookAsync)
            .AllowAnonymous()
            .WithName("StripeWebhook")
            .WithSummary("Receives and verifies Stripe payment webhooks.")
            .WithDescription("Stripe CLI example: stripe listen --forward-to localhost:8080/api/v1/payments/webhook");
        return routes;
    }

    private static async Task<IResult> UpdatePolicyAsync(
        PaymentPolicyRequest request,
        SlotlyDbContext dbContext,
        ITenantContext tenantContext,
        TenantSettingsCache settingsCache,
        CancellationToken cancellationToken)
    {
        var tenant = await dbContext.Tenants.SingleAsync(
            value => value.Id == RequiredTenantId(tenantContext), cancellationToken);
        try
        {
            tenant.ConfigurePaymentPolicy(request.OnlinePaymentsEnabled, request.DepositPercentage);
        }
        catch (ArgumentOutOfRangeException exception)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                [nameof(request.DepositPercentage)] = [exception.Message],
            });
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        await settingsCache.InvalidateAsync(tenant.Id, cancellationToken);
        return Results.Ok(new PaymentPolicyDto(tenant.OnlinePaymentsEnabled, tenant.DepositPercentage));
    }

    private static async Task<IResult> GetPaymentAsync(
        Guid id,
        SlotlyDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var payment = await dbContext.Payments.AsNoTracking()
            .SingleOrDefaultAsync(value => value.Id == id, cancellationToken);
        return payment is null ? Results.NotFound() : Results.Ok(ToDto(payment));
    }

    private static async Task<IResult> RefundAsync(
        Guid bookingId,
        RefundPaymentRequest request,
        SlotlyDbContext dbContext,
        ITenantContext tenantContext,
        IPaymentGateway paymentGateway,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        var booking = await dbContext.Bookings.SingleOrDefaultAsync(value => value.Id == bookingId, cancellationToken);
        if (booking is null)
        {
            return Results.NotFound();
        }

        if (booking.Version != request.BookingVersion)
        {
            return Results.Conflict();
        }

        var tenant = await dbContext.Tenants.AsNoTracking()
            .SingleAsync(value => value.Id == RequiredTenantId(tenantContext), cancellationToken);
        if (timeProvider.GetUtcNow() > booking.Slot.StartsAt.AddHours(-tenant.CancellationWindowHours))
        {
            return Results.Problem(statusCode: 409, title: "Cancellation window closed");
        }

        var payment = await dbContext.Payments.SingleOrDefaultAsync(
            value => value.BookingId == bookingId && value.Status == PaymentStatus.Succeeded,
            cancellationToken);
        if (payment?.PaymentIntentId is null)
        {
            return Results.NotFound();
        }

        await paymentGateway.RefundAsync(payment.PaymentIntentId, cancellationToken);
        booking.Cancel(request.Reason);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Results.Accepted($"/api/v1/payments/{payment.Id}", ToDto(payment));
    }

    private static async Task<IResult> HandleWebhookAsync(
        HttpRequest request,
        SlotlyDbContext dbContext,
        TenantContext tenantContext,
        IPaymentGateway paymentGateway,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        using var reader = new StreamReader(request.Body);
        var payload = await reader.ReadToEndAsync(cancellationToken);
        PaymentWebhook webhook;
        try
        {
            webhook = paymentGateway.ParseWebhook(payload, request.Headers["Stripe-Signature"].ToString());
        }
        catch (StripeException exception)
        {
            return Results.BadRequest(new ProblemDetails { Title = "Invalid Stripe signature", Detail = exception.Message });
        }
        catch (NotSupportedException)
        {
            return Results.Ok();
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(
            IsolationLevel.Serializable, cancellationToken);
        if (await dbContext.ProcessedWebhookEvents.AnyAsync(value => value.EventId == webhook.EventId, cancellationToken))
        {
            return Results.Ok();
        }

        var payment = await FindPaymentAsync(dbContext, webhook, cancellationToken);
        if (payment is null)
        {
            return Results.NotFound();
        }

        tenantContext.SetTenant(payment.TenantId);
        var booking = await dbContext.Bookings.SingleAsync(value => value.Id == payment.BookingId, cancellationToken);
        switch (webhook.Kind)
        {
            case PaymentWebhookKind.CheckoutCompleted when payment.Status == PaymentStatus.Pending:
                payment.MarkSucceeded(
                    webhook.PaymentIntentId ?? throw new InvalidOperationException("Stripe omitted the payment intent."),
                    timeProvider.GetUtcNow());
                booking.Confirm();
                break;
            case PaymentWebhookKind.PaymentFailed when payment.Status == PaymentStatus.Pending:
                payment.MarkFailed();
                booking.Cancel("Stripe payment failed.");
                break;
            case PaymentWebhookKind.ChargeRefunded when payment.Status == PaymentStatus.Succeeded:
                payment.MarkRefunded();
                if (booking.Status is BookingStatus.Pending or BookingStatus.Confirmed)
                {
                    booking.Cancel("Stripe payment refunded.");
                }

                break;
        }

        dbContext.ProcessedWebhookEvents.Add(ProcessedWebhookEvent.Create(
            webhook.EventId, webhook.Kind.ToString(), timeProvider.GetUtcNow()));
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return Results.Ok();
    }

    private static Task<Payment?> FindPaymentAsync(
        SlotlyDbContext dbContext,
        PaymentWebhook webhook,
        CancellationToken cancellationToken)
        => dbContext.Payments.IgnoreQueryFilters().SingleOrDefaultAsync(
            payment => (webhook.CheckoutSessionId != null && payment.CheckoutSessionId == webhook.CheckoutSessionId)
                || (webhook.PaymentIntentId != null && payment.PaymentIntentId == webhook.PaymentIntentId),
            cancellationToken);

    private static PaymentDto ToDto(Payment payment)
        => new(
            payment.Id,
            payment.BookingId,
            payment.Amount.Amount,
            payment.Amount.Currency,
            payment.Status,
            payment.CheckoutSessionId,
            payment.PaymentIntentId,
            payment.PaidAt);

    private static Guid RequiredTenantId(ITenantContext tenantContext)
        => tenantContext.TenantId ?? throw new InvalidOperationException("An active tenant is required.");
}
