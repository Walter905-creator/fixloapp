# Homeowner invitations and one-time welcome discount

## Where to find the link

After frontend and backend deployment, `/dashboard/admin` has an **Invite a homeowner** card. Its campaign invitation is:

`https://www.fixloapp.com/signup/homeowner?invite=FIXLO10`

New homeowners register with the invitation, verify their phone with a transactional SMS, and receive 10% off one service invoice total. Their dashboard shows a free quote button and their personal `HW-…` invitation link. Sharing an invitation does not replenish the sender's own discount. Existing accounts get a personal sharing code when they open the invitation card; accounts without an invitation do not receive a welcome discount automatically.

## Payment behavior

The contractor and service-intake completion payment paths subtract 10% from the complete labor/material total before calculating the remaining balance after prepayments. For a $1,000 service total with no prepayments, Stripe is asked to collect $900. The invoice records the $1,000 subtotal, $100 discount and $900 net total. This change integrates with existing hourly service billing; fixed-price quote publishing/acceptance and 50% deposit checkout are separate pending work.

The benefit record uses the normalized verified phone as its MongoDB primary key. An atomic reservation binds it to one job before payment. Other simultaneous jobs and other accounts with the same phone cannot spend it. Only a successful payment (or a fully prepaid net invoice) consumes it. Failed or uncertain payment attempts retain the reservation for that job. Completion charges use a job-specific Stripe idempotency key. Deleting an account must not cascade-delete its phone benefit record.

Reservations for cancelled jobs and refunds require deliberate administrator reconciliation; this implementation does not automatically release them or restore already-used discounts. Payment retry and refund tools are not added by this change. A phone verification prevents reuse by the same phone, but cannot establish that two different phones belong to the same person.

## Verification and deployment

The backend needs its existing MongoDB and JWT settings, plus `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and one of `TWILIO_FROM_NUMBER`, `TWILIO_PHONE_NUMBER`, or `TWILIO_PHONE`. No new Twilio Verify service is required. Codes are generated cryptographically, stored only as a keyed hash, expire after ten minutes, allow five guesses, and have account resend and IP limits. Verification SMS consent is explicit and separate from optional account/marketing notifications.

Deploy the backend before directing clients to the new invitation link. Validate the public `/api/homeowner-referrals/invitation/FIXLO10` response. Test signup, actual SMS delivery, verification and the dashboard with a controlled account. Test Stripe charges in a test environment before taking a real payment. The local automated suite uses mocked databases and SMS/payment providers; it does not prove production configuration or actual delivery.

Local checks: `npm test --prefix server` (51 passing tests); `node client/scripts/fix-admin-jobs-syntax.mjs` and a Vite production build; `git diff --check`. The repository's existing prebuild syntax repair also corrects the admin jobs follow-up header.
