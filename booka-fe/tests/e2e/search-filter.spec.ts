import { test, expect } from '../support/fixtures';
import { setupRoomsMocks } from '../support/mocks/apiMocks';
import { getDateRange } from '../support/utils/dateUtils';

/**
 * Integration tests for Room Search & Filter functionality
 * Tests are isolated from the real database using API mocking
 */
test.describe('Search & Filter Flow', () => {
  /**
   * Set up only rooms-related mocks before each test
   */
  test.beforeEach(async ({ page }) => {
    await setupRoomsMocks(page);
  });

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

