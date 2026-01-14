import { test, expect } from "@playwright/test";

test.describe("GymForge App", () => {
  test("should display landing page", async ({ page }) => {
    await page.goto("/");

    // Check for main heading
    await expect(
      page.getByRole("heading", { name: /forge your strongest self/i })
    ).toBeVisible();

    // Check for CTA buttons
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /get started/i })
    ).toBeVisible();
  });

  test("should display features section", async ({ page }) => {
    await page.goto("/");

    // Check feature cards are visible
    await expect(page.getByText("Weekly Planning")).toBeVisible();
    await expect(page.getByText("Set-by-Set Tracking")).toBeVisible();
    await expect(page.getByText("Visual Progress")).toBeVisible();
  });

  test("should have working navigation on landing page", async ({ page }) => {
    await page.goto("/");

    // Check logo is visible
    await expect(page.getByText("GymForge").first()).toBeVisible();
  });
});

test.describe("Authentication", () => {
  test("should redirect to sign-in page when accessing protected routes", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    // Should redirect to sign-in
    await expect(page).toHaveURL(/sign-in/);
  });

  test("should show sign-in modal when clicking sign in button", async ({
    page,
  }) => {
    await page.goto("/");

    // Click sign in button
    await page.getByRole("button", { name: /sign in/i }).click();

    // Clerk modal should appear (check for Clerk's modal elements)
    // Note: This test assumes Clerk modal mode is used
    await expect(page.locator(".cl-modalContent")).toBeVisible({
      timeout: 5000,
    });
  });
});

test.describe("Responsive Design", () => {
  test("should display mobile navigation on small screens", async ({
    page,
  }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Check that mobile-friendly elements are visible
    await expect(page.getByText("GymForge").first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: /get started/i })
    ).toBeVisible();
  });

  test("should display desktop navigation on large screens", async ({
    page,
  }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    // Check that desktop navigation is visible
    await expect(page.getByText("GymForge").first()).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /get started/i })
    ).toBeVisible();
  });
});

// Tests for authenticated users would require test user setup
// These tests are marked as skip until auth is configured for testing
test.describe.skip("Authenticated User Flow", () => {
  test.beforeEach(async ({ page }) => {
    // TODO: Set up test user authentication
    // This would require either:
    // 1. Clerk test tokens
    // 2. A test user with known credentials
    // 3. Mocking Clerk authentication
  });

  test("should display dashboard after sign in", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Welcome back")).toBeVisible();
  });

  test("should allow creating a workout plan", async ({ page }) => {
    await page.goto("/plan");
    await page.getByRole("button", { name: /create plan/i }).click();

    // Fill in plan name
    await page.getByPlaceholder(/plan name/i).fill("Test Plan");

    // Expand Monday
    await page.getByText("Monday").click();

    // Add an exercise
    await page.getByRole("button", { name: /add exercise/i }).click();

    // Search for exercise
    await page.getByPlaceholder(/search exercises/i).fill("Bench");
    await page.getByText("Bench Press").click();

    // Save plan
    await page.getByRole("button", { name: /save plan/i }).click();

    // Verify plan was created
    await expect(page.getByText("Test Plan")).toBeVisible();
  });

  test("should allow logging a workout", async ({ page }) => {
    await page.goto("/log");

    // Enter weight for first set
    await page.locator('input[type="number"]').first().fill("135");

    // Enter reps
    await page.locator('input[type="number"]').nth(1).fill("8");

    // Save set
    await page.getByRole("button", { name: /save/i }).first().click();

    // Verify set was saved (check mark appears)
    await expect(page.locator(".text-primary svg")).toBeVisible();
  });

  test("should display progress charts", async ({ page }) => {
    await page.goto("/progress");

    // Check for chart container
    await expect(page.locator(".recharts-wrapper")).toBeVisible();
  });

  test("should allow updating profile", async ({ page }) => {
    await page.goto("/profile");

    // Update display name
    await page.getByPlaceholder(/your name/i).fill("Test User");

    // Select kg units
    await page.getByRole("button", { name: /kilograms/i }).click();

    // Save changes
    await page.getByRole("button", { name: /save changes/i }).click();

    // Verify saved
    await expect(page.getByText("Saved!")).toBeVisible();
  });
});
