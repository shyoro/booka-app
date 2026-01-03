import type { Page, Locator } from '@playwright/test';

/**
 * Shared select component helper
 * Provides reusable methods for interacting with Radix UI select components
 */
export class SelectHelper {
  /**
   * Select an option from a select dropdown
   * @param page - Playwright page instance
   * @param trigger - Select trigger button
   * @param optionTestId - Test ID of the option to select
   */
  static async selectOption(
    page: Page,
    trigger: Locator,
    optionTestId: string
  ): Promise<void> {
    await trigger.click();
    await page.waitForTimeout(300);
    
    const selectContent = page.locator('[data-slot="select-content"]');
    await selectContent.waitFor({ state: 'visible', timeout: 5000 });
    
    const option = selectContent.getByTestId(optionTestId);
    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.click();
    
    await page.waitForTimeout(200);
  }
}

