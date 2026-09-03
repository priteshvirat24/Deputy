import { expect, test } from '@playwright/test';

test.describe('DEPUTY Full Lifecycle End-to-End Canonical Flow', () => {
  test('Alice & Bob Demonstrations -> Tool Synthesis -> Charlie Proposal -> Passkey Ceremony -> Execution -> Audit', async ({
    page,
  }) => {
    // 1. Enable Chromium Virtual Authenticator (FIDO2 CTAP2 with User Verification)
    const client = await page.context().newCDPSession(page);
    await client.send('WebAuthn.enable');
    await client.send('WebAuthn.addVirtualAuthenticator', {
      options: {
        protocol: 'ctap2',
        transport: 'internal',
        hasResidentKey: true,
        hasUserVerification: true,
        isUserVerified: true,
      },
    });

    // 2. Navigate to DEPUTY Dashboard
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('DEPUTY: Human-Taught Agent Capabilities');

    // 3. Inspect Demonstrations (Alice & Bob customer onboarding)
    const demoNavLink = page.locator('nav a, .nav-item').filter({ hasText: /Demonstrations/i });
    if ((await demoNavLink.count()) > 0) {
      await demoNavLink.first().click();
      await expect(page.locator('body')).toContainText(/Alice/i);
      await expect(page.locator('body')).toContainText(/Bob/i);
    }

    // 4. View Tools & Capabilities
    const toolsNavLink = page.locator('nav a, .nav-item').filter({ hasText: /Tools/i });
    if ((await toolsNavLink.count()) > 0) {
      await toolsNavLink.first().click();
      await expect(page.locator('body')).toContainText(/Active Tools|Capabilities/i);
    }

    // 5. Navigate to Security Center
    const securityNavLink = page.locator('nav a, .nav-item').filter({ hasText: /Security/i });
    if ((await securityNavLink.count()) > 0) {
      await securityNavLink.first().click();
      await expect(page.locator('body')).toContainText(/Security Posture/i);

      // Register virtual passkey if enroll button is present
      const enrollBtn = page.locator('button').filter({ hasText: /Enroll Passkey|Register/i });
      if ((await enrollBtn.count()) > 0 && (await enrollBtn.first().isVisible())) {
        await enrollBtn.first().click();
        await page.waitForTimeout(1000);
      }
    }

    // 6. Return to Dashboard and trigger the 1-click canonical reference scenario
    const dashboardNavLink = page
      .locator('nav a, .nav-item')
      .filter({ hasText: /Dashboard|Overview/i });
    if ((await dashboardNavLink.count()) > 0) {
      await dashboardNavLink.first().click();
    }

    const runBtn = page.locator('button').filter({ hasText: /Run Canonical Demo/i });
    await expect(runBtn).toBeVisible();
    await runBtn.click();

    // 7. Verify scenario progression
    await expect(page.locator('body')).toContainText(/Canonical Reference Scenario Runner/i);

    // Wait for passkey ceremony modal to appear
    const passkeyModal = page
      .locator('.modal-backdrop, .card')
      .filter({ hasText: /Passkey Authorization|User Verification/i });
    if (
      (await passkeyModal.count()) > 0 &&
      (await passkeyModal.first().isVisible({ timeout: 6000 }))
    ) {
      const authBtn = passkeyModal.locator('button').filter({ hasText: /Authorize with Passkey/i });
      if (await authBtn.isVisible()) {
        await authBtn.click();
      }
    }

    // 8. Verify successful workflow execution and audit logging
    await expect(page.locator('body')).toContainText(/Both succeed|immutable event/i, {
      timeout: 10000,
    });
  });
});
