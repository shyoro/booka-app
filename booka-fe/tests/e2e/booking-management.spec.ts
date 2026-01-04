import { test, expect } from '../support/fixtures';
import { setupAuthMocks, setupBookingsMocks } from '../support/mocks/apiMocks';

/**
 * Integration tests for Booking Management Flow
 * Tests are isolated from the real database using API mocking
 */
test.describe('Booking Management Flow', () => {
  /**
   * Set up only auth and bookings mocks before each test
   * Rooms mocks are not needed for booking management
   */
  test.beforeEach(async ({ page, context }) => {
    await setupAuthMocks(page, context);
    await setupBookingsMocks(page, context);
  });

  test('should cancel a booking', async ({ profilePage }) => {
    await profilePage.goto();
    await profilePage.verifyBookingExists(1);
    
    // Wait for the cancel button to be visible and enabled
    const cancelBtn = profilePage.page.getByTestId('cancel-booking-btn-1');
    await expect(cancelBtn).toBeVisible();
    
    // Set up promise to wait for bookings refetch after cancellation
    const bookingsRefetchPromise = profilePage.page.waitForResponse(
      (response) => {
        try {
          const url = new URL(response.url());
          return url.pathname === '/api/v1/bookings' &&
                 response.request().method() === 'GET' &&
                 response.status() === 200;
        } catch {
          return false;
        }
      },
      { timeout: 10000 }
    ).catch(() => null);
    
    // Cancel the booking
    await profilePage.cancelBooking(1);
    
    // Wait for React Query to refetch bookings after invalidation
    await bookingsRefetchPromise;
    
    // Wait for the cancel button to disappear (booking moved to past tab or removed)
    // The booking status changes to 'cancelled', which moves it to the past tab
    await expect(cancelBtn).not.toBeVisible({ timeout: 5000 });
  });

  test('should switch between upcoming and past bookings tabs', async ({ profilePage }) => {
    await profilePage.goto();
    
    // Verify we start on upcoming tab
    await expect(profilePage.upcomingTab).toHaveAttribute('data-state', 'active');
    
    // Switch to past tab
    await profilePage.switchToPast();
    await expect(profilePage.pastTab).toHaveAttribute('data-state', 'active');
    
    // Switch back to upcoming tab
    await profilePage.switchToUpcoming();
    await expect(profilePage.upcomingTab).toHaveAttribute('data-state', 'active');
  });
});

