# 🌍 Planet API Documentation

**Last Updated:** January 2025  
**Version:** 1.0.0

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Endpoints](#endpoints)
4. [Data Models](#data-models)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Examples](#examples)

---

## 🎯 Overview

This document provides API documentation for all planet-related endpoints in the Adriano To The Star platform. The API uses Supabase as the backend and provides RESTful endpoints for planet operations.

### Base URL
```
https://your-supabase-project.supabase.co/rest/v1
```

### Authentication
All endpoints require authentication via Supabase JWT tokens.

---

## 🔐 Authentication

### Getting an Auth Token

```javascript
// Using Supabase client
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;
```

### Using the Token

Include the token in the Authorization header:

```javascript
fetch(url, {
    headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json'
    }
});
```

---

## 📡 Endpoints

### Planet Claims

#### Get User's Claimed Planets
```
GET /user_claims?user_id=eq.{userId}
```

**Response:**
```json
[
    {
        "id": "uuid",
        "user_id": "uuid",
        "kepid": 12345,
        "kepler_name": "Kepler-123",
        "claimed_at": "2025-01-15T10:00:00Z",
        "status": "CONFIRMED"
    }
]
```

#### Claim a Planet
```
POST /user_claims
```

**Request Body:**
```json
{
    "user_id": "uuid",
    "kepid": 12345,
    "kepler_name": "Kepler-123",
    "status": "CONFIRMED"
}
```

**Response:**
```json
{
    "id": "uuid",
    "user_id": "uuid",
    "kepid": 12345,
    "claimed_at": "2025-01-15T10:00:00Z"
}
```

#### Check if Planet is Claimed
```
GET /user_claims?kepid=eq.{kepid}
```

---

### Planet Trading

#### Get Marketplace Listings
```
GET /planet_listings?status=eq.active
```

**Query Parameters:**
- `status`: `active`, `sold`, `cancelled`
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset

**Response:**
```json
[
    {
        "id": "uuid",
        "planet_id": "uuid",
        "seller_id": "uuid",
        "price": 100.00,
        "currency": "USD",
        "status": "active",
        "created_at": "2025-01-15T10:00:00Z"
    }
]
```

#### Create Listing
```
POST /planet_listings
```

**Request Body:**
```json
{
    "planet_id": "uuid",
    "seller_id": "uuid",
    "price": 100.00,
    "currency": "USD"
}
```

#### Buy Planet
```
POST /planet_transactions
```

**Request Body:**
```json
{
    "listing_id": "uuid",
    "buyer_id": "uuid",
    "price": 100.00
}
```

---

### Planet Favorites

#### Get User Favorites
```
GET /planet_favorites?user_id=eq.{userId}
```

#### Add to Favorites
```
POST /planet_favorites
```

**Request Body:**
```json
{
    "user_id": "uuid",
    "kepid": 12345,
    "kepler_name": "Kepler-123"
}
```

#### Remove from Favorites
```
DELETE /planet_favorites?id=eq.{favoriteId}
```

---

### Planet Bookmarks

#### Get User Bookmarks
```
GET /planet_bookmarks?user_id=eq.{userId}
```

#### Add Bookmark
```
POST /planet_bookmarks
```

**Request Body:**
```json
{
    "user_id": "uuid",
    "kepid": 12345,
    "notes": "Interesting planet"
}
```

---

### Planet Wishlist

#### Get User Wishlist
```
GET /planet_wishlist?user_id=eq.{userId}
```

#### Add to Wishlist
```
POST /planet_wishlist
```

**Request Body:**
```json
{
    "user_id": "uuid",
    "kepid": 12345,
    "priority": "high"
}
```

---

### Planet Collections

#### Get User Collections
```
GET /planet_collections?user_id=eq.{userId}
```

#### Create Collection
```
POST /planet_collections
```

**Request Body:**
```json
{
    "user_id": "uuid",
    "name": "My Favorite Planets",
    "description": "A collection of interesting exoplanets"
}
```

#### Add Planet to Collection
```
POST /planet_collection_items
```

**Request Body:**
```json
{
    "collection_id": "uuid",
    "kepid": 12345
}
```

---

### Planet Discovery Statistics

#### Get Discovery Statistics
```
GET /discovery_statistics
```

**Response:**
```json
{
    "total_discoveries": 9564,
    "confirmed": 2341,
    "candidates": 7223,
    "this_month": 12,
    "this_year": 145
}
```

#### Get User Statistics
```
GET /user_discovery_stats?user_id=eq.{userId}
```

**Response:**
```json
{
    "user_id": "uuid",
    "total_claimed": 25,
    "confirmed": 18,
    "candidates": 7,
    "rank": 42
}
```

---

### Planet Leaderboard

#### Get Leaderboard
```
GET /discovery_leaderboard?limit=eq.100&order=total_claimed.desc
```

**Response:**
```json
[
    {
        "user_id": "uuid",
        "username": "space_explorer",
        "total_claimed": 150,
        "rank": 1
    }
]
```

---

### Planet Notifications

#### Get User Notifications
```
GET /planet_notifications?user_id=eq.{userId}&read=eq.false
```

#### Mark Notification as Read
```
PATCH /planet_notifications?id=eq.{notificationId}
```

**Request Body:**
```json
{
    "read": true,
    "read_at": "2025-01-15T10:00:00Z"
}
```

---

### Planet Search History

#### Get Search History
```
GET /planet_search_history?user_id=eq.{userId}&order=created_at.desc&limit=50
```

#### Add Search Query
```
POST /planet_search_history
```

**Request Body:**
```json
{
    "user_id": "uuid",
    "query": "earth-like planets",
    "results_count": 25
}
```

---

## 📊 Data Models

### Planet
```typescript
interface Planet {
    kepid: number;
    kepler_name?: string;
    kepoi_name: string;
    status: 'CONFIRMED' | 'CANDIDATE' | 'FALSE POSITIVE';
    type: 'Earth-like' | 'Super-Earth' | 'Gas Giant' | 'Mini-Neptune';
    radius: number;        // Earth radii
    mass: number;          // Earth masses
    distance: number;      // Light years
    disc_year: number;
    score: number;         // 0-1
    availability: 'available' | 'claimed';
}
```

### User Claim
```typescript
interface UserClaim {
    id: string;
    user_id: string;
    kepid: number;
    kepler_name?: string;
    claimed_at: string;
    status: string;
}
```

### Listing
```typescript
interface Listing {
    id: string;
    planet_id: string;
    seller_id: string;
    price: number;
    currency: string;
    status: 'active' | 'sold' | 'cancelled';
    created_at: string;
}
```

---

## ⚠️ Error Handling

### Error Response Format

```json
{
    "error": {
        "code": "ERROR_CODE",
        "message": "Human-readable error message",
        "details": {}
    }
}
```

### Common Error Codes

- `400`: Bad Request - Invalid input
- `401`: Unauthorized - Missing or invalid token
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource doesn't exist
- `409`: Conflict - Resource already exists (e.g., planet already claimed)
- `500`: Internal Server Error

### Example Error Handling

```javascript
try {
    const response = await fetch(url, options);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error.message);
    }
    const data = await response.json();
    return data;
} catch (error) {
    console.error('API Error:', error);
    throw error;
}
```

---

## 🚦 Rate Limiting

### Limits
- **Standard users**: 100 requests/minute
- **Premium users**: 500 requests/minute

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642234567
```

### Handling Rate Limits

```javascript
if (response.status === 429) {
    const resetTime = response.headers.get('X-RateLimit-Reset');
    console.log('Rate limit exceeded. Reset at:', new Date(resetTime * 1000));
    // Retry after reset time
}
```

---

## 💡 Examples

### Example 1: Claim a Planet

```javascript
async function claimPlanet(kepid, keplerName) {
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/user_claims`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': SUPABASE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({
            user_id: session.user.id,
            kepid: kepid,
            kepler_name: keplerName,
            status: 'CONFIRMED'
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
    }
    
    return await response.json();
}
```

### Example 2: Get User's Claims

```javascript
async function getUserClaims(userId) {
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/user_claims?user_id=eq.${userId}`,
        {
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'apikey': SUPABASE_KEY
            }
        }
    );
    
    return await response.json();
}
```

### Example 3: Create Marketplace Listing

```javascript
async function createListing(planetId, price) {
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/planet_listings`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': SUPABASE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({
            planet_id: planetId,
            seller_id: session.user.id,
            price: price,
            currency: 'USD',
            status: 'active'
        })
    });
    
    return await response.json();
}
```

### Example 4: Add to Favorites

```javascript
async function addToFavorites(kepid, keplerName) {
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/planet_favorites`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': SUPABASE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({
            user_id: session.user.id,
            kepid: kepid,
            kepler_name: keplerName
        })
    });
    
    if (response.status === 409) {
        throw new Error('Planet already in favorites');
    }
    
    return await response.json();
}
```

---

## 🔍 Query Parameters

### Filtering

Use PostgREST filter operators:

- `eq`: Equal
- `neq`: Not equal
- `gt`: Greater than
- `gte`: Greater than or equal
- `lt`: Less than
- `lte`: Less than or equal
- `like`: Pattern match
- `ilike`: Case-insensitive pattern match
- `in`: In array
- `is`: Is null/not null

**Example:**
```
GET /user_claims?status=eq.CONFIRMED&kepid=gt.1000
```

### Ordering

Use `order` parameter:

```
GET /user_claims?order=claimed_at.desc
```

Multiple columns:
```
GET /user_claims?order=status.asc,claimed_at.desc
```

### Pagination

Use `limit` and `offset`:

```
GET /user_claims?limit=50&offset=100
```

### Selecting Columns

Use `select` parameter:

```
GET /user_claims?select=kepid,kepler_name,status
```

---

## 📝 Notes

- All timestamps are in ISO 8601 format (UTC)
- All monetary values are in USD unless specified
- IDs are UUIDs unless specified (kepid is numeric)
- Use `Prefer: return=representation` to get the created/updated object back

---

## 🔗 Related Documentation

- [Supabase REST API](https://supabase.com/docs/reference/javascript/introduction)
- [PostgREST API](https://postgrest.org/en/stable/api.html)
- [Planet Features Documentation](./PLANET-FEATURES-DOCUMENTATION.md)

---

**API Documentation maintained by:** Adriano To The Star Development Team

