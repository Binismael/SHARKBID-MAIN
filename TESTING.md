# Testing Guide

This guide covers unit, integration, and end-to-end testing for the Visual Matters application.

---

## Table of Contents
1. [Testing Stack](#testing-stack)
2. [Setup](#setup)
3. [Unit Testing](#unit-testing)
4. [Integration Testing](#integration-testing)
5. [E2E Testing](#e2e-testing)
6. [Test Coverage](#test-coverage)
7. [CI/CD Integration](#cicd-integration)

---

## Testing Stack

### Recommended Tools
- **Unit Tests**: Vitest (fast, Vite-native)
- **React Component Tests**: React Testing Library
- **E2E Tests**: Playwright or Cypress
- **Mocking**: Vitest mock utilities, MSW (Mock Service Worker)
- **Code Coverage**: Istanbul (built into Vitest)

### Why These Tools?
- **Vitest**: Fast, zero-config, compatible with Jest syntax
- **React Testing Library**: Tests behavior, not implementation
- **Playwright**: Excellent for cross-browser testing
- **MSW**: Mock APIs without changing code

---

## Setup

### 1. Install Dependencies

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D @playwright/test
npm install -D @vitest/ui
npm install -D msw
```

### 2. Configure Vitest

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client'),
    }
  }
});
```

### 3. Setup Test Files

Create `src/test/setup.ts`:

```typescript
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getSession: vi.fn(),
    },
  },
}));
```

### 4. Add Test Scripts

Update `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

---

## Unit Testing

### Example: Service Function Test

File: `client/lib/__tests__/client-service.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getClientProjects } from '@/lib/client-service';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase');

describe('getClientProjects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches projects for a client', async () => {
    const mockProjects = [
      { id: '1', title: 'Project 1', status: 'active' },
      { id: '2', title: 'Project 2', status: 'completed' },
    ];

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockProjects,
            error: null,
          }),
        }),
      }),
    });

    const result = await getClientProjects('client-123');
    
    expect(result).toEqual(expect.arrayContaining(mockProjects));
  });

  it('returns empty array on error', async () => {
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      }),
    });

    const result = await getClientProjects('client-123');
    
    expect(result).toEqual([]);
  });
});
```

### Example: Component Unit Test

File: `client/pages/__tests__/Login.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '@/pages/Login';

// Mock auth context
vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    signIn: vi.fn().mockResolvedValue({ success: true }),
    user: null,
    loading: false,
  }),
}));

describe('Login Page', () => {
  it('renders login form', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
  });

  it('submits login form', async () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitButton = screen.getByText(/sign in/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(emailInput).toHaveValue('test@example.com');
    });
  });
});
```

---

## Integration Testing

### Example: Project Creation Flow

File: `client/lib/__tests__/client-briefing-service.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createProjectFromBriefing } from '@/lib/client-briefing-service';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase');

describe('createProjectFromBriefing', () => {
  const mockClientId = 'client-123';
  const mockBriefing = {
    title: 'New Project',
    description: 'Test project',
    project_type: 'design',
    budget: 5000,
    project_scope: 'medium',
    required_skills: ['UI Design'],
    deliverables: ['Mockups'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates project with milestones', async () => {
    (supabase.from as any).mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'project-1', ...mockBriefing },
            error: null,
          }),
        }),
      }),
    });

    const result = await createProjectFromBriefing(mockClientId, {
      ...mockBriefing,
      milestones: [
        { name: 'Design', description: 'Initial design', due_date: '2024-02-15' },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.projectId).toBe('project-1');
  });

  it('handles validation errors', async () => {
    const invalidBriefing = {
      ...mockBriefing,
      title: '', // Empty title
    };

    const result = await createProjectFromBriefing(mockClientId, invalidBriefing);

    // Update based on actual validation logic
    expect(result.success).toBe(false);
  });
});
```

---

## E2E Testing

### Setup Playwright

Create `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Example E2E Test

File: `e2e/auth.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('user can sign up', async ({ page }) => {
    await page.goto('/signup');

    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.fill('input[placeholder*="name"]', 'Test User');
    
    await page.click('button:has-text("Sign Up")');

    await expect(page).toHaveURL('/client/dashboard');
  });

  test('user can log in', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign In")');

    await expect(page).toHaveURL('/client/dashboard');
  });

  test('user can log out', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign In")');

    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('button:has-text("Sign Out")');

    await expect(page).toHaveURL('/login');
  });
});
```

File: `e2e/projects.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Projects', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', 'client@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
  });

  test('user can create a project', async ({ page }) => {
    await page.goto('/client/briefing');

    // Fill project details
    await page.fill('input[placeholder*="project title"]', 'New Project');
    await page.fill('textarea', 'Project description');
    await page.click('button:has-text("Next")');

    // ... fill remaining steps

    await page.click('button:has-text("Create Project")');

    await expect(page).toHaveURL(/\/client\/projects\/[a-f0-9-]+/);
  });
});
```

---

## Test Coverage

### Generate Coverage Report

```bash
npm run test:coverage
```

This generates an HTML report in `coverage/index.html`.

### Coverage Goals
- Statements: 80%+
- Branches: 75%+
- Functions: 80%+
- Lines: 80%+

### Add Coverage Check to CI

In `.github/workflows/test.yml`:

```yaml
- name: Check coverage
  run: npm run test:coverage -- --coverage.lines 80
```

---

## CI/CD Integration

### GitHub Actions Workflow

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      
      - run: pnpm install
      
      - name: Run unit tests
        run: pnpm test:coverage
      
      - name: Run E2E tests
        run: pnpm test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

---

## Best Practices

### ✅ DO
- Test behavior, not implementation
- Write tests before code (TDD)
- Use descriptive test names
- Mock external dependencies
- Keep tests isolated and independent
- Use fixtures for common test data
- Test error cases
- Aim for high coverage of critical paths

### ❌ DON'T
- Test implementation details
- Use `waitFor` without timeouts
- Create global state in tests
- Test third-party libraries
- Write tests that depend on test order
- Mock everything (some integration testing needed)
- Ignore flaky tests

---

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Run specific test file
npm test -- client-service.test.ts

# Run tests matching pattern
npm test -- --grep "project"

# Generate coverage report
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui
```

---

## Troubleshooting

### Tests not running
- Check `vitest.config.ts` syntax
- Ensure test files end with `.test.ts` or `.test.tsx`
- Check `test/setup.ts` is being loaded

### Timeout errors
- Increase test timeout: `{ timeout: 10000 }`
- Check for unresolved promises
- Verify async/await usage

### Mock errors
- Ensure mocks are defined before imports
- Check mock implementation
- Use `vi.clearAllMocks()` between tests

---

## Resources
- [Vitest Documentation](https://vitest.dev)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
