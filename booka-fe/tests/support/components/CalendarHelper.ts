import type { Page, Locator } from '@playwright/test';

/**
 * Shared calendar component helper
 * Provides reusable methods for interacting with Radix UI calendar components
 */
export class CalendarHelper {
  /**
   * Select a date from a calendar popover
   * @param page - Playwright page instance
   * @param triggerBtn - Button that opens the calendar
   * @param calendarTestId - Test ID of the calendar popover
   * @param date - Date string in format YYYY-MM-DD
   */
  static async selectDate(
    page: Page,
    triggerBtn: Locator,
    calendarTestId: string,
    date: string
  ): Promise<void> {
    await triggerBtn.click();
    const calendar = page.getByTestId(calendarTestId);
    await calendar.waitFor({ state: 'visible' });
    
    const dayButton = page.getByTestId(`calendar-day-${date}`);
    await dayButton.click();
    
    // Click outside the calendar to close it (on main tag or empty region)
    const mainElement = page.locator('main');
    if (await mainElement.count() > 0) {
      await mainElement.click({ position: { x: 10, y: 10 } });
    } else {
      await page.locator('body').click({ position: { x: 10, y: 10 } });
    }
    
    await calendar.waitFor({ state: 'hidden' });
  }
}

