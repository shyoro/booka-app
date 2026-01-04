import { test, expect } from '../support/fixtures';
import { setupAuthMocks, setupRoomsMocks, setupBookingsMocks } from '../support/mocks/apiMocks';
import { getDateRange } from '../support/utils/dateUtils';

/**
 * Integration tests for Room Booking Flow
 * Tests are isolated from the real database using API mocking
 */
test.describe('Booking Flow', () => {
  /**
   * Set up auth, rooms, and bookings mocks before each test
   */
  test.beforeEach(async ({ page, context }) => {
    await setupAuthMocks(page, context);
    await setupRoomsMocks(page);
    await setupBookingsMocks(page, context);
  });

  test('should navigate to room details and complete booking', async ({ searchPage, roomDetailsPage }) => {
    await searchPage.goto();
    await searchPage.submitSearch();
    await searchPage.verifySearchResults();

    await searchPage.clickRoomCard(1);
    await roomDetailsPage.verifyRoomDetails();

    const { checkIn, checkOut } = getDateRange(7, 10);
    await roomDetailsPage.selectDates(checkIn, checkOut);
    await roomDetailsPage.verifyBookingEnabled();

    await roomDetailsPage.clickBookNow();
    await expect(roomDetailsPage.page).toHaveURL(/.*\/profile/);
  });

  test('should show booking button as disabled when dates are not selected', async ({ roomDetailsPage }) => {
    await roomDetailsPage.goto(1);
    await roomDetailsPage.verifyRoomDetails();

    // Booking button should be disabled without dates
    await roomDetailsPage.verifyBookingDisabled();
  });
});

