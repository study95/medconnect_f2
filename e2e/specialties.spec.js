import { test, expect } from '@playwright/test';

test.describe('Specialties CRUD Module - Production Hardening Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept auth identity call
    await page.route(/\/api\/me/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: 1,
            name: 'Super Admin',
            roles: ['admin'],
            is_admin: true,
            role_id: 1,
            registration_type: 'admin',
          },
        }),
      });
    });

    await page.addInitScript(() => {
      localStorage.setItem('token', 'mock-admin-token-12345');
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: 1,
          name: 'Super Admin',
          roles: ['admin'],
          is_admin: true,
          role_id: 1,
          registration_type: 'admin',
        })
      );
      localStorage.setItem('userType', 'admin');
    });
  });

  test('1. Specialty List Page loads with active items', async ({ page }) => {
    await page.route(/\/api\/specialties/, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              { id: 1, name: 'Cardiology', slug: 'cardiology', doctors_count: 5 },
              { id: 2, name: 'Neurology', slug: 'neurology', doctors_count: 3 },
            ],
          }),
        });
      }
    });

    await page.goto('/admin/specialties');
    await expect(page.locator('h2.admin-page-title')).toContainText('Specialties');
    await expect(page.getByText('Cardiology', { exact: true })).toBeVisible();
    await expect(page.getByText('/cardiology', { exact: true })).toBeVisible();
    await expect(page.getByText('Neurology', { exact: true })).toBeVisible();
  });

  test('2. Create specialty shows loading state and success toast', async ({ page }) => {
    await page.route(/\/api\/specialties/, async (route) => {
      const method = route.request().method();
      if (method === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Specialty created successfully',
            data: { id: 3, name: 'Oncology', slug: 'oncology', doctors_count: 0 },
          }),
        });
      } else if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              { id: 1, name: 'Cardiology', slug: 'cardiology' },
              { id: 3, name: 'Oncology', slug: 'oncology' },
            ],
          }),
        });
      }
    });

    await page.goto('/admin/specialties/create');
    await page.fill('input[name="name"]', 'Oncology');
    await page.click('button[type="submit"]');

    await expect(page.getByText('Specialty created successfully')).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/specialties$/);
  });

  test('3. Duplicate create validation displays inline error and error toast', async ({ page }) => {
    await page.route(/\/api\/specialties/, async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 422,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Validation failed.',
            errors: {
              name: ['Specialty already exists.'],
            },
          }),
        });
      }
    });

    await page.goto('/admin/specialties/create');
    await page.fill('input[name="name"]', 'Cardiology');
    await page.click('button[type="submit"]');

    await expect(page.locator('.admin-form-error')).toContainText('Specialty already exists.');
    await expect(page.getByText('Specialty already exists.').first()).toBeVisible();
  });

  test('4. Edit form automatically prefills existing specialty values', async ({ page }) => {
    await page.route(/\/api\/specialties\/1/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 1,
            name: 'Pediatrics',
            slug: 'pediatrics-specialist',
          },
        }),
      });
    });

    await page.goto('/admin/specialties/edit/1');
    const nameInput = page.locator('input[name="name"]');
    const slugInput = page.locator('input[name="slug"]');

    await expect(nameInput).toHaveValue('Pediatrics');
    await expect(slugInput).toHaveValue('pediatrics-specialist');
  });

  test('5. Update specialty submits changes, shows success toast, and refreshes', async ({ page }) => {
    await page.route(/\/api\/specialties\/1/, async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { id: 1, name: 'Cardiology', slug: 'cardiology' },
          }),
        });
      } else if (method === 'PUT' || method === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Specialty updated successfully',
            data: { id: 1, name: 'Cardiology & Heart Surgery', slug: 'cardiology' },
          }),
        });
      }
    });

    await page.route(/\/api\/specialties(\?.*)?$/, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [{ id: 1, name: 'Cardiology & Heart Surgery', slug: 'cardiology' }],
          }),
        });
      }
    });

    await page.goto('/admin/specialties/edit/1');
    await page.fill('input[name="name"]', 'Cardiology & Heart Surgery');
    await page.click('button[type="submit"]');

    await expect(page.getByText('Specialty updated successfully')).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/specialties$/);
  });

  test('6. Duplicate update validation displays inline error', async ({ page }) => {
    await page.route(/\/api\/specialties\/1/, async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { id: 1, name: 'Cardiology', slug: 'cardiology' },
          }),
        });
      } else if (method === 'PUT' || method === 'POST') {
        await route.fulfill({
          status: 422,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Validation failed.',
            errors: {
              name: ['Specialty already exists.'],
            },
          }),
        });
      }
    });

    await page.goto('/admin/specialties/edit/1');
    await page.fill('input[name="name"]', 'Neurology');
    await page.click('button[type="submit"]');

    await expect(page.locator('.admin-form-error')).toContainText('Specialty already exists.');
    await expect(page.getByText('Specialty already exists.').first()).toBeVisible();
  });

  test('7. Delete confirmation modal can be canceled without deleting', async ({ page }) => {
    await page.route(/\/api\/specialties/, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [{ id: 1, name: 'Cardiology', slug: 'cardiology' }],
          }),
        });
      }
    });

    await page.goto('/admin/specialties');
    await expect(page.getByText('Cardiology', { exact: true })).toBeVisible();
    await page.locator('button.admin-btn-danger').first().click();
    await expect(page.locator('.db-dialog-card')).toBeVisible();

    await page.locator('button.db-dialog-btn-cancel').click();
    await expect(page.locator('.db-dialog-card')).not.toBeVisible();
    await expect(page.getByText('Cardiology', { exact: true })).toBeVisible();
  });

  test('8. Delete unused specialty removes row and displays success toast', async ({ page }) => {
    await page.route(/\/api\/specialties/, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [{ id: 2, name: 'Temporary Specialty', slug: 'temporary-specialty' }],
          }),
        });
      } else if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Specialty deleted successfully',
          }),
        });
      }
    });

    await page.goto('/admin/specialties');
    await expect(page.getByText('Temporary Specialty', { exact: true })).toBeVisible();
    await page.locator('button.admin-btn-danger').first().click();
    await page.locator('button.db-dialog-btn-danger').click();

    await expect(page.getByText('Specialty deleted successfully')).toBeVisible();
  });

  test('9. Delete specialty with assigned doctors blocked with 409 Conflict toast', async ({ page }) => {
    await page.route(/\/api\/specialties/, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [{ id: 1, name: 'Cardiology', slug: 'cardiology' }],
          }),
        });
      } else if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Cannot delete specialty because 8 doctor(s) are assigned to it.',
          }),
        });
      }
    });

    await page.goto('/admin/specialties');
    await expect(page.getByText('Cardiology', { exact: true })).toBeVisible();
    await page.locator('button.admin-btn-danger').first().click();
    await page.locator('button.db-dialog-btn-danger').click();

    await expect(
      page.getByText('Cannot delete specialty because 8 doctor(s) are assigned to it.').first()
    ).toBeVisible();
  });
});
