# Meta App Review Mode

This document describes how to enable the dedicated **Meta App Review** administrator
account for the Fixlo application and explains the environment variables required.

---

## Purpose

When submitting a Fixlo integration to Meta for App Review, Meta's team requires a
working test account that can log in and demonstrate the following features:

- Admin Dashboard (system overview & metrics)
- Social Media Manager (Facebook / Instagram connection & scheduling)
- Meta Integration (Meta Lead Ads webhook & lead management)
- Lead Management (leads list, audit, reconciliation)
- Facebook Connect (OAuth connection flow)

The review account is completely separate from the production owner/admin account and
is restricted to those five feature areas by a scoped permissions array in its JWT.

---

## Enabling Review Mode

### 1. Set environment variables

Add the following variables to your deployment environment (e.g. Render → Environment):

```
META_REVIEW_MODE=true
META_REVIEW_PASSWORD=<generate a strong random secret — see below>
```

**Generating a secure password:**

```bash
# macOS / Linux
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Store the generated value as `META_REVIEW_PASSWORD`. You will need it when logging
in as the review account.

### 2. Restart the server

On the next server startup, the initialization script (`server/scripts/initMetaReviewAdmin.js`)
will automatically create the `review@fixloapp.com` account in MongoDB **if it does not
already exist**.

If the account was already created in a previous run it will not be touched.

---

## Login Credentials

| Field    | Value                           |
| -------- | ------------------------------- |
| Email    | `review@fixloapp.com`           |
| Password | Value of `META_REVIEW_PASSWORD` |

Log in via the normal Fixlo admin login page (`/admin.html` → login form → POST `/api/auth/login`).

---

## Scoped Permissions

The review account receives a JWT with the following `permissions` array:

| Permission key          | Allowed feature area             |
| ----------------------- | -------------------------------- |
| `dashboard`             | Admin Dashboard overview & stats |
| `social_media_manager`  | Social Media Manager (`/api/social/*`) |
| `meta_integration`      | Meta Lead Ads admin (`/api/admin/meta-leads/*`) |
| `lead_management`       | Lead management endpoints        |
| `facebook_connect`      | Facebook OAuth connection flow   |

Any admin route **not** covered by these permissions returns `403 Forbidden` for the
review account (e.g. pro management, job scheduling, payouts, SMS tests).

---

## Data Privacy (Production)

If the review environment contains real customer data:

- PII fields (email, phone, address, name, etc.) are automatically **masked** before
  being returned to the review account in lead-listing and lead-detail endpoints.
- Masked values use the format `r****@***.***` (email) or `+12***` (phone).
- Aggregate counts, metrics, and configuration data are returned unmasked.

To use a clean staging database for the review instead, point `MONGODB_URI` to a
staging cluster and leave `META_REVIEW_MODE=true` only on that deployment.

---

## Disabling Review Mode

Once the Meta App Review is approved:

1. Set `META_REVIEW_MODE=false` (or remove the variable entirely).
2. Restart the server.
3. The `review@fixloapp.com` account remains in MongoDB but cannot be used to log in
   while `META_REVIEW_MODE` is not `true`.

To fully remove the account from the database, run:

```javascript
// In a MongoDB shell or admin script
db.reviewadmins.deleteOne({ email: "review@fixloapp.com" });
```

---

## Summary of Required Environment Variables

| Variable              | Required | Description                                              |
| --------------------- | -------- | -------------------------------------------------------- |
| `META_REVIEW_MODE`    | Yes      | Set to `true` to enable review mode. `false` to disable. |
| `META_REVIEW_PASSWORD`| Yes (when enabled) | Password for `review@fixloapp.com`. Must be a strong random secret. Never commit this value. |

---

## Security Checklist

- [ ] `META_REVIEW_PASSWORD` is stored only in the deployment environment, never in source code.
- [ ] `META_REVIEW_MODE` is set to `false` (or absent) in all non-review environments.
- [ ] Review account is removed or disabled once Meta App Review is complete.
- [ ] If using a production database, verify that PII masking is covering all customer data fields.
