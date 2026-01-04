import { expect } from '@playwright/test';
import type { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for the Profile/Bookings page
 * Provides high-level actions for managing bookings
 */
export class ProfilePage {
  readonly page: Page;
  readonly upcomingTab: Locator;
  readonly pastTab: Locator;
  readonly bookingCards: Locator;
  readonly cancelDialog: Locator;
  readonly cancelDialogKeepBtn: Locator;
  readonly cancelDialogConfirmBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.upcomingTab = page.getByTestId('bookings-upcoming-tab');
    this.pastTab = page.getByTestId('bookings-past-tab');
    this.bookingCards = page.locator('[data-test^="cancel-booking-btn-"]');
    this.cancelDialog = page.locator('[role="alertdialog"]');
    this.cancelDialogKeepBtn = page.getByTestId('cancel-dialog-keep-btn');
    this.cancelDialogConfirmBtn = page.getByTestId('cancel-dialog-confirm-btn');
  }

  /**
   * Navigate to the profile page
   */
  async goto(): Promise<void> {
    // First navigate to home to let auth context initialize
    await this.page.goto('/');

    // Wait for user API call to complete (auth context will fetch user on mount)
    const userResponse = await this.page.waitForResponse(
      (response) => response.url().includes('/api/v1/users/me') && response.status() === 200,
      { timeout: 15000 }
    ).catch(() => null);

    if (!userResponse) {
      throw new Error('User API call did not complete. Authentication may have failed.');
    }

    // Wait for AuthContext to update user state by checking if Navbar shows user info
    // The Navbar displays the user's name when authenticated, which indicates user state is set
    const navbarProfileBtn = this.page.getByTestId('navbar-profile-btn');
    await navbarProfileBtn.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {
      // If navbar profile button doesn't appear, check for mobile menu version
      const mobileProfileBtn = this.page.getByTestId('navbar-mobile-profile-btn');
      return mobileProfileBtn.waitFor({ state: 'visible', timeout: 10000 });
    });

    // Set up promise to wait for bookings API before navigating
    const bookingsResponsePromise = this.page.waitForResponse(
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
      { timeout: 15000 }
    ).catch(() => null);

    // Use client-side navigation via navbar link to preserve React state
    // This avoids the full page reload that resets AuthContext state
    // The profile button is inside a Link component, so we click the button itself
    // which will trigger the Link navigation
    await navbarProfileBtn.click();

    // Wait for URL to change to profile page
    await this.page.waitForURL('**/profile', { timeout: 5000 });

    // Wait for bookings API call to complete
    await bookingsResponsePromise;

    // Wait for the page to load and user to be authenticated
    // The tabs should appear once the user is authenticated and bookings are loaded
    await this.upcomingTab.waitFor({ state: 'visible', timeout: 15000 });
  }

  /**
   * Switch to the upcoming bookings tab
   */
  async switchToUpcoming(): Promise<void> {
    await this.upcomingTab.click();
  }

  /**
   * Switch to the past bookings tab
   */
  async switchToPast(): Promise<void> {
    await this.pastTab.click();
  }

  /**
   * Get the number of visible booking cards
   */
  async getBookingCount(): Promise<number> {
    return await this.bookingCards.count();
  }

  /**
   * Click the cancel button for a specific booking
   * @param bookingId - Booking ID
   */
  async clickCancelBooking(bookingId: number): Promise<void> {
    const cancelBtn = this.page.getByTestId(`cancel-booking-btn-${bookingId}`);
    await cancelBtn.click();
    // Wait for dialog to appear
    await this.cancelDialog.waitFor({ state: 'visible' });
  }

  /**
   * Confirm cancellation in the dialog
   */
  async confirmCancellation(): Promise<void> {
    await this.cancelDialogConfirmBtn.click();
    // Wait for dialog to close
    await this.cancelDialog.waitFor({ state: 'hidden' });
  }

  /**
   * Cancel the cancellation (keep the booking)
   */
  async keepBooking(): Promise<void> {
    await this.cancelDialogKeepBtn.click();
    // Wait for dialog to close
    await this.cancelDialog.waitFor({ state: 'hidden' });
  }

  /**
   * Cancel a booking (complete flow)
   * @param bookingId - Booking ID to cancel
   */
  async cancelBooking(bookingId: number): Promise<void> {
    await this.clickCancelBooking(bookingId);
    await this.confirmCancellation();
  }

  /**
   * Verify that bookings are displayed
   */
  async verifyBookingsDisplayed(): Promise<void> {
    const count = await this.getBookingCount();
    expect(count).toBeGreaterThan(0);
  }

  /**
   * Verify that a specific booking card exists
   * @param bookingId - Booking ID
   */
  async verifyBookingExists(bookingId: number): Promise<void> {
    const cancelBtn = this.page.getByTestId(`cancel-booking-btn-${bookingId}`);
    await expect(cancelBtn).toBeVisible();
  }
}

