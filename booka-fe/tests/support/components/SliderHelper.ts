import type { Page, Locator } from '@playwright/test';

/**
 * Shared slider component helper
 * Provides reusable methods for interacting with Radix UI slider components
 */
export class SliderHelper {
  /**
   * Set slider range values by dragging thumbs
   * @param page - Playwright page instance
   * @param slider - Slider root element
   * @param fromValue - Minimum value
   * @param toValue - Maximum value
   * @param maxRange - Maximum range of the slider (default: 2000)
   */
  static async setRange(
    page: Page,
    slider: Locator,
    fromValue: number,
    toValue: number,
    maxRange: number = 2000
  ): Promise<void> {
    await slider.waitFor({ state: 'visible' });
    
    const fromThumb = page.getByTestId('price-range-slider-from');
    const toThumb = page.getByTestId('price-range-slider-to');
    
    await fromThumb.waitFor({ state: 'visible', timeout: 5000 });
    await toThumb.waitFor({ state: 'visible', timeout: 5000 });
    
    const sliderBox = await slider.boundingBox();
    if (!sliderBox) {
      throw new Error('Slider not found');
    }
    
    const fromPosition = (fromValue / maxRange) * sliderBox.width;
    const toPosition = (toValue / maxRange) * sliderBox.width;
    const trackCenterY = sliderBox.y + sliderBox.height / 2;
    
    // Drag from thumb
    await fromThumb.hover();
    await page.mouse.down();
    await page.mouse.move(sliderBox.x + fromPosition, trackCenterY, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(200);
    
    // Drag to thumb
    await toThumb.hover();
    await page.mouse.down();
    await page.mouse.move(sliderBox.x + toPosition, trackCenterY, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(200);
  }
}

