using System.Globalization;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Slotly.Domain.Bookings;
using Slotly.Domain.Customers;
using Slotly.Domain.Payments;
using Slotly.Domain.Services;
using Slotly.Domain.Staff;
using Slotly.Domain.Tenants;
using Slotly.Domain.ValueObjects;
using Slotly.Infrastructure.Persistence;
using Slotly.Infrastructure.Tenancy;

namespace Slotly.Api.IntegrationTests;

public sealed class PaymentWebhookIntegrationTests(AuthTestWebApplicationFactory factory)
    : IClassFixture<AuthTestWebApplicationFactory>
{
    private const string WebhookSecret = "whsec_slotly_integration_tests";
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task SignedWebhooksDrivePaymentAndBookingStateIdempotently()
    {
        var seeded = await SeedPaymentsAsync();

        await PostWebhookAsync(EventPayload(
            "evt_checkout_completed",
            "checkout.session.completed",
            new { id = seeded.SuccessSessionId, @object = "checkout.session", payment_intent = seeded.SuccessIntentId }));
        await PostWebhookAsync(EventPayload(
            "evt_checkout_completed",
            "checkout.session.completed",
            new { id = seeded.SuccessSessionId, @object = "checkout.session", payment_intent = seeded.SuccessIntentId }));
        await PostWebhookAsync(EventPayload(
            "evt_payment_failed",
            "payment_intent.payment_failed",
            new { id = seeded.FailedIntentId, @object = "payment_intent" }));
        await PostWebhookAsync(EventPayload(
            "evt_charge_refunded",
            "charge.refunded",
            new { id = "ch_test_refunded", @object = "charge", payment_intent = seeded.SuccessIntentId }));

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<SlotlyDbContext>();
        var successfulPayment = await dbContext.Payments.IgnoreQueryFilters()
            .SingleAsync(value => value.Id == seeded.SuccessPaymentId);
        var failedPayment = await dbContext.Payments.IgnoreQueryFilters()
            .SingleAsync(value => value.Id == seeded.FailedPaymentId);
        var successfulBooking = await dbContext.Bookings.IgnoreQueryFilters()
            .SingleAsync(value => value.Id == seeded.SuccessBookingId);
        var failedBooking = await dbContext.Bookings.IgnoreQueryFilters()
            .SingleAsync(value => value.Id == seeded.FailedBookingId);

        successfulPayment.Status.Should().Be(PaymentStatus.Refunded);
        successfulBooking.Status.Should().Be(BookingStatus.Cancelled);
        failedPayment.Status.Should().Be(PaymentStatus.Failed);
        failedBooking.Status.Should().Be(BookingStatus.Cancelled);
        (await dbContext.ProcessedWebhookEvents.CountAsync()).Should().Be(3);
    }

    private async Task<SeededPayments> SeedPaymentsAsync()
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<SlotlyDbContext>();
        var tenantContext = scope.ServiceProvider.GetRequiredService<TenantContext>();
        var tenant = Tenant.Create("Stripe Test Clinic", $"stripe-{Guid.NewGuid():N}");
        dbContext.Tenants.Add(tenant);
        await dbContext.SaveChangesAsync();
        tenantContext.SetTenant(tenant.Id);

        var service = Service.Create(tenant.Id, "Consultation", TimeSpan.FromMinutes(30), new Money(100, "EUR"), TimeSpan.Zero);
        var staff = Staff.Create(tenant.Id, null, "Stripe Tester", $"stripe-{Guid.NewGuid():N}@example.com");
        var customer = Customer.Create(tenant.Id, "Stripe Customer", $"customer-{Guid.NewGuid():N}@example.com", null);
        dbContext.AddRange(service, staff, customer);
        await dbContext.SaveChangesAsync();

        var start = DateTimeOffset.UtcNow.AddDays(10);
        var successBooking = Booking.Create(tenant.Id, customer.Id, service.Id, staff.Id, new TimeSlot(start, start.AddMinutes(30)));
        var failedBooking = Booking.Create(tenant.Id, customer.Id, service.Id, staff.Id, new TimeSlot(start.AddHours(1), start.AddHours(1.5)));
        var successPayment = Payment.Create(tenant.Id, successBooking.Id, new Money(100, "EUR"));
        var failedPayment = Payment.Create(tenant.Id, failedBooking.Id, new Money(100, "EUR"));
        successPayment.AttachCheckoutSession("cs_test_success", null);
        failedPayment.AttachCheckoutSession("cs_test_failed", "pi_test_failed");
        dbContext.AddRange(successBooking, failedBooking, successPayment, failedPayment);
        await dbContext.SaveChangesAsync();

        return new SeededPayments(
            successBooking.Id,
            failedBooking.Id,
            successPayment.Id,
            failedPayment.Id,
            "cs_test_success",
            "pi_test_success",
            "pi_test_failed");
    }

    private async Task PostWebhookAsync(string payload)
    {
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var signedPayload = string.Create(CultureInfo.InvariantCulture, $"{timestamp}.{payload}");
        var signature = Convert.ToHexStringLower(
            HMACSHA256.HashData(Encoding.UTF8.GetBytes(WebhookSecret), Encoding.UTF8.GetBytes(signedPayload)));
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/payments/webhook")
        {
            Content = new StringContent(payload, Encoding.UTF8, "application/json"),
        };
        request.Headers.Add("Stripe-Signature", $"t={timestamp},v1={signature}");
        using var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.OK, await response.Content.ReadAsStringAsync());
    }

    private static string EventPayload(string id, string type, object data)
        => JsonSerializer.Serialize(new
        {
            id,
            @object = "event",
            api_version = "2026-09-30.endive",
            created = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
            data = new { @object = data },
            livemode = false,
            pending_webhooks = 1,
            request = (object?)null,
            type,
        });

    private sealed record SeededPayments(
        Guid SuccessBookingId,
        Guid FailedBookingId,
        Guid SuccessPaymentId,
        Guid FailedPaymentId,
        string SuccessSessionId,
        string SuccessIntentId,
        string FailedIntentId);
}
