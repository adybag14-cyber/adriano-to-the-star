# Staging Environment Setup Guide

## Overview
This guide explains how to set up and use the staging environment for testing before production deployment.

## Staging Environment Configuration

### GitLab CI/CD Configuration
The staging environment is configured in `.gitlab-ci.yml`:

```yaml
deploy_staging:
  stage: deploy
  environment:
    name: staging
    url: https://staging.adrianotothestar.com
  only:
    - main
  when: manual
```

### Environment Variables
Set the following variables in GitLab CI/CD settings:

- `STAGING_URL`: Staging environment URL
- `STAGING_API_KEY`: Staging API key
- `STAGING_DB_URL`: Staging database URL

### Deployment Process

1. **Manual Trigger**: Staging deployment is triggered manually from GitLab CI/CD
2. **Build Process**: Same as production but deployed to staging URL
3. **Testing**: Run automated tests against staging
4. **Health Checks**: Verify staging environment is healthy
5. **Promotion**: Promote to production after validation

### Staging Features

- Full feature parity with production
- Test data isolation
- Performance monitoring
- Error tracking
- User acceptance testing

### Access
- URL: https://staging.adrianotothestar.com
- Credentials: Use test accounts (not production)

## Best Practices

1. Always test in staging before production
2. Use staging for user acceptance testing
3. Monitor staging performance
4. Keep staging data separate from production
5. Regular staging deployments for testing

