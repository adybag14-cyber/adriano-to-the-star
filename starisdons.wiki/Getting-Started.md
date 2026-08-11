# 🚀 Getting Started

This guide will help you get the **Adriano To The Star** project up and running.

## Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Git (for development)
- Node.js (optional, for local backend)
- Supabase account (for database features)

## Installation

### 1. Clone the Repository

```bash
git clone https://gitlab.com/adybag14-group/starisdons.git
cd adriano-to-the-star-clean
```

### 2. Open in Browser

The simplest way to run the project:

```bash
# Just open index.html in your browser
# Or use a local server:
python -m http.server 8000
# Then visit http://localhost:8000
```

### 3. Optional: Local Backend

If you want to run with a local backend:

```bash
cd backend
npm install
npm start
# Visit http://localhost:3000
```

## Configuration

### Supabase Setup

1. Create a Supabase project at https://supabase.com
2. Update `supabase-config.js` with your credentials:

```javascript
const SUPABASE_CONFIG = {
    url: 'https://your-project.supabase.co',
    anonKey: 'your-anon-key-here',
    enabled: true
};
```

3. Create required tables:
   - `planet_claims` - For exoplanet claiming
   - Storage bucket `user-files` - For file storage

See the [Deployment](Deployment) guide for more details.

## Project Structure

```
adriano-to-the-star/
├── index.html              # Home page
├── database.html           # Exoplanet database
├── stellar-ai.html         # AI chat interface
├── file-storage.html       # Cloud storage
├── broadband-checker.html  # Broadband deal checker
├── dashboard.html          # User dashboard
├── styles.css              # Main stylesheet
├── auth-supabase.js        # Authentication
├── database-optimized.js   # Database system
└── data/                   # Data files
```

## Next Steps

- Read the [Features](Features) documentation
- Check out the [API Reference](API-Reference)
- Learn about [Deployment](Deployment)

## Troubleshooting

### Site Not Loading
- Check browser console for errors
- Verify Supabase configuration
- Ensure all files are in the correct location

### Database Errors
- Verify Supabase credentials
- Check that tables are created
- Review Supabase dashboard for errors

### Authentication Issues
- Check Supabase Auth settings
- Verify API keys are correct
- Review browser console for errors

---

Need help? Check the [Contributing](Contributing) guide or open an issue.

