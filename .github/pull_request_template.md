## Summary
<!-- What & why -->

## Safety
- [ ] No changes to **Request a Service** popups/buttons or behavior
- [ ] No changes to `vercel.json` routing / rewrites
- [ ] No hardcoded `localhost` in production code
- [ ] Admin/API calls use relative `/api/...`

## Build Metadata Guardrails
- [ ] Root `index.html` must not exist. All HTML is from `client/public/index.html`.
- [ ] `client/vercel.json` is the only Vercel config.
- [ ] `client/scripts/write-build-meta.js` exists and is invoked by `vercel-build`.
- [ ] `REACT_APP_*` keys appear in build logs and on console as values (not literals).

## Checks
- [ ] Bundle hash seen in prod matches latest deploy
- [ ] CORS ok (no Failed to fetch)
- [ ] Lighthouse OK (optional link)

## Screenshots / Proof
<!-- URLs, DevTools, validator, etc. -->