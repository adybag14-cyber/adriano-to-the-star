# Adriano To The Star Form Mailer

Local dev:

```powershell
npx wrangler dev --config wrangler-form.toml --port 8787
```

Test endpoint:

```powershell
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8787/api/test-form -ContentType 'application/json' -Body (@{
  name = 'Local Test'
  email = 'tester@example.com'
  topic = 'General test'
  message = 'This is a local test message from Wrangler.'
  consent = $true
  page = 'local'
  submittedAt = (Get-Date).ToUniversalTime().ToString('o')
} | ConvertTo-Json)
```

Deploy:

```powershell
npx wrangler deploy --config wrangler-form.toml
```

The Worker uses Cloudflare Email Service through the `EMAIL` binding. The sender domain must be enabled for Cloudflare Email Service or Email Routing before real delivery will work.
