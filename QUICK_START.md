# LiveKit Gemini Agent - Quick Start Guide

## ✅ Setup Complete!

All environment variables are configured and ready to use.

## Environment Variables

The following are set in `setup_env.ps1`:

- **LIVEKIT_URL**: `wss://gemini-integration-pxcg6ngt.livekit.cloud`
- **LIVEKIT_API_KEY**: `API2L4oYScFxfvr`
- **LIVEKIT_API_SECRET**: `vgdeTSniXEACMV4tLePmPEGw48HIEPL8xsxDKKlwJ8U`
- **GOOGLE_API_KEY**: `GEMINI_API_KEY_2`

## Quick Start

### 1. Set up environment (run once per session)

```powershell
.\setup_env.ps1
```

### 2. Test the setup

```powershell
python test_full_setup.py
```

### 3. Run the agent

**Console mode** (testing, no server needed):
```powershell
python livekit_agent.py console
```

**Development mode** (with hot reload):
```powershell
python livekit_agent.py dev
```

**Production mode**:
```powershell
python livekit_agent.py start
```

## Agent Configuration

- **Model**: `gemini-2.5-flash-native-audio-preview-09-2025`
- **Voice**: `Puck`
- **Temperature**: `0.8`
- **Modalities**: `AUDIO` (native audio support)

## Features

- ✅ Native audio support with Gemini Live API
- ✅ Real-time voice conversations
- ✅ Built-in turn detection
- ✅ Support for thinking mode (in preview model)
- ✅ Can enable affective dialog and proactive audio

## Troubleshooting

If you encounter issues:

1. **Verify environment variables are set**:
   ```powershell
   python test_full_setup.py
   ```

2. **Check API keys are valid**:
   - LiveKit credentials should work with your LiveKit Cloud account
   - Gemini API key should be active in Google AI Studio

3. **Test in console mode first**:
   ```powershell
   python livekit_agent.py console
   ```

## Additional Resources

- [LiveKit Agents Documentation](https://docs.livekit.io/agents)
- [Gemini Live API Plugin Docs](https://docs.livekit.io/agents/models/google/gemini-live-api)
- [Gemini API Documentation](https://ai.google.dev/gemini-api/docs)

