# GitLab Pages Configuration

This project is configured for automatic deployment to GitLab Pages.

## How It Works

1. **Push to Main Branch:** Every push to the `main` branch triggers the CI/CD pipeline
2. **Build Process:** The `.gitlab-ci.yml` script copies all necessary files to the `public/` directory
3. **Deployment:** GitLab Pages automatically serves files from the `public/` directory
4. **Live Site:** Your site is available at `https://starisdons-d53656.gitlab.io`

## Current Configuration

The `.gitlab-ci.yml` file:
- Uses Alpine Linux for fast builds
- Copies all HTML, CSS, JS, and asset files
- Creates the `public/` directory structure
- Deploys automatically on every push to `main`

## Accessing Your Site

**Live URL:** https://starisdons-d53656.gitlab.io

## Custom Domain (Optional)

To use a custom domain:

1. Go to **Settings → Pages** in your GitLab project
2. Add your custom domain
3. Configure DNS records as instructed
4. Enable SSL certificate

## CI/CD Pipeline Status

Check pipeline status:
- Go to **CI/CD → Pipelines** in your GitLab project
- View build logs and deployment status
- Fix any errors that appear

## Manual Deployment

If automatic deployment fails:

1. Check `.gitlab-ci.yml` syntax
2. Verify all files are committed
3. Check pipeline logs for errors
4. Ensure `main` branch is protected (optional)

## Troubleshooting

### Site Not Updating
- Wait 1-2 minutes for GitLab Pages to rebuild
- Clear browser cache (Ctrl+F5)
- Check pipeline status in GitLab

### 404 Errors
- Verify file paths are correct
- Check that files are in the root directory (not subdirectories)
- Ensure `.gitlab-ci.yml` copies all necessary files

### Build Failures
- Check CI/CD pipeline logs
- Verify file permissions
- Ensure all dependencies are included

---

**Note:** GitLab Pages is free for public repositories and provides automatic HTTPS.

