import { test, expect } from '../support/fixtures';
import { setupAllMocks } from '../support/mocks/apiMocks';
import { getDateRange } from '../support/utils/dateUtils';

/**
 * Integration tests for Room Booking application
 * Tests are isolated from the real database using API mocking
 */
test.describe('Room Booking Integration Tests', () => {
  /**
   * Set up API mocks before each test
   */
  test.beforeEach(async ({ page, context }) => {
    await setupAllMocks(page, context);
  });

  test.describe('Search & Filter Flow', () => {
    test('should display search form and perform search with location filter', async ({ searchPage }) => {
      await searchPage.goto();

      await expect(searchPage.locationSelect).toBeVisible();
      await expect(searchPage.checkInBtn).toBeVisible();
      await expect(searchPage.checkOutBtn).toBeVisible();
      await expect(searchPage.guestsSelect).toBeVisible();
      await expect(searchPage.searchSubmitBtn).toBeVisible();

      await searchPage.searchForRoom({ location: 'New York' });
      await searchPage.verifySearchResults();

      const roomCount = await searchPage.getRoomCount();
      expect(roomCount).toBeGreaterThan(0);
    });

    test('should filter rooms by date range', async ({ searchPage }) => {
      await searchPage.goto();

      const { checkIn, checkOut } = getDateRange(7, 10);

      await searchPage.searchForRoom({ checkIn, checkOut });
      await searchPage.verifySearchResults();
    });

    test('should filter rooms by guests count', async ({ searchPage }) => {
      await searchPage.goto();

      await searchPage.searchForRoom({
        guests: 2,
      });

      await searchPage.verifySearchResults();
    });

    test('should filter rooms by price range using slider', async ({ searchPage }) => {
      await searchPage.goto();
      await searchPage.setPriceRange(100, 300);
      await searchPage.submitSearch();
      await searchPage.verifySearchResults();
    });

    test('should perform complete search with all filters', async ({ searchPage }) => {
      await searchPage.goto();

      const { checkIn, checkOut } = getDateRange(7, 10);

      await searchPage.searchForRoom({
        location: 'Miami',
        checkIn,
        checkOut,
        guests: 2,
        minPrice: 100,
        maxPrice: 500,
      });

      await searchPage.verifySearchResults();
    });
  });

  test.describe('Booking Flow', () => {
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

  test.describe('Booking Management Flow', () => {
    test('should cancel a booking', async ({ profilePage }) => {
      await profilePage.goto();
      await profilePage.verifyBookingExists(1);
      await profilePage.cancelBooking(1);
      await expect(profilePage.page.getByTestId('cancel-booking-btn-1')).not.toBeVisible({ timeout: 5000 });
    });

    test('should switch between upcoming and past bookings tabs', async ({ profilePage }) => {
      await profilePage.goto();
      await profilePage.switchToPast();
      await profilePage.switchToUpcoming();
      await expect(profilePage.upcomingTab).toHaveAttribute('data-state', 'active');
    });
  });
});

