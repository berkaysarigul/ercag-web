import { test, expect } from '@playwright/test';

test.describe('E-commerce Checkout Flow', () => {

    test('Should complete a standard checkout flow successfully', async ({ page }) => {
        // 1. Visit Homepage
        await page.goto('http://localhost:3000');

        // Check if the page loaded
        await expect(page).toHaveTitle(/Erçağ Kırtasiye/i);

        // 2. Navigate to Products
        await page.click('text=Tüm Ürünler');
        await expect(page).toHaveURL(/.*\/products/);

        // 3. Add first product to cart
        // Assuming we have a standard Add to Cart button on the product cards
        const addToCartButton = page.locator('button:has-text("Sepete Ekle")').first();
        await addToCartButton.waitFor({ state: 'visible' });
        await addToCartButton.click();

        // 4. Go to Cart
        await page.click('a[href="/cart"]');
        await expect(page).toHaveURL(/.*\/cart/);

        // 5. Verify product is in cart
        await expect(page.locator('text=Sepet Özeti')).toBeVisible();
        await expect(page.locator('button:has-text("Sepeti Onayla")')).toBeVisible();

        // Note: The rest of the checkout flow usually requires auth (login/register).
        // In a full E2E, we would mock the auth state or fill a login form here.
        // This serves as the foundation for the automated verification.
    });
});
