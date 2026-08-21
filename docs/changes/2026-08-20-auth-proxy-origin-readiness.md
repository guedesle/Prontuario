# Auth readiness: reverse proxy origin alignment

## Context

Google OAuth can fail at callback time even when credentials and `APP_URL` are valid if the reverse proxy presents the application with a protocol or host inconsistent with the public origin. This is especially relevant to state/cookie correlation behind managed hosting proxies.

## Change

`GET /api/health/auth` now evaluates the effective external request topology using `x-forwarded-proto` and `x-forwarded-host` when present, with a safe fallback to the request URL/Host header.

The public response continues to expose **only booleans**. It now includes:

- `externalHttps`;
- `externalHostMatchesAppUrl`;
- `requestTopologyAligned`.

No hostname, IP address, e-mail, OAuth credential, secret, cookie or patient data is returned.

## Safety

- The check is diagnostic only and does not disable state, PKCE or CSRF validation.
- The route remains public only at the exact path `/api/health/auth`; child routes remain protected.
- A reverse-proxy mismatch makes readiness fail closed (`503`) rather than claiming that OAuth is ready.
- Direct internal HTTP between proxy and Node remains supported when the proxy correctly provides `x-forwarded-proto: https` and the public host.

## Operational use

After deployment, `/api/health/auth` can distinguish a static configuration problem from a public-origin/proxy mismatch before repeating the human Google login test. A `ready` result still does not replace the required successful login with an authorized account and rejection of an unauthorized account.
