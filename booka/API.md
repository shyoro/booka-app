# Booka API - Quick Reference

## Base URL
- **Development**: `http://localhost:3000/api/v1`
- **Production**: `https://api.booka.com/api/v1` (update when deployed)

## Documentation
- **Swagger UI**: `http://localhost:3000/api` (interactive docs)
- **OpenAPI JSON**: `http://localhost:3000/api-json` (for code generation)

## Authentication
Protected endpoints require JWT token in header:
```
Authorization: Bearer <your-access-token>
```

## Quick Start for React

### 1. Install axios
```bash
npm install axios
```

### 2. Create API client
```typescript
// src/lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### 3. Use in components
```typescript
// Login example
const response = await api.post('/auth/login', {
  email: 'user@example.com',
  password: 'password123',
});

// Save tokens
localStorage.setItem('accessToken', response.data.data.tokens.accessToken);
localStorage.setItem('refreshToken', response.data.data.tokens.refreshToken);

// Get bookings
const bookings = await api.get('/bookings');
```

## Endpoints

### Auth
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - Logout (protected)

### Rooms
- `GET /rooms` - Search rooms (query params: location, dateFrom, dateTo, capacity, etc.)
- `GET /rooms/:id` - Get room details
- `GET /rooms/:id/availability` - Check availability

### Bookings (protected)
- `POST /bookings` - Create booking
- `GET /bookings` - Get user's bookings
- `GET /bookings/:id` - Get booking details
- `DELETE /bookings/:id` - Cancel booking

### Users (protected)
- `GET /users/me` - Get current user profile
- `PATCH /users/me` - Update current user profile

## Response Format

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message"
  }
}
```

## Generate TypeScript Types (Optional)

If you want type safety, generate types from OpenAPI:

```bash
# Install once
npm install -D openapi-typescript

# Generate types (run when API changes)
npx openapi-typescript http://localhost:3000/api-json -o api-types.ts
```

Then use in your React project:
```typescript
import type { paths } from './api-types';

type Booking = paths['/bookings']['get']['responses']['200']['content']['application/json']['data']['data'][0];
```

