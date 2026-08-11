# 🤖 Stellar AI - Complete Setup Guide

Your intelligent cosmic assistant powered by Puter.js AI!

## ✨ Features

### 💬 **Natural Conversations**
- Chat with an advanced AI about astronomy, exoplanets, and space
- Context-aware responses
- Conversation history

### 🖼️ **Image Upload & Analysis**
- Upload multiple images (up to 10MB each)
- Visual content analysis
- Image preview in chat

### 📚 **Persistent Chat History**
- Multiple chat sessions
- Sidebar with chat history
- Search through old conversations
- Export chats to text files

### 👤 **User Authentication**
- Login to save chats across devices
- Cloud sync via backend API
- Guest mode with localStorage

### 🎨 **Beautiful UI**
- Cursor-style dark interface
- Smooth animations
- Mobile responsive
- Golden cosmic theme

---

## 🚀 Quick Start

### Frontend Only (No Backend)

Visit: `https://your-site.gitlab.io/stellar-ai.html`

**Works immediately with:**
- ✅ Local chat history (localStorage)
- ✅ AI responses (Puter.js or fallback)
- ✅ Image preview (base64)
- ✅ Export functionality

### With Backend (Full Features)

**1. Install Dependencies:**
```bash
cd backend
npm install
```

**2. Start Stellar AI Server:**
```bash
npm run start-stellar-ai
```

**3. Update Frontend:**
Edit `stellar-ai.js` line ~450:
```javascript
const BACKEND_URL = 'http://localhost:3001'; // Or your deployed URL
```

**4. Access:**
- Frontend: `http://localhost/stellar-ai.html`
- Backend API: `http://localhost:3001`

---

## 📡 API Endpoints

### Health Check
```
GET /health
```
Response:
```json
{
  "status": "healthy",
  "chatsCount": 5,
  "imagesCount": 12
}
```

### Save Chat
```
POST /api/chats/:userId
Content-Type: application/json

{
  "chats": [...]
}
```

### Get Chats
```
GET /api/chats/:userId
```

### Upload Image
```
POST /api/upload
Content-Type: multipart/form-data

image: <file>
```

Response:
```json
{
  "success": true,
  "url": "http://localhost:3001/api/images/img_1234567890.jpg",
  "filename": "img_1234567890.jpg"
}
```

### Get Image
```
GET /api/images/:filename
```

---

## 🔧 Configuration

### Environment Variables (`.env`)

Create `backend/.env`:
```env
STELLAR_AI_PORT=3001
NODE_ENV=development

# Optional: Puter.js API Key
PUTER_API_KEY=your_puter_api_key_here
```

### Puter.js Setup

