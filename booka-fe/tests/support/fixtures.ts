import { test as base } from '@playwright/test';
import { SearchPage } from './SearchPage';
import { RoomDetailsPage } from './RoomDetailsPage';
import { ProfilePage } from './ProfilePage';

/**
 * Extended Playwright test with Page Object Model fixtures
 * Automatically injects POMs into tests
 */
type TestFixtures = {
  searchPage: SearchPage;
  roomDetailsPage: RoomDetailsPage;
  profilePage: ProfilePage;
};

export const test = base.extend<TestFixtures>({
  searchPage: async ({ page }, use) => {
    const searchPage = new SearchPage(page);
    await use(searchPage);
  },

  roomDetailsPage: async ({ page }, use) => {
    const roomDetailsPage = new RoomDetailsPage(page);
    await use(roomDetailsPage);
  },

  profilePage: async ({ page }, use) => {
    const profilePage = new ProfilePage(page);
    await use(profilePage);
  },
});

export { expect } from '@playwright/test';

