import { expect } from '@playwright/test';
import type { Page, Locator } from '@playwright/test';
import { CalendarHelper } from './components/CalendarHelper';
import { SelectHelper } from './components/SelectHelper';
import { SliderHelper } from './components/SliderHelper';

/**
 * Page Object Model for the Search/Home page
 * Provides high-level actions for interacting with the search interface
 */
export class SearchPage {
  readonly page: Page;
  readonly locationSelect: Locator;
  readonly checkInBtn: Locator;
  readonly checkOutBtn: Locator;
  readonly guestsSelect: Locator;
  readonly priceBtn: Locator;
  readonly priceSlider: Locator;
  readonly searchSubmitBtn: Locator;
  readonly roomGrid: Locator;

  constructor(page: Page) {
    this.page = page;
    this.locationSelect = page.getByTestId('search-location-select');
    this.checkInBtn = page.getByTestId('search-checkin-btn');
    this.checkOutBtn = page.getByTestId('search-checkout-btn');
    this.guestsSelect = page.getByTestId('search-guests-select');
    this.priceBtn = page.getByTestId('search-price-btn');
    this.priceSlider = page.getByTestId('search-price-slider');
    this.searchSubmitBtn = page.getByTestId('search-submit-btn');
    this.roomGrid = page.locator('[data-test^="room-card-"]');
  }

  /**
   * Navigate to the search page
   */
  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  /**
   * Select a location from the dropdown
   * @param location - Location name to select
   */
  async selectLocation(location: string): Promise<void> {
    const optionTestId = `search-location-${location.toLowerCase().replace(/\s+/g, '-')}`;
    await SelectHelper.selectOption(this.page, this.locationSelect, optionTestId);
  }

  /**
   * Select check-in date from the calendar popover
   * @param date - Date string in format YYYY-MM-DD
   */
  async selectCheckInDate(date: string): Promise<void> {
    await CalendarHelper.selectDate(
      this.page,
      this.checkInBtn,
      'search-checkin-calendar',
      date
    );
  }

  /**
   * Select check-out date from the calendar popover
   * @param date - Date string in format YYYY-MM-DD
   */
  async selectCheckOutDate(date: string): Promise<void> {
    await CalendarHelper.selectDate(
      this.page,
      this.checkOutBtn,
      'search-checkout-calendar',
      date
    );
  }

  /**
   * Select number of guests
   * @param guests - Number of guests (1-5)
   */
  async selectGuests(guests: number): Promise<void> {
    await SelectHelper.selectOption(this.page, this.guestsSelect, `search-guests-${guests}`);
  }

  /**
   * Open price range popover and adjust slider
   * @param minPrice - Minimum price value
   * @param maxPrice - Maximum price value
   */
  async setPriceRange(minPrice: number, maxPrice: number): Promise<void> {
    await this.priceBtn.click();
    await SliderHelper.setRange(this.page, this.priceSlider, minPrice, maxPrice);
    
    // Close popover
    await this.page.keyboard.press('Escape');
    await this.priceSlider.waitFor({ state: 'hidden' });
  }

  /**
   * Submit the search form
   */
  async submitSearch(): Promise<void> {
    // Set up response listener before clicking
    const responsePromise = this.page.waitForResponse(
      (response) => {
        const url = response.url();
        return url.includes('/api/v1/rooms') && 
               response.request().method() === 'GET' && 
               !url.includes('/rooms/') && 
               !url.includes('/availability') && 
               !url.includes('/locations');
      },
      { timeout: 15000 }
    ).catch(() => null);

    await this.searchSubmitBtn.click();
    
    // Wait for API response
    await responsePromise;
    
    // Wait for room grid to update - either show rooms or empty state
    // Give React time to render after the API response
    await this.page.waitForTimeout(1000);
    
    // Wait for either room cards or empty message
    try {
      await this.roomGrid.first().waitFor({ state: 'visible', timeout: 5000 });
    } catch {
      // If no rooms, wait for empty message
      await this.page.locator('text=No rooms found').waitFor({ state: 'visible', timeout: 2000 }).catch(() => {});
    }
  }

  /**
   * Perform a complete search with all parameters
   * @param params - Search parameters
   */
  async searchForRoom(params: {
    location?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<void> {
    if (params.location) {
      await this.selectLocation(params.location);
    }
    
    if (params.checkIn) {
      await this.selectCheckInDate(params.checkIn);
    }
    
    if (params.checkOut) {
      await this.selectCheckOutDate(params.checkOut);
    }
    
    if (params.guests) {
      await this.selectGuests(params.guests);
    }
    
    if (params.minPrice !== undefined && params.maxPrice !== undefined) {
      await this.setPriceRange(params.minPrice, params.maxPrice);
    }
    
    await this.submitSearch();
  }

  /**
   * Get the number of visible room cards
   */
  async getRoomCount(): Promise<number> {
    return await this.roomGrid.count();
  }

  /**
   * Click on a specific room card by ID
   * @param roomId - Room ID
   */
  async clickRoomCard(roomId: number): Promise<void> {
    const roomCard = this.page.getByTestId(`room-card-${roomId}`);
    await roomCard.click();
    await this.page.waitForURL(`**/rooms/${roomId}**`);
  }

  /**
   * Verify that search results are displayed
   */
  async verifySearchResults(): Promise<void> {
    await expect(this.roomGrid.first()).toBeVisible();
  }
}