1. **Get API Key**: Visit [puter.com](https://puter.com)
2. **Add to HTML** (already included):
```html
<script src="https://js.puter.com/v2/"></script>
```

3. **Initialize in JS** (already done):
```javascript
if (typeof puter !== 'undefined') {
    const response = await puter.ai.chat(messages);
}
```

---

## 💡 Usage Examples

### Basic Chat
1. Visit `/stellar-ai.html`
2. Type: "Tell me about exoplanets"
3. Press Enter or click Send

### Image Upload
1. Click 📎 button
2. Select image(s)
3. Add message (optional)
4. Send

### Save Progress
1. Click "Login to Save"
2. Enter credentials
3. Chats auto-save to backend

### Export Chat
1. Click "📥 Export"
2. Downloads as `.txt` file

---

## 🎨 Customization

### Change Theme Colors
Edit `stellar-ai-styles.css`:
```css
/* Golden accent */
.send-btn {
    background: linear-gradient(135deg, #ba944f, #ffd700);
}

/* Change to blue */
.send-btn {
    background: linear-gradient(135deg, #4a9eff, #6ab8ff);
}
```

### Add Custom Prompts
Edit `stellar-ai.js` in `getWelcomeHTML()`:
```javascript
<button class="example-prompt" onclick="usePrompt('Your custom prompt')">
    Your custom prompt
</button>
```

### Modify AI Responses
Edit fallback responses in `getFallbackResponse()`:
```javascript
const responses = {
    'your_keyword': 'Your custom response',
    // ...
};
```

---

## 🚢 Deployment

### Option 1: GitLab Pages (Frontend Only)
Already done! Just push to GitLab.

### Option 2: Heroku (Backend)
```bash
cd backend
heroku create your-stellar-ai
git push heroku main
```

Update frontend:
```javascript
const BACKEND_URL = 'https://your-stellar-ai.herokuapp.com';
```

### Option 3: Railway.app
1. Connect GitLab repo
2. Set root directory to `backend/`
3. Deploy automatically
4. Update BACKEND_URL in frontend

### Option 4: DigitalOcean/VPS
```bash
# SSH into server
git clone your-repo
cd backend
npm install
npm install -g pm2
pm2 start stellar-ai-server.js
pm2 save
pm2 startup
```

---

## 🔒 Security

### Recommended Settings

1. **Add Rate Limiting:**
```javascript
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use('/api/', limiter);
```

2. **Sanitize User Input:**
```javascript
const validator = require('validator');
const sanitized = validator.escape(userInput);
```

3. **CORS Configuration:**
```javascript
app.use(cors({
    origin: 'https://your-site.gitlab.io',
    credentials: true
}));
```

4. **File Upload Limits:**
Already configured in `multer`:
```javascript
limits: { fileSize: 10 * 1024 * 1024 } // 10MB
```

---

## 🐛 Troubleshooting

### Puter.js Not Loading
**Check Console:**
```javascript
console.log(typeof puter); // Should be 'object'
```

**Fix:** Ensure CDN is accessible:
```html
<script src="https://js.puter.com/v2/"></script>
```

### Images Not Uploading
**Check File Size:**
- Must be < 10MB
- Must be image type (jpg, png, gif, webp)

**Check Backend:**
```bash
curl http://localhost:3001/health
```

### Chat History Not Saving
**Check LocalStorage:**
```javascript
console.log(localStorage.getItem('stellarAI_chats'));
```

**Clear and Retry:**
```javascript
localStorage.clear();
location.reload();
```

### Backend Not Starting
**Check Port:**
```bash
netstat -ano | findstr :3001    # Windows
lsof -i :3001                   # Mac/Linux
```

**Kill Process:**
```bash
taskkill /PID <pid> /F          # Windows
kill -9 <pid>                   # Mac/Linux
```

---

## 📊 Data Storage

### Frontend (LocalStorage)
- Max ~10MB per domain
- Survives page reloads
- Cleared on browser reset

### Backend (JSON Files)
Location: `backend/stellar-ai-data/`
```
stellar-ai-data/
├── chats/
│   ├── user1@email.com.json
│   └── user2@email.com.json
└── images/
    ├── img_1234567890.jpg
    └── img_0987654321.png
```

---

## 🎯 Advanced Features

### Add Voice Input
```javascript
const recognition = new webkitSpeechRecognition();
recognition.onresult = (event) => {
    document.getElementById('message-input').value = event.results[0][0].transcript;
};
```

### Add Markdown Support
Install:
```bash
npm install marked
```

Use:
```javascript
import { marked } from 'marked';
const html = marked(aiResponse);
```

### Add Code Syntax Highlighting
```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
```

---

## 📝 License

MIT License - Feel free to modify and use!

## 🆘 Support

- Check browser console for errors (F12)
- Review backend logs
- Test API endpoints with curl/Postman
- Ensure Puter.js SDK is loaded

---

## 🎉 You're All Set!

Visit **`/stellar-ai.html`** and start chatting! 🚀

The AI is ready to answer questions about:
- 🪐 Exoplanets
- 🌌 Galaxies
- 🔭 Space Exploration
- 📡 Kepler Mission
- ⭐ Astronomy
- And more!

Enjoy your cosmic conversations! ✨

