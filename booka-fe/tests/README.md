# Playwright E2E Testing

This directory contains end-to-end tests for the Room Booking application using Playwright with the Page Object Model (POM) pattern.

## Structure

```
tests/
├── e2e/
│   └── room-booking.spec.ts    # Integration tests
└── support/
    ├── fixtures.ts             # Playwright fixtures with POM injection
    ├── mockData.ts             # API response mocks
    ├── SearchPage.ts           # Search page POM
    ├── RoomDetailsPage.ts      # Room details page POM
    └── ProfilePage.ts           # Profile page POM
```

## Setup

1. Install Playwright dependencies:
```bash
npm install -D @playwright/test
npx playwright install
```

2. Ensure the dev server is running (or let Playwright start it automatically):
```bash
npm run dev
```

## Running Tests

```bash
# Run all tests
npm run test:e2e

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug
```

## Test Architecture

### Page Object Model (POM)

Each page has a corresponding POM class that encapsulates:
- Locators for page elements
- High-level action methods (e.g., `searchForRoom()`, `completeBooking()`)
- Verification methods

### Fixtures

The `fixtures.ts` file extends Playwright's base test to automatically inject POMs:
- `searchPage` - SearchPage instance
- `roomDetailsPage` - RoomDetailsPage instance
- `profilePage` - ProfilePage instance

### API Mocking

All tests use `page.route()` to mock API responses, ensuring:
- Tests run in isolation from the real database
- Deterministic test results
- Fast test execution

Mock data is defined in `mockData.ts` and includes:
- Room search results
- Room details
- Room availability
- Bookings list
- Booking creation/cancellation responses

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '../support/fixtures';

test('should perform search', async ({ searchPage }) => {
  await searchPage.goto();
  await searchPage.searchForRoom({ location: 'New York' });
  await searchPage.verifySearchResults();
});
```

### Using Multiple POMs

```typescript
test('should complete booking flow', async ({ 
  searchPage, 
  roomDetailsPage, 
  profilePage 
}) => {
  await searchPage.goto();
  await searchPage.clickRoomCard(1);
  await roomDetailsPage.completeBooking('2024-12-20', '2024-12-25');
  await expect(profilePage.page).toHaveURL(/.*\/profile/);
});
```

### Mocking API Responses

API mocking is set up in `beforeEach` hooks. To customize mocks for specific tests:

```typescript
test('should handle API error', async ({ page, searchPage }) => {
  await page.route('**/api/v1/rooms**', async (route) => {
    await route.fulfill({
      status: 500,
      body: JSON.stringify({ error: 'Server error' }),
    });
  });
  
  await searchPage.goto();
  // Test error handling...
});
```

## Handling shadcn/ui Components

### Date Picker

The POMs handle Radix UI date pickers by:
1. Clicking the trigger button to open the popover
2. Waiting for the calendar to be visible
3. Clicking the day button using `data-test` attribute
4. Waiting for the popover to close

### Select Dropdowns

Radix Select components are handled by:
1. Clicking the trigger to open the portal
2. Finding the item in the portal using `data-test` attribute
3. Clicking the item

### Sliders

Price sliders use mouse drag interactions:
1. Opening the popover
2. Finding the slider track
3. Dragging thumbs to desired positions

## Best Practices

1. **Use `data-test` attributes**: All interactive elements should have `data-test` attributes
2. **High-level actions**: POMs should provide high-level methods, not just locators
3. **Web First assertions**: Use Playwright's `expect` for automatic retrying
4. **Isolation**: Each test should be independent and mock all API calls
5. **Wait strategies**: Use `waitFor()` and `waitForLoadState()` appropriately

## Configuration

The Playwright configuration (`playwright.config.ts`) includes:
- `testIdAttribute: 'data-test'` - Enables `getByTestId()` method
- Parallel execution for faster test runs
- Tracing on first retry for debugging
- Automatic dev server startup

## Troubleshooting

### Tests fail with "Element not found"
- Ensure `data-test` attributes are present on elements
- Check that popovers/portals are fully loaded before interaction
- Use `waitFor()` for dynamic content

### Slider interactions not working
- Radix sliders use portals - ensure popover is open
- Use mouse drag instead of click for precise control
- Wait for slider to be visible before interaction

### API mocks not working
- Verify route patterns match actual API URLs
- Check that mocks are set up in `beforeEach` hooks
- Ensure response format matches expected structure

