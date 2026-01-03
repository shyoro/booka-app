import type { Page, BrowserContext } from '@playwright/test';
import {
  mockRoomsResponse,
  mockRoomDetailsResponse,
  mockRoomAvailabilityResponse,
  mockLocationsResponse,
  mockBookingsResponse,
  mockCreateBookingResponse,
  mockCancelBookingResponse,
} from '../mockData';

/**
 * Centralized API mocking setup
 * All API route mocks are configured here for better maintainability
 */

/**
 * Mock user authentication
 */
export async function setupAuthMocks(page: Page, context: BrowserContext): Promise<void> {
  // Mock GET /api/v1/users/me (current user)
  await page.route('**/api/v1/users/me**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
        },
      }),
    });
  });

  // Set up authentication tokens in sessionStorage
  await context.addInitScript(() => {
    const mockAccessToken = `mock-access-token-${Date.now()}`;
    const mockRefreshToken = `mock-refresh-token-${Date.now()}`;
    sessionStorage.setItem('accessToken', mockAccessToken);
    sessionStorage.setItem('refreshToken', mockRefreshToken);
  });
}

/**
 * Mock rooms API endpoints
 */
export async function setupRoomsMocks(page: Page): Promise<void> {
  // Mock GET /api/v1/rooms (search)
  await page.route('**/api/v1/rooms**', async (route) => {
    const url = new URL(route.request().url());
    const isSearch = !url.pathname.includes('/rooms/') || url.pathname === '/api/v1/rooms';
    
    if (isSearch) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockRoomsResponse),
      });
    }
  });

  // Mock GET /api/v1/rooms/{id} (room details)
  await page.route('**/api/v1/rooms/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.match(/\/api\/v1\/rooms\/\d+$/) && !url.pathname.includes('/availability')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockRoomDetailsResponse),
      });
    }
  });

  // Mock GET /api/v1/rooms/{id}/availability
  await page.route('**/api/v1/rooms/*/availability**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockRoomAvailabilityResponse),
    });
  });

  // Mock GET /api/v1/rooms/locations
  await page.route('**/api/v1/rooms/locations**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockLocationsResponse),
    });
  });
}

/**
 * Mock bookings API endpoints
 */
export async function setupBookingsMocks(page: Page, context: BrowserContext): Promise<void> {
  // Mock PATCH /api/v1/bookings/{id}/cancel (must be first to avoid matching general route)
  await page.route('**/api/v1/bookings/*/cancel**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockCancelBookingResponse),
    });
  });

  // Mock GET /api/v1/bookings (list bookings) - use same pattern as other working routes
  await page.route('**/api/v1/bookings**', async (route) => {
    const url = new URL(route.request().url());
    const method = route.request().method();
    
    // Only match exact /api/v1/bookings path (not /bookings/{id} or /bookings/{id}/cancel)
    if (url.pathname !== '/api/v1/bookings') {
      await route.continue();
      return;
    }
    
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockBookingsResponse),
      });
      return;
    }
    
    if (method === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCreateBookingResponse),
      });
      return;
    }
    
    await route.continue();
  });
}

/**
 * Setup all API mocks
 */
export async function setupAllMocks(page: Page, context: BrowserContext): Promise<void> {
  await setupAuthMocks(page, context);
  await setupRoomsMocks(page);
  await setupBookingsMocks(page, context);
}

