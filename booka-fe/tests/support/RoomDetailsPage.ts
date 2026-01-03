import { expect } from '@playwright/test';
import type { Page, Locator } from '@playwright/test';
import { CalendarHelper } from './components/CalendarHelper';

/**
 * Page Object Model for the Room Details page
 * Provides high-level actions for viewing room details and booking
 */
export class RoomDetailsPage {
  readonly page: Page;
  readonly backLink: Locator;
  readonly roomName: Locator;
  readonly checkInBtn: Locator;
  readonly checkOutBtn: Locator;
  readonly bookNowBtn: Locator;
  readonly totalPrice: Locator;

  constructor(page: Page) {
    this.page = page;
    this.backLink = page.getByTestId('room-details-back-link');
    this.roomName = page.locator('h1, [class*="text-3xl"]').first();
    this.checkInBtn = page.getByTestId('room-checkin-btn');
    this.checkOutBtn = page.getByTestId('room-checkout-btn');
    this.bookNowBtn = page.getByTestId('room-book-now-btn');
    this.totalPrice = page.locator('text=/Total.*\\$[\\d.]+/');
  }

  /**
   * Navigate to a room details page
   * @param roomId - Room ID
   */
  async goto(roomId: number): Promise<void> {
    await this.page.goto(`/rooms/${roomId}`);
  }

  /**
   * Select check-in date
   * @param date - Date string in format YYYY-MM-DD
   */
  async selectCheckInDate(date: string): Promise<void> {
    await CalendarHelper.selectDate(
      this.page,
      this.checkInBtn,
      'room-checkin-calendar',
      date
    );
  }

  /**
   * Select check-out date
   * @param date - Date string in format YYYY-MM-DD
   */
  async selectCheckOutDate(date: string): Promise<void> {
    await CalendarHelper.selectDate(
      this.page,
      this.checkOutBtn,
      'room-checkout-calendar',
      date
    );
  }

  /**
   * Select both check-in and check-out dates
   * @param checkIn - Check-in date string in format YYYY-MM-DD
   * @param checkOut - Check-out date string in format YYYY-MM-DD
   */
  async selectDates(checkIn: string, checkOut: string): Promise<void> {
    await this.selectCheckInDate(checkIn);
    await this.selectCheckOutDate(checkOut);
  }

  /**
   * Click the Book Now button
   */
  async clickBookNow(): Promise<void> {
    await this.bookNowBtn.click();
  }

  /**
   * Complete a booking with dates
   * @param checkIn - Check-in date string in format YYYY-MM-DD
   * @param checkOut - Check-out date string in format YYYY-MM-DD
   */
  async completeBooking(checkIn: string, checkOut: string): Promise<void> {
    await this.selectDates(checkIn, checkOut);
    await this.clickBookNow();
  }

  /**
   * Verify that the room details are displayed
   */
  async verifyRoomDetails(): Promise<void> {
    await expect(this.roomName).toBeVisible();
    await expect(this.checkInBtn).toBeVisible();
    await expect(this.checkOutBtn).toBeVisible();
  }

  /**
   * Verify that the booking button is enabled
   */
  async verifyBookingEnabled(): Promise<void> {
    await expect(this.bookNowBtn).toBeEnabled();
  }

  /**
   * Verify that the booking button is disabled
   */
  async verifyBookingDisabled(): Promise<void> {
    await expect(this.bookNowBtn).toBeDisabled();
  }
}

