# 🔐 Authentication System Setup Guide

## Overview

The authentication system has been fully implemented with:

- ✅ User registration with bcrypt password hashing
- ✅ User login with JWT tokens
- ✅ Groups and posts system
- ✅ Secure token-based authentication

## Backend Server

### Starting the Authentication Server

The authentication server is now the default server. To start it:

```bash
cd backend
npm install  # If you haven't already
npm start    # Starts auth-server.js on port 3000
```

Or for development with auto-reload:

```bash
npm run dev
```

### Server Endpoints

The authentication server (`auth-server.js`) provides:

- **POST** `/api/auth/register` - Register new user
- **POST** `/api/auth/login` - Login user
- **GET** `/api/auth/me` - Get current user (requires auth)
- **GET** `/api/groups` - Get all groups
- **POST** `/api/groups/:id/join` - Join a group (requires auth)
- **GET** `/api/posts` - Get all posts (optionally filtered by group)
- **POST** `/api/posts` - Create a post (requires auth)
- **POST** `/api/posts/:id/like` - Like a post (requires auth)
- **POST** `/api/posts/:id/comments` - Add comment (requires auth)

### Data Storage

The server stores data in JSON files:

- `backend/database/users.json` - User accounts (passwords are hashed)
- `backend/database/groups.json` - Groups and memberships
- `backend/database/posts.json` - Posts and comments
- `backend/logs/access.log` - Access logs
- `backend/logs/error.log` - Error logs

## Frontend Integration

### Pages with Authentication

All these pages now have working login/register:

- ✅ `members.html` - Member portal
- ✅ `followers.html` - Followers page
- ✅ `groups.html` - Groups and posts
- ✅ `dashboard.html` - User dashboard
- ✅ `database.html` - Planet claiming (requires login)

### How It Works

1. **Registration Flow:**
    - User fills out registration form
    - Frontend sends request to `/api/auth/register`
    - Backend validates input, hashes password, creates user
    - Backend returns JWT token
    - Frontend stores token in localStorage
    - User is automatically logged in

2. **Login Flow:**
    - User enters username/email and password
    - Frontend sends request to `/api/auth/login`
    - Backend verifies credentials
    - Backend returns JWT token
    - Frontend stores token in localStorage
    - User is logged in

3. **Protected Routes:**
    - Frontend checks for token in localStorage
    - Token is sent in `Authorization: Bearer <token>` header
    - Backend verifies token on each request
    - If token is invalid, user is logged out

## Security Features

- **Password Hashing:** bcrypt with 12 salt rounds
- **JWT Tokens:** Expire after 7 days
- **Token Validation:** Every protected request validates token
- **Input Validation:** Username (min 3 chars), Password (min 8 chars)
- **Error Handling:** Comprehensive error messages without exposing sensitive info

## Testing

1. Start the backend server: `npm start` in `backend/` directory
2. Open any page with login (e.g., `members.html`)
3. Click "Login" button
4. Click "Register" link
5. Fill in the form and create an account
6. You should be automatically logged in

## Troubleshooting

### "Failed to fetch" Error

- Make sure the backend server is running on port 3000
- Check that `npm start` was run in the `backend/` directory
- Verify the server is accessible at `http://localhost:3000/health`

### "Cannot connect to server" Error

- Backend server is not running
- Start it with `npm start` in the `backend/` directory

### Registration/Login Not Working

- Check browser console for errors
- Verify backend server logs for errors
- Ensure all dependencies are installed: `npm install` in `backend/`

## Notes

- The authentication server runs on port 3000 by default
- Music server can run separately on a different port if needed
- Planet server runs on port 3002
- Stellar AI server runs on port 3001

All servers can run simultaneously on different ports.
