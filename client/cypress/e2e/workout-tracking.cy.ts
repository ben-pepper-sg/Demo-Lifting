describe('Workout Tracking Flow', () => {
  beforeEach(() => {
    // Setup authentication
    cy.clearLocalStorage();
    
    // Set up local storage for authenticated state
    const user = { id: '1', name: 'Test User', email: 'user@example.com', role: 'user' };
    window.localStorage.setItem('authToken', 'fake-jwt-token');
    window.localStorage.setItem('user', JSON.stringify(user));
    
    // Mock API responses
    cy.intercept('GET', '/api/workouts/*', {
      statusCode: 200,
      body: {
        id: '1',
        title: 'Strength Training A',
        exercises: [
          {
            id: '1',
            name: 'Barbell Squat',
            sets: 3,
            reps: 5,
            weightUnit: 'lbs'
          },
          {
            id: '2',
            name: 'Bench Press',
            sets: 3,
            reps: 5,
            weightUnit: 'lbs'
          }
        ]
      }
    }).as('getWorkout');

    cy.intercept('POST', '/api/workout-logs', {
      statusCode: 201,
      body: {
        id: '1',
        workoutId: '1',
        date: new Date().toISOString(),
        exercises: []
      }
    }).as('createWorkoutLog');

    cy.intercept('PUT', '/api/workout-logs/*', {
      statusCode: 200
    }).as('updateWorkoutLog');
  });

  it('should complete a full workout tracking session', () => {
    // Start the workout
    cy.visit('/workouts/1');
    cy.wait('@getWorkout');

    // Begin workout
    cy.get('[data-testid="start-workout-button"]').click();

    // Log first exercise (Barbell Squat)
    cy.get('[data-testid="exercise-1-set-1"]').within(() => {
      cy.get('input[name="weight"]').type('185');
      cy.get('input[name="reps"]').type('5');
      cy.get('button[data-testid="complete-set"]').click();
    });

    cy.get('[data-testid="exercise-1-set-2"]').within(() => {
      cy.get('input[name="weight"]').type('185');
      cy.get('input[name="reps"]').type('5');
      cy.get('button[data-testid="complete-set"]').click();
    });

    cy.get('[data-testid="exercise-1-set-3"]').within(() => {
      cy.get('input[name="weight"]').type('185');
      cy.get('input[name="reps"]').type('5');
      cy.get('button[data-testid="complete-set"]').click();
    });

    // Move to next exercise
    cy.get('[data-testid="next-exercise-button"]').click();

    // Log second exercise (Bench Press)
    cy.get('[data-testid="exercise-2-set-1"]').within(() => {
      cy.get('input[name="weight"]').type('135');
      cy.get('input[name="reps"]').type('5');
      cy.get('button[data-testid="complete-set"]').click();
    });

    cy.get('[data-testid="exercise-2-set-2"]').within(() => {
      cy.get('input[name="weight"]').type('135');
      cy.get('input[name="reps"]').type('5');
      cy.get('button[data-testid="complete-set"]').click();
    });

    cy.get('[data-testid="exercise-2-set-3"]').within(() => {
      cy.get('input[name="weight"]').type('135');
      cy.get('input[name="reps"]').type('5');
      cy.get('button[data-testid="complete-set"]').click();
    });

    // Complete workout
    cy.get('[data-testid="complete-workout-button"]').click();
    cy.wait('@updateWorkoutLog');

    // Verify completion
    cy.get('[data-testid="workout-summary"]').should('be.visible');
    cy.get('[data-testid="workout-completed-message"]').should('contain', 'Workout completed');
    
    // Check navigation back to dashboard
    cy.get('[data-testid="return-to-dashboard"]').click();
    cy.url().should('include', '/dashboard');
  });

  it('should handle failed API responses gracefully', () => {
    // Override successful intercepts with error responses
    cy.intercept('POST', '/api/workout-logs', {
      statusCode: 500,
      body: { error: 'Server error' }
    }).as('createWorkoutLogError');

    cy.visit('/workouts/1');
    cy.wait('@getWorkout');

    // Begin workout
    cy.get('[data-testid="start-workout-button"]').click();

    // Verify error message is shown
    cy.get('[data-testid="error-message"]').should('be.visible');
    cy.get('[data-testid="error-message"]').should('contain', 'Failed to start workout');
  });

  it('should save progress when navigating away', () => {
    cy.visit('/workouts/1');
    cy.wait('@getWorkout');

    // Begin workout
    cy.get('[data-testid="start-workout-button"]').click();

    // Log one set
    cy.get('[data-testid="exercise-1-set-1"]').within(() => {
      cy.get('input[name="weight"]').type('185');
      cy.get('input[name="reps"]').type('5');
      cy.get('button[data-testid="complete-set"]').click();
    });

    // Navigate away
    cy.get('[data-testid="nav-dashboard"]').click();

    // Confirm save progress modal appears
    cy.get('[data-testid="save-progress-modal"]').should('be.visible');
    cy.get('[data-testid="save-and-exit-button"]').should('be.visible');
  });
});