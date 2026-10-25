# Stripe payments

## Design

Stripe is isolated behind `IPaymentGateway`; the application and domain layers
do not depend on Stripe.net. Each tenant can enable online payments and select
an optional deposit percentage. A missing deposit percentage means the full
service price is charged. Service prices remain tenant-owned and use a
three-letter ISO currency code.

When online payments are enabled for a priced service, booking creation:

1. reserves the slot as a Pending booking;
2. creates a Pending payment for the full price or tenant deposit;
3. commits both records atomically;
4. creates a Stripe Checkout Session and stores its session ID;
5. returns the hosted Checkout URL with the booking response.

The booking becomes Confirmed only after a signed
`checkout.session.completed` webhook. `payment_intent.payment_failed` marks the
payment failed and cancels the Pending booking, releasing its slot. The existing
Hangfire expiry job similarly cancels unpaid Pending bookings after the
configured timeout. `charge.refunded` records the refund idempotently and
cancels any still-active booking.

Webhook event IDs are primary keys in `processed_webhook_events`; replaying an
event returns success without applying the transition again. Checkout Session
and Payment Intent IDs have unique database indexes.

## Configuration

Copy `.env.example` to `.env` and set:

```dotenv
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_SUCCESS_URL=http://localhost:8080/payments/success
STRIPE_CANCEL_URL=http://localhost:8080/payments/cancel
```

Only Stripe test-mode keys should be used locally. Never commit `.env`.

## Stripe CLI and manual test

Stripe CLI 1.55.1 can be installed on Windows with:

```powershell
winget install --id Stripe.StripeCli --exact
stripe login
```

After login, start webhook forwarding in a separate terminal:

```powershell
stripe listen --forward-to localhost:8080/api/v1/payments/webhook
```

The command prints a `whsec_...` signing secret. Put that value in
`STRIPE_WEBHOOK_SECRET`, then restart the API container. The secret belongs to
that listening session and may change when the listener is restarted.

Manual end-to-end flow:

1. Start Compose with the `api` profile and authenticate as a TenantOwner.
2. Enable payments with `PUT /api/v1/payments/policy`, for example
   `{"onlinePaymentsEnabled":true,"depositPercentage":25}`.
3. Create a priced booking and open the returned `checkoutUrl`.
4. In Stripe Checkout use test card `4242 4242 4242 4242`, any future expiry,
   any three-digit CVC, and any valid postal code.
5. Observe `checkout.session.completed` in the Stripe CLI output.
6. `GET /api/v1/bookings/{id}` must show `Confirmed`; `GET /api/v1/payments/{id}`
   must show `Succeeded` with the Checkout Session and Payment Intent IDs.

For the declined-payment path, use `4000 0000 0000 9995`. Stripe test cards do
not move real money.

Refunds are initiated with `POST /api/v1/payments/{bookingId}/refund`. The
request requires the current booking version and a reason, and it is rejected
after the tenant cancellation deadline. Final Refunded status is driven by the
signed Stripe webhook.

## Automated verification

The payment domain tests cover success, failure, checkout references, and
refund transitions. The API integration test signs realistic Stripe payloads
with HMAC-SHA256 and proves that completed, failed, refunded, and duplicate
events update real PostgreSQL state correctly.

```bash
dotnet test tests/Slotly.Api.IntegrationTests/Slotly.Api.IntegrationTests.csproj \
  --filter FullyQualifiedName~PaymentWebhookIntegrationTests
```
