# Advanced Debugging and Error Handling System

This backend includes comprehensive debugging, error handling, and automatic recovery features.

## Features

### 1. Debug Monitor (`debug-monitor.js`)
- **Real-time logging**: Captures all errors, warnings, and info messages
- **File logging**: Automatically logs to `logs/debug-YYYY-MM-DD.log`
- **Error tracking**: Tracks error counts, types, and endpoints
- **Health checks**: Periodic system health monitoring
- **Log rotation**: Automatically rotates logs when they exceed 10MB

### 2. Error Handler (`error-handler.js`)
- **Automatic error categorization**: Classifies errors (API, WebSocket, Network, Auth)
- **Retry strategies**: Automatic retry with exponential backoff
- **Recovery actions**: Attempts to recover from common issues
- **Model fallback**: Automatically switches to alternative models on failure

### 3. Google Cloud Backend (`google-cloud-backend.js`)
- **Automatic detection**: Detects Google Cloud credentials
- **Vertex AI integration**: Uses Vertex AI when available
- **Fallback support**: Falls back to API key method if Google Cloud unavailable
- **Status monitoring**: Tracks Google Cloud availability

### 4. Auto Recovery (`auto-recovery.js`)
- **Health monitoring**: Checks system health every minute
- **API validation**: Validates Gemini API key and Google Cloud
- **Resource monitoring**: Monitors memory usage
- **Automatic recovery**: Triggers recovery actions when issues detected

## Setup

### Basic Setup (API Key Only)
```bash
# Set your Gemini API key
echo "GEMINI_API_KEY=your-api-key-here" >> .env
```

### Google Cloud Setup (Optional)
```bash
# Set Google Cloud project
echo "GOOGLE_CLOUD_PROJECT=your-project-id" >> .env
echo "GOOGLE_CLOUD_LOCATION=us-central1" >> .env

# Option 1: Service Account Key File
echo "GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json" >> .env

# Option 2: Use gcloud CLI authentication
gcloud auth application-default login
```

## Debug Endpoints

### Get Statistics
```bash
GET /debug/stats
```
Returns error statistics, counts, and recent errors.

### Get Recent Errors
```bash
GET /debug/errors?count=10
```
Returns the most recent errors (default: 10).

### System Health
```bash
GET /debug/health
```
Returns system health including memory usage, uptime, and service status.

### Reset Statistics
```bash
POST /debug/reset
```
Resets all debug statistics.

### Manual Recovery
```bash
POST /debug/recover
Content-Type: application/json

{
  "error": "Error message",
  "context": {
    "endpoint": "/api/gemini-live",
    "modelName": "gemini-2.5-flash-live"
  }
}
```

### Test Google Cloud
```bash
GET /debug/test-google-cloud
```
Tests Google Cloud Vertex AI connection.

## Error Recovery Strategies

### Gemini API Errors
- **Retries**: 3 attempts
- **Backoff**: 1 second (exponential)
- **Actions**:
  - Validates API key
  - Switches to Google Cloud if available
  - Tries alternative models

### WebSocket Errors
- **Retries**: 5 attempts
- **Backoff**: 2 seconds (exponential)
- **Actions**:
  - Attempts reconnection
  - Validates connection state

### Network Errors
- **Retries**: 3 attempts
- **Backoff**: 3 seconds (exponential)
- **Actions**:
  - Checks endpoint reachability
  - Waits for network recovery

### Authentication Errors
- **Retries**: 1 attempt
- **Actions**:
  - Logs error for manual intervention
  - Provides configuration suggestions

## Log Files

Logs are stored in `backend/logs/`:
- `debug-YYYY-MM-DD.log`: Daily log files
- Automatic rotation when files exceed 10MB
- Old logs renamed with timestamp

## Configuration

### Environment Variables
```bash
# Required
GEMINI_API_KEY=your-api-key-here

# Optional - Google Cloud
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json

# Optional - Debug Settings
DEBUG_LOG_DIR=./logs
DEBUG_MAX_LOG_SIZE=10485760  # 10MB
DEBUG_ERROR_THRESHOLD=10
DEBUG_ERROR_WINDOW=60000  # 1 minute
```

### Customization
You can customize the debug monitor in `stellar-ai-server.js`:
```javascript
const debugMonitor = require('./debug-monitor');

// Custom configuration
const customMonitor = new DebugMonitor({
    logDir: './custom-logs',
    maxLogSize: 20 * 1024 * 1024, // 20MB
    errorThreshold: 20,
    errorWindow: 120000 // 2 minutes
});
```

## Monitoring

The system automatically:
- Logs all errors with full context
- Tracks error patterns and frequencies
- Monitors system resources
- Triggers recovery when error threshold exceeded
- Provides health check endpoints

## Troubleshooting

### High Error Rate
If you see "Error threshold exceeded" warnings:
1. Check `/debug/errors` endpoint for recent errors
2. Review log files in `backend/logs/`
3. Check API key validity
4. Verify network connectivity

### Google Cloud Not Available
If Google Cloud is not detected:
1. Verify `GOOGLE_CLOUD_PROJECT` is set
2. Check credentials file exists (if using service account)
3. Run `gcloud auth application-default login` (if using gcloud CLI)
4. Check `/debug/test-google-cloud` endpoint

### Memory Issues
If memory usage is high:
1. Check `/debug/health` for memory stats
2. Review log file sizes
3. Consider increasing log rotation frequency
4. Enable garbage collection if available

## Integration

The debugging system is automatically integrated into:
- `stellar-ai-server.js`: Main server with error middleware
- `gemini-live-proxy.js`: WebSocket proxy with error handling
- All API endpoints: Automatic error catching and logging

No additional code changes needed - it works automatically!

