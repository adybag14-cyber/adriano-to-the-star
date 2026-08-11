# GitLab Integrations Configuration

This document outlines recommended integrations for the Adriano To The Star project.

## Current Integrations

### ✅ GitLab Pages
- **Status:** Active
- **Purpose:** Static site hosting
- **Configuration:** Automatic via `.gitlab-ci.yml`
- **URL:** https://starisdons-d53656.gitlab.io

### ✅ Supabase
- **Status:** Active
- **Purpose:** Authentication, database, storage
- **Configuration:** See `supabase-config.js`
- **Dashboard:** https://supabase.com/dashboard/project/sepesbfytkmbgjyfqriw

## Recommended Integrations

### 1. GitLab Wiki

**Enable Wiki:**
1. Go to **Settings → General → Visibility, project features, permissions**
2. Enable **Wiki**
3. Access at: `https://gitlab.com/imtherushwar/new-starsiadr/-/wikis`

**Use Cases:**
- Detailed feature documentation
- User guides
- API documentation
- Troubleshooting guides

### 2. GitLab Issues

**Enable Issues:**
1. Go to **Settings → General → Visibility, project features, permissions**
2. Enable **Issues**
3. Access at: `https://gitlab.com/imtherushwar/new-starsiadr/-/issues`

**Use Cases:**
- Bug tracking
- Feature requests
- Task management
- User feedback

### 3. GitLab Merge Requests

**Status:** Already enabled

**Use Cases:**
- Code reviews
- Collaboration
- Quality assurance

### 4. GitLab CI/CD Variables

**Add Environment Variables:**
1. Go to **Settings → CI/CD → Variables**
2. Add variables (if needed):
   - `SUPABASE_URL` (optional, already in code)
   - `SUPABASE_ANON_KEY` (optional, already in code)

**Note:** Currently not needed as config is in `supabase-config.js`

### 5. External Integrations

#### Supabase Webhooks
- **Purpose:** Real-time updates
- **Setup:** Supabase Dashboard → Database → Webhooks
- **Use Cases:** Notify on new planet claims, user registrations

#### Google Analytics (Optional)
- **Purpose:** Site analytics
- **Setup:** Add tracking code to `index.html`
- **Privacy:** Ensure GDPR compliance

#### Sentry (Optional)
- **Purpose:** Error tracking
- **Setup:** Add Sentry SDK to pages
- **Use Cases:** Monitor JavaScript errors in production

### 6. GitLab Container Registry

**Enable Container Registry:**
1. Go to **Settings → General → Visibility, project features, permissions**
2. Enable **Container Registry**
3. Access at: `https://gitlab.com/imtherushwar/new-starsiadr/container_registry`

**Use Cases:**
- Docker images for backend services
- Currently not needed for static site

### 7. GitLab Package Registry

**Enable Package Registry:**
1. Go to **Settings → General → Visibility, project features, permissions**
2. Enable **Package Registry**
3. Access at: `https://gitlab.com/imtherushwar/new-starsiadr/-/packages`

**Use Cases:**
- NPM packages (if needed)
- Currently not needed

## Integration Setup Steps

### Enable GitLab Features

1. **Navigate to Settings:**
   ```
   Project → Settings → General → Visibility, project features, permissions
   ```

2. **Enable Features:**
   - ✅ Issues
   - ✅ Wiki
   - ✅ Merge Requests (already enabled)
   - ✅ Container Registry (optional)
   - ✅ Package Registry (optional)

3. **Set Permissions:**
   - Choose who can view/edit issues, wiki, etc.
   - Recommended: Public for issues, Maintainer+ for wiki

### Configure Webhooks (Optional)

1. **GitLab Webhooks:**
   - Go to **Settings → Webhooks**
   - Add webhook URL (e.g., for notifications)
   - Configure triggers (push, merge request, etc.)

2. **Supabase Webhooks:**
   - Go to Supabase Dashboard
   - Database → Webhooks
   - Configure for real-time events

## Monitoring Integrations

### GitLab CI/CD Monitoring
- **Location:** CI/CD → Pipelines
- **Purpose:** Track build status and deployment

### Supabase Monitoring
- **Location:** Supabase Dashboard → Logs
- **Purpose:** Monitor API usage, errors, performance

## Security Considerations

1. **Never commit secrets** to the repository
2. **Use CI/CD variables** for sensitive data (if needed)
3. **Enable branch protection** for `main` branch
4. **Review merge requests** before merging
5. **Monitor access logs** in Supabase

## Troubleshooting

### Integration Not Working
1. Check feature is enabled in Settings
2. Verify permissions
3. Check GitLab logs
4. Review integration documentation

### Webhook Failures
1. Check webhook URL is accessible
2. Verify authentication
3. Review webhook logs
4. Test with curl/Postman

---

**Current Setup:** GitLab Pages + Supabase (optimal for static site)
**Additional Integrations:** Enable as needed based on requirements

