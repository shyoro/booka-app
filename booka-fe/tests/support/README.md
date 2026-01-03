# Test Support Structure

This directory contains all supporting files for E2E tests, organized using DRY principles.

## Directory Structure

```
tests/support/
├── components/          # Shared component helpers (DRY)
│   ├── CalendarHelper.ts
│   ├── SelectHelper.ts
│   └── SliderHelper.ts
├── mocks/               # Centralized API mocking
│   └── apiMocks.ts
├── utils/               # Utility functions
│   └── dateUtils.ts
├── fixtures.ts          # Playwright fixtures with POM injection
├── mockData.ts          # Mock API response data
├── SearchPage.ts        # Search page POM
├── RoomDetailsPage.ts   # Room details page POM
└── ProfilePage.ts       # Profile page POM
```

## Component Helpers

Shared helpers eliminate code duplication across page objects:

- **CalendarHelper**: Handles all calendar date picker interactions
- **SelectHelper**: Handles all select dropdown interactions
- **SliderHelper**: Handles all slider range interactions

## API Mocks

All API mocking is centralized in `mocks/apiMocks.ts`:
- `setupAllMocks()` - Sets up all mocks in one call
- `setupAuthMocks()` - Authentication mocks
- `setupRoomsMocks()` - Rooms API mocks
- `setupBookingsMocks()` - Bookings API mocks

### API Response Structure

**Important**: Mock responses must match the exact structure expected by the production code.

#### Bookings API Response Structure

The bookings API returns data in a nested structure:
```typescript
{
  success: true,
  data: {
    data: Booking[],      // Array of bookings
    pagination: {         // Pagination metadata
      page: number,
      limit: number,
      total: number,
      totalPages: number
    }
  }
}
```

The production code in `useBookings.ts` accesses bookings via `data.data.data`:
```typescript
return {
  bookings: data.data.data || [],
  pagination: data.data.pagination,
};
```

**Mock Data Location**: `mockData.ts` - `mockBookingsResponse`

**Route Matching**: The bookings endpoint is mocked using:
```typescript
await page.route('**/api/v1/bookings**', async (route) => {
  const url = new URL(route.request().url());
  // Only match exact /api/v1/bookings path
  if (url.pathname !== '/api/v1/bookings') {
    await route.continue();
    return;
  }
  // Handle GET and POST methods
});
```

### Authentication in Tests

Profile page tests require authentication:
1. `setupAuthMocks()` mocks `GET /api/v1/users/me`
2. Mock tokens are set in `sessionStorage` via `context.addInitScript()`
3. Profile page navigation waits for user API call to complete
4. Profile page then waits for bookings API call to complete

**Pattern**:
```typescript
// In ProfilePage.goto()
// 1. Navigate to home
// 2. Wait for user API response
// 3. Navigate to profile
// 4. Wait for bookings API response
// 5. Wait for UI elements to appear
```

### Debugging Route Matching Issues

If API mocks aren't working:

1. **Check route pattern**: Use `**/api/v1/bookings**` for glob patterns
2. **Verify pathname**: Check `url.pathname === '/api/v1/bookings'` in handler
3. **Check method**: Ensure GET/POST methods are handled correctly
4. **Use context.route()**: For cross-origin requests, use `context.route()` instead of `page.route()`
5. **Verify response structure**: Ensure mock data matches production API structure exactly
6. **Add logging**: Temporarily log route matches to debug:
   ```typescript
   await page.route('**/api/v1/bookings**', async (route) => {
     console.log('Matched bookings route:', route.request().url());
     // ... rest of handler
   });
   ```

## Utilities

- **dateUtils**: Date calculation helpers for tests

## Page Object Models

Each POM follows these principles:
- High-level action methods (not just locators)
- Reuse shared component helpers
- Clear, descriptive method names
- Proper TypeScript return types

### ProfilePage Specific Notes

The `ProfilePage.goto()` method:
1. Navigates to home first to initialize auth context
2. Waits for user authentication API call
3. Navigates to profile page
4. Waits for bookings API call to complete
5. Waits for UI tabs to appear

This ensures the page is fully loaded and authenticated before test assertions.

