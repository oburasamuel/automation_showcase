const { test, expect } = require('@playwright/test');

test.describe('Notes App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Login functionality', () => {
    test('should login with valid credentials', async ({ page }) => {
      // Fill login form
      await page.fill('[data-testid="username-input"]', 'admin');
      await page.fill('[data-testid="password-input"]', 'password');
      
      // Submit form
      await page.click('[data-testid="login-button"]');
      
      // Verify successful login
      await expect(page.locator('h1')).toContainText('My Notes');
      await expect(page.locator('[data-testid="logout-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="notes-list"]')).toBeVisible();
    });

    test('should show error with invalid credentials', async ({ page }) => {
      // Fill login form with invalid credentials
      await page.fill('[data-testid="username-input"]', 'admin');
      await page.fill('[data-testid="password-input"]', 'wrongpassword');
      
      // Submit form
      await page.click('[data-testid="login-button"]');
      
      // Verify error message
      await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="login-error"]')).toContainText('Invalid credentials');
      
      // Verify still on login page
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    });

    test('should require both username and password', async ({ page }) => {
      // Try to submit without filling fields
      await page.click('[data-testid="login-button"]');
      
      // Form validation should prevent submission
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
      
      // Fill only username
      await page.fill('[data-testid="username-input"]', 'admin');
      await page.click('[data-testid="login-button"]');
      
      // Should still be on login page (HTML5 validation)
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    });
  });

  test.describe('Notes CRUD operations', () => {
    test.beforeEach(async ({ page }) => {
      // Login before each test
      await page.fill('[data-testid="username-input"]', 'admin');
      await page.fill('[data-testid="password-input"]', 'password');
      await page.click('[data-testid="login-button"]');
      await expect(page.locator('[data-testid="notes-list"]')).toBeVisible();
    });

    test('should create a new note', async ({ page }) => {
      const noteContent = 'This is a test note created by Playwright';
      
      // Get initial count
      const initialCount = await page.locator('[data-testid="notes-count"]').textContent();
      const initialNumber = parseInt(initialCount.match(/\d+/)[0]);
      
      // Create new note
      await page.fill('[data-testid="new-note-input"]', noteContent);
      await page.click('[data-testid="add-note-button"]');
      
      // Verify note appears in list
      await expect(page.locator('.note-content').last()).toContainText(noteContent);
      
      // Verify count increased
      await expect(page.locator('[data-testid="notes-count"]')).toContainText(`Total notes: ${initialNumber + 1}`);
      
      // Verify input is cleared
      await expect(page.locator('[data-testid="new-note-input"]')).toHaveValue('');
    });

    test('should edit an existing note', async ({ page }) => {
      const originalContent = 'Original note content';
      const updatedContent = 'Updated note content';
      
      // Create a note first
      await page.fill('[data-testid="new-note-input"]', originalContent);
      await page.click('[data-testid="add-note-button"]');
      
      // Wait for note to appear
      await expect(page.locator('.note-content').last()).toContainText(originalContent);
      
      // Get the note ID from the last created note
      const lastNote = page.locator('.note-item').last();
      const noteId = await lastNote.getAttribute('data-testid');
      const id = noteId.replace('note-', '');
      
      // Click edit button
      await page.click(`[data-testid="edit-note-${id}"]`);
      
      // Verify edit form appears
      await expect(page.locator(`[data-testid="edit-input-${id}"]`)).toBeVisible();
      await expect(page.locator(`[data-testid="edit-input-${id}"]`)).toHaveValue(originalContent);
      
      // Update the content
      await page.fill(`[data-testid="edit-input-${id}"]`, updatedContent);
      await page.click(`[data-testid="save-note-${id}"]`);
      
      // Verify note is updated
      await expect(page.locator(`[data-testid="note-${id}"] .note-content`)).toContainText(updatedContent);
      
      // Verify edit form is gone
      await expect(page.locator(`[data-testid="edit-input-${id}"]`)).not.toBeVisible();
    });

    test('should cancel edit operation', async ({ page }) => {
      const originalContent = 'Original content for cancel test';
      
      // Create a note first
      await page.fill('[data-testid="new-note-input"]', originalContent);
      await page.click('[data-testid="add-note-button"]');
      
      // Wait for note to appear
      await expect(page.locator('.note-content').last()).toContainText(originalContent);
      
      // Get the note ID
      const lastNote = page.locator('.note-item').last();
      const noteId = await lastNote.getAttribute('data-testid');
      const id = noteId.replace('note-', '');
      
      // Click edit button
      await page.click(`[data-testid="edit-note-${id}"]`);
      
      // Modify content but cancel
      await page.fill(`[data-testid="edit-input-${id}"]`, 'This should not be saved');
      await page.click(`[data-testid="cancel-edit-${id}"]`);
      
      // Verify original content is preserved
      await expect(page.locator(`[data-testid="note-${id}"] .note-content`)).toContainText(originalContent);
      
      // Verify edit form is gone
      await expect(page.locator(`[data-testid="edit-input-${id}"]`)).not.toBeVisible();
    });

    test('should delete a note', async ({ page }) => {
      const noteContent = 'Note to be deleted';
      
      // Get initial count
      const initialCount = await page.locator('[data-testid="notes-count"]').textContent();
      const initialNumber = parseInt(initialCount.match(/\d+/)[0]);
      
      // Create a note first
      await page.fill('[data-testid="new-note-input"]', noteContent);
      await page.click('[data-testid="add-note-button"]');
      
      // Wait for note to appear and count to increase
      await expect(page.locator('.note-content').last()).toContainText(noteContent);
      await expect(page.locator('[data-testid="notes-count"]')).toContainText(`Total notes: ${initialNumber + 1}`);
      
      // Get the note ID
      const lastNote = page.locator('.note-item').last();
      const noteId = await lastNote.getAttribute('data-testid');
      const id = noteId.replace('note-', '');
      
      // Delete the note
      await page.click(`[data-testid="delete-note-${id}"]`);
      
      // Verify note is removed
      await expect(page.locator(`[data-testid="note-${id}"]`)).not.toBeVisible();
      
      // Verify count decreased
      await expect(page.locator('[data-testid="notes-count"]')).toContainText(`Total notes: ${initialNumber}`);
    });

    test('should show empty state when no notes exist', async ({ page }) => {
      // Delete all existing notes first
      const noteItems = page.locator('.note-item');
      const count = await noteItems.count();
      
      for (let i = 0; i < count; i++) {
        const firstNote = page.locator('.note-item').first();
        const noteId = await firstNote.getAttribute('data-testid');
        const id = noteId.replace('note-', '');
        await page.click(`[data-testid="delete-note-${id}"]`);
        // Wait for the note to be removed from the DOM before continuing
        await expect(page.locator(`[data-testid="note-${id}"]`)).not.toBeVisible();
      }
      
      // Verify empty state
      await expect(page.locator('[data-testid="no-notes"]')).toBeVisible();
      await expect(page.locator('[data-testid="no-notes"]')).toContainText('No notes yet');
      await expect(page.locator('[data-testid="notes-count"]')).toContainText('Total notes: 0');
    });
  });

  test.describe('Navigation and logout', () => {
    test.beforeEach(async ({ page }) => {
      // Login before each test
      await page.fill('[data-testid="username-input"]', 'admin');
      await page.fill('[data-testid="password-input"]', 'password');
      await page.click('[data-testid="login-button"]');
      await expect(page.locator('[data-testid="notes-list"]')).toBeVisible();
    });

    test('should logout successfully', async ({ page }) => {
      // Click logout button
      await page.click('[data-testid="logout-button"]');
      
      // Verify back to login page
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
      await expect(page.locator('h1')).toContainText('Notes App');
      
      // Verify protected content is not visible
      await expect(page.locator('[data-testid="notes-list"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="logout-button"]')).not.toBeVisible();
    });

    test('should persist login state on page refresh', async ({ page }) => {
      // Verify logged in
      await expect(page.locator('[data-testid="logout-button"]')).toBeVisible();
      
      // Refresh page
      await page.reload();
      
      // Should still be logged in
      await expect(page.locator('[data-testid="logout-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="notes-list"]')).toBeVisible();
    });
  });

  test.describe('Visual regression tests', () => {
    test('login page screenshot', async ({ page }) => {
      await expect(page).toHaveScreenshot('login-page.png');
    });

    test('notes page screenshot', async ({ page }) => {
      // Login first
      await page.fill('[data-testid="username-input"]', 'admin');
      await page.fill('[data-testid="password-input"]', 'password');
      await page.click('[data-testid="login-button"]');
      await expect(page.locator('[data-testid="notes-list"]')).toBeVisible();

      // Delete all existing notes to ensure a clean state
      const noteItems = page.locator('.note-item');
      const count = await noteItems.count();
      for (let i = 0; i < count; i++) {
        const firstNote = page.locator('.note-item').first();
        const noteId = await firstNote.getAttribute('data-testid');
        const id = noteId.replace('note-', '');
        await page.click(`[data-testid="delete-note-${id}"]`);
        // Wait for the note to be removed before continuing
        await expect(page.locator(`[data-testid="note-${id}"]`)).not.toBeVisible();
      }
      // Wait for empty state to appear
      await expect(page.locator('[data-testid="no-notes"]')).toBeVisible();
      await expect(page.locator('[data-testid="notes-count"]')).toContainText('Total notes: 0');

      await expect(page).toHaveScreenshot('notes-page.png');
    });
  });
});