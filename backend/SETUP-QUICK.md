# Quick Setup Guide

## Basic Setup (API Key Only)

1. **Set your Gemini API key:**
   ```bash
   echo "GEMINI_API_KEY=your-api-key-here" >> .env
   ```

2. **Start the server:**
   ```bash
   npm run start-stellar-ai
   ```

That's it! The debugging system will automatically:
- ✅ Monitor all errors
- ✅ Log to `backend/logs/` directory
- ✅ Track error patterns
- ✅ Provide health check endpoints

## Optional: Google Cloud Setup

If you want to use Google Cloud Vertex AI (for higher rate limits):

1. **Set Google Cloud project:**
   ```bash
   echo "GOOGLE_CLOUD_PROJECT=your-project-id" >> .env
   echo "GOOGLE_CLOUD_LOCATION=us-central1" >> .env
   ```

2. **Authenticate (choose one):**
   
   **Option A: Service Account Key**
   ```bash
   echo "GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json" >> .env
   ```
   
   **Option B: gcloud CLI**
   ```bash
   gcloud auth application-default login
   ```

3. **Install Google Cloud SDK:**
   ```bash
   npm install @google-cloud/aiplatform
   ```

The system will automatically detect and use Google Cloud when available!

## Debug Endpoints

Once running, access:
- `http://localhost:3001/debug/stats` - Error statistics
- `http://localhost:3001/debug/errors` - Recent errors
- `http://localhost:3001/debug/health` - System health
- `http://localhost:3001/debug/test-google-cloud` - Test Google Cloud

## Troubleshooting

**No npm command?**
- Make sure Node.js is installed and in PATH
- Or use `node` directly: `node backend/stellar-ai-server.js`

**API key errors?**
- Check `.env` file exists in `backend/` directory
- Verify API key is correct
- Check `/debug/stats` endpoint for details

**Google Cloud not working?**
- Verify credentials file exists
- Check project ID is correct
- Run `/debug/test-google-cloud` endpoint

For more details, see `README-DEBUGGING.md`

