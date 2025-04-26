describe('Dashboard Page', () => {
  beforeEach(() => {
    // Setup authentication
    cy.clearLocalStorage();
    
    // Set up local storage for authenticated state
    const user = { id: '1', name: 'Test User', email: 'user@example.com', role: 'user' };
    window.localStorage.setItem('authToken', 'fake-jwt-token');
    window.localStorage.setItem('user', JSON.stringify(user));
    
    // Intercept API calls
    cy.intercept('GET', '/api/workouts', {
      statusCode: 200,
      body: [
        {
          id: '1',
          title: 'Monday Workout',
          description: 'Full body workout',
          exercises: [
            { name: 'Bench Press', sets: 3, reps: 10 },
            { name: 'Squats', sets: 3, reps: 12 }
          ]
        },
        {
          id: '2',
          title: 'Wednesday Workout',
          description: 'Upper body focus',
          exercises: [
            { name: 'Pull-ups', sets: 3, reps: 8 },
            { name: 'Push-ups', sets: 3, reps: 15 }
          ]
        }
      ]
    }).as('getWorkouts');
    
    cy.intercept('GET', '/api/schedule', {
      statusCode: 200,
      body: [
        {
          id: '1',
          date: new Date().toISOString(),
          workoutId: '1',
          userId: '1',
          workout: {
            id: '1',
            title: 'Monday Workout'
          }
        }
      ]
    }).as('getSchedule');
  });

  it('should display dashboard with user data', () => {
    cy.visit('/dashboard');
    
    // Wait for API calls to complete
    cy.wait('@getWorkouts');
    cy.wait('@getSchedule');
    
    // Check that the dashboard loads with user greeting
    cy.get('[data-testid="user-greeting"]').should('contain', 'Test User');
    
    // Check workout section
    cy.get('[data-testid="upcoming-workouts"]').should('be.visible');
    cy.get('[data-testid="workout-card"]').should('have.length.at.least', 1);
    
    // Check navigation
    cy.get('nav').find('a').contains('Schedule').should('be.visible');
    cy.get('nav').find('a').contains('Profile').should('be.visible');
  });

  it('should allow navigation to workout details', () => {
    cy.visit('/dashboard');
    
    // Wait for API calls to complete
    cy.wait('@getWorkouts');
    
    // Click on a workout
    cy.get('[data-testid="workout-card"]').first().click();
    
    // Check that we navigate to workout details
    cy.url().should('include', '/workouts/');
  });

  it('should allow user to log out', () => {
    cy.visit('/dashboard');
    
    // Click logout button
    cy.get('[data-testid="logout-button"]').click();
    
    // Check that we're redirected to login
    cy.url().should('include', '/login');
    
    // Verify localStorage is cleared
    cy.window().its('localStorage').invoke('getItem', 'authToken').should('be.null');
  });
});