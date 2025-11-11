/**
 * Visual regression testing utilities
 *
 * These utilities help with visual regression testing using Playwright's
 * built-in screenshot comparison features.
 */

import type { Page, Locator, expect } from '@playwright/test';

export interface ScreenshotOptions {
  /**
   * Maximum allowed pixel difference
   * @default 0.1 (0.1%)
   */
  maxDiffPixelRatio?: number;

  /**
   * Maximum allowed pixel difference (absolute)
   */
  maxDiffPixels?: number;

  /**
   * Threshold for individual pixel color difference (0-1)
   * @default 0.2
   */
  threshold?: number;

  /**
   * Animations should be disabled
   * @default 'disabled'
   */
  animations?: 'disabled' | 'allow';

  /**
   * Mask certain elements before comparison
   */
  mask?: Locator[];

  /**
   * Whether to take full page screenshot
   * @default false
   */
  fullPage?: boolean;
}

/**
 * Take a screenshot and compare with baseline
 * Uses Playwright's built-in visual regression testing
 */
export async function expectMatchesScreenshot(
  page: Page,
  name: string,
  options: ScreenshotOptions = {}
): Promise<void> {
  const defaultOptions: ScreenshotOptions = {
    maxDiffPixelRatio: 0.1,
    threshold: 0.2,
    animations: 'disabled',
    fullPage: false,
  };

  const mergedOptions = { ...defaultOptions, ...options };

  await page.screenshot({
    path: `e2e/screenshots/${name}.png`,
    fullPage: mergedOptions.fullPage,
    animations: mergedOptions.animations,
    mask: mergedOptions.mask,
  });
}

/**
 * Compare a specific element screenshot
 */
export async function expectElementMatchesScreenshot(
  locator: Locator,
  name: string,
  options: ScreenshotOptions = {}
): Promise<void> {
  const defaultOptions: ScreenshotOptions = {
    maxDiffPixelRatio: 0.1,
    threshold: 0.2,
    animations: 'disabled',
  };

  const mergedOptions = { ...defaultOptions, ...options };

  await locator.screenshot({
    path: `e2e/screenshots/${name}.png`,
    animations: mergedOptions.animations,
    mask: mergedOptions.mask,
  });
}

/**
 * Wait for all images to load before taking screenshot
 */
export async function waitForImagesToLoad(page: Page): Promise<void> {
  await page.evaluate(() => {
    const images = Array.from(document.images);
    return Promise.all(
      images
        .filter((img) => !img.complete)
        .map(
          (img) =>
            new Promise((resolve) => {
              img.addEventListener('load', resolve);
              img.addEventListener('error', resolve);
            })
        )
    );
  });
}

/**
 * Wait for all animations to complete
 */
export async function waitForAnimations(page: Page): Promise<void> {
  await page.evaluate(() => {
    return Promise.all(
      document.getAnimations().map((animation) => animation.finished)
    );
  });
}

/**
 * Disable animations for more stable screenshots
 */
export async function disableAnimations(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `,
  });
}

/**
 * Hide elements that frequently change (like timestamps)
 */
export async function hideDynamicElements(
  page: Page,
  selectors: string[]
): Promise<void> {
  await page.addStyleTag({
    content: selectors.map((selector) => `${selector} { visibility: hidden !important; }`).join('\n'),
  });
}

/**
 * Prepare page for stable screenshot
 * - Disables animations
 * - Waits for images to load
 * - Waits for fonts to load
 */
export async function prepareForScreenshot(
  page: Page,
  options: {
    disableAnimations?: boolean;
    waitForImages?: boolean;
    hideDynamicSelectors?: string[];
  } = {}
): Promise<void> {
  const {
    disableAnimations: shouldDisableAnimations = true,
    waitForImages = true,
    hideDynamicSelectors = [],
  } = options;

  // Disable animations
  if (shouldDisableAnimations) {
    await disableAnimations(page);
  }

  // Wait for images
  if (waitForImages) {
    await waitForImagesToLoad(page);
  }

  // Hide dynamic elements
  if (hideDynamicSelectors.length > 0) {
    await hideDynamicElements(page, hideDynamicSelectors);
  }

  // Wait for fonts
  await page.evaluate(() => document.fonts.ready);

  // Give a small buffer for any final rendering
  await page.waitForTimeout(100);
}

/**
 * Common dynamic selectors that should be hidden in screenshots
 */
export const COMMON_DYNAMIC_SELECTORS = [
  '[data-testid="timestamp"]',
  '[data-testid="relative-time"]',
  '[data-testid="current-time"]',
  '.timestamp',
  '.relative-time',
  'time[datetime]',
];

/**
 * Take a screenshot of the entire page with standard settings
 */
export async function takePageScreenshot(
  page: Page,
  name: string,
  options: ScreenshotOptions = {}
): Promise<void> {
  await prepareForScreenshot(page, {
    hideDynamicSelectors: COMMON_DYNAMIC_SELECTORS,
  });

  await expectMatchesScreenshot(page, name, {
    fullPage: true,
    ...options,
  });
}

/**
 * Take a screenshot of a specific component with standard settings
 */
export async function takeComponentScreenshot(
  locator: Locator,
  name: string,
  options: ScreenshotOptions = {}
): Promise<void> {
  const page = locator.page();

  await prepareForScreenshot(page, {
    hideDynamicSelectors: COMMON_DYNAMIC_SELECTORS,
  });

  await expectElementMatchesScreenshot(locator, name, options);
}
