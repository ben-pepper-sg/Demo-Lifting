describe('Authentication Flow', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    cy.clearLocalStorage();
  });

  it('should allow a user to login and view protected pages', () => {
    // Intercept API calls
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: { id: '1', name: 'Test User', email: 'user@example.com', role: 'user' },
        token: 'fake-jwt-token'
      }
    }).as('loginRequest');

    // Visit login page
    cy.visit('/login');
    cy.get('h1').should('contain', 'Login');

    // Fill in login form
    cy.get('input[name="email"]').type('user@example.com');
    cy.get('input[name="password"]').type('password123');

    // Submit form
    cy.get('button[type="submit"]').click();

    // Wait for login request
    cy.wait('@loginRequest');

    // Verify we are redirected to the dashboard
    cy.url().should('include', '/dashboard');

    // Verify user info is displayed
    cy.get('[data-testid="user-greeting"]').should('contain', 'Test User');
  });

  it('should show validation errors for invalid inputs', () => {
    cy.visit('/login');

    // Submit empty form
    cy.get('button[type="submit"]').click();

    // Check validation messages
    cy.get('[data-testid="email-error"]').should('be.visible');
    cy.get('[data-testid="password-error"]').should('be.visible');
  });

  it('should show error message with invalid credentials', () => {
    // Intercept API calls with error response
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 401,
      body: {
        error: 'Invalid credentials'
      }
    }).as('failedLoginRequest');

    cy.visit('/login');

    // Fill in login form with invalid credentials
    cy.get('input[name="email"]').type('wrong@example.com');
    cy.get('input[name="password"]').type('wrongpassword');

    // Submit form
    cy.get('button[type="submit"]').click();

    // Wait for login request
    cy.wait('@failedLoginRequest');

    // Check error message
    cy.get('[data-testid="login-error"]').should('be.visible');
    cy.get('[data-testid="login-error"]').should('contain', 'Invalid credentials');
  });

  it('should navigate to registration page', () => {
    cy.visit('/login');
    
    cy.get('a').contains('Register').click();
    cy.url().should('include', '/register');
  });
});