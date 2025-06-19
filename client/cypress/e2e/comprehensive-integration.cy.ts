describe('Comprehensive Integration Tests', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    
    // Setup common API intercepts
    cy.intercept('GET', '/api/auth/me', {
      statusCode: 200,
      body: {
        user: { 
          id: '1', 
          firstName: 'John', 
          lastName: 'Doe',
          email: 'john@example.com', 
          role: 'USER',
          maxBench: 200,
          maxOHP: 150,
          maxSquat: 300,
          maxDeadlift: 350
        }
      }
    }).as('getCurrentUser');

    cy.intercept('GET', '/api/schedules', {
      statusCode: 200,
      body: [
        {
          id: 'schedule1',
          date: new Date().toISOString(),
          time: '10:00',
          maxParticipants: 8,
          currentParticipants: 3,
          coachId: 'coach1'
        }
      ]
    }).as('getSchedules');
  });

  describe('Complete User Journey', () => {
    it('should complete a full user workflow: register → login → book class → view progress', () => {
      // Step 1: User Registration
      cy.intercept('POST', '/api/auth/register', {
        statusCode: 201,
        body: {
          message: 'User created successfully',
          user: { 
            id: '2', 
            firstName: 'Jane', 
            lastName: 'Smith',
            email: 'jane@example.com', 
            role: 'USER' 
          }
        }
      }).as('registerRequest');

      cy.visit('/register');
      cy.get('input[name="firstName"]').type('Jane');
      cy.get('input[name="lastName"]').type('Smith');
      cy.get('input[name="email"]').type('jane@example.com');
      cy.get('input[name="password"]').type('password123');
      cy.get('input[name="confirmPassword"]').type('password123');
      cy.get('button[type="submit"]').click();

      cy.wait('@registerRequest');
      cy.url().should('include', '/login');

      // Step 2: User Login
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          user: { 
            id: '2', 
            firstName: 'Jane', 
            lastName: 'Smith',
            email: 'jane@example.com', 
            role: 'USER' 
          },
          token: 'fake-jwt-token-jane'
        }
      }).as('loginRequest');

      cy.get('input[name="email"]').type('jane@example.com');
      cy.get('input[name="password"]').type('password123');
      cy.get('button[type="submit"]').click();

      cy.wait('@loginRequest');
      cy.url().should('include', '/dashboard');

      // Step 3: Navigate to Schedule and Book a Class
      cy.intercept('POST', '/api/schedules/schedule1/book', {
        statusCode: 200,
        body: { message: 'Successfully booked time slot' }
      }).as('bookClass');

      cy.get('[data-testid="nav-schedule"]').click();
      cy.url().should('include', '/schedule');
      
      cy.get('[data-testid="book-class-btn"]').first().click();
      cy.wait('@bookClass');
      
      cy.get('[data-testid="success-message"]').should('contain', 'Successfully booked');

      // Step 4: View Class Details
      cy.intercept('GET', '/api/schedules/class', {
        statusCode: 200,
        body: {
          class: {
            participants: [
              {
                user: { firstName: 'Jane', lastName: 'Smith' },
                workoutType: 'UPPER'
              }
            ],
            workoutType: 'UPPER',
            scheme: { 
              sets: [{ reps: 5, percentage: 75 }], 
              restTime: 120 
            },
            supplementalWorkouts: [
              {
                id: '1',
                name: 'Core Circuit',
                exercises: [
                  { name: 'Plank', sets: 3, reps: 30 }
                ]
              }
            ]
          }
        }
      }).as('getClassDetails');

      cy.visit('/lifting-class');
      cy.wait('@getClassDetails');
      
      cy.get('[data-testid="participant-name"]').should('contain', 'Jane Smith');
      cy.get('[data-testid="workout-type"]').should('contain', 'UPPER');

      // Step 5: Update Profile with Max Lifts
      cy.intercept('PUT', '/api/users/2', {
        statusCode: 200,
        body: {
          message: 'User updated successfully',
          user: {
            id: '2',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
            maxBench: 150,
            maxOHP: 100,
            maxSquat: 200,
            maxDeadlift: 250
          }
        }
      }).as('updateProfile');

      cy.get('[data-testid="nav-profile"]').click();
      cy.url().should('include', '/profile');
      
      cy.get('input[name="maxBench"]').clear().type('150');
      cy.get('input[name="maxOHP"]').clear().type('100');
      cy.get('input[name="maxSquat"]').clear().type('200');
      cy.get('input[name="maxDeadlift"]').clear().type('250');
      cy.get('button[type="submit"]').click();

      cy.wait('@updateProfile');
      cy.get('[data-testid="success-message"]').should('contain', 'Profile updated');
    });
  });

  describe('Admin Workflow Integration', () => {
    beforeEach(() => {
      // Login as admin
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          user: { 
            id: 'admin1', 
            firstName: 'Admin', 
            lastName: 'User',
            email: 'admin@example.com', 
            role: 'ADMIN' 
          },
          token: 'fake-admin-token'
        }
      }).as('adminLogin');

      cy.visit('/login');
      cy.get('input[name="email"]').type('admin@example.com');
      cy.get('input[name="password"]').type('admin123');
      cy.get('button[type="submit"]').click();
      cy.wait('@adminLogin');
    });

    it('should allow admin to manage schedules and users', () => {
      // Step 1: Create Default Schedule
      cy.intercept('POST', '/api/default-schedules/admin', {
        statusCode: 201,
        body: {
          id: 'default1',
          dayOfWeek: 1,
          time: '09:00',
          maxParticipants: 10,
          coachId: 'coach1'
        }
      }).as('createDefaultSchedule');

      cy.get('[data-testid="nav-admin"]').click();
      cy.get('[data-testid="default-schedules-tab"]').click();
      
      cy.get('select[name="dayOfWeek"]').select('1');
      cy.get('input[name="time"]').type('09:00');
      cy.get('input[name="maxParticipants"]').type('10');
      cy.get('button[type="submit"]').click();

      cy.wait('@createDefaultSchedule');
      cy.get('[data-testid="success-message"]').should('contain', 'Default schedule created');

      // Step 2: Create Schedule from Default
      cy.intercept('POST', '/api/default-schedules/create-schedule', {
        statusCode: 201,
        body: {
          id: 'schedule2',
          date: new Date().toISOString(),
          time: '09:00',
          maxParticipants: 10,
          currentParticipants: 0
        }
      }).as('createSchedule');

      cy.get('[data-testid="create-from-default-btn"]').click();
      cy.get('input[name="date"]').type(new Date().toISOString().split('T')[0]);
      cy.get('button[type="submit"]').click();

      cy.wait('@createSchedule');
      cy.get('[data-testid="success-message"]').should('contain', 'Schedule created');

      // Step 3: Manage Users
      cy.intercept('GET', '/api/admin/users', {
        statusCode: 200,
        body: [
          {
            id: '1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            role: 'USER',
            maxBench: 200
          }
        ]
      }).as('getUsers');

      cy.get('[data-testid="user-management-tab"]').click();
      cy.wait('@getUsers');
      
      cy.get('[data-testid="user-row"]').should('contain', 'John Doe');
      
      // Edit user max lifts
      cy.intercept('PUT', '/api/users/1', {
        statusCode: 200,
        body: {
          message: 'User updated successfully',
          user: { id: '1', maxBench: 220 }
        }
      }).as('updateUserMaxLifts');

      cy.get('[data-testid="edit-user-btn"]').click();
      cy.get('input[name="maxBench"]').clear().type('220');
      cy.get('button[type="submit"]').click();

      cy.wait('@updateUserMaxLifts');
      cy.get('[data-testid="success-message"]').should('contain', 'User updated');
    });
  });

  describe('Weight Calculation Integration', () => {
    it('should display correct calculated weights in class view', () => {
      cy.intercept('GET', '/api/workouts/calculate?liftType=BENCH&percentage=75', {
        statusCode: 200,
        body: {
          liftType: 'BENCH',
          maxWeight: 200,
          percentage: 75,
          calculatedWeight: 150
        }
      }).as('calculateBench');

      cy.intercept('GET', '/api/schedules/class', {
        statusCode: 200,
        body: {
          class: {
            participants: [
              {
                user: { 
                  firstName: 'John', 
                  lastName: 'Doe',
                  maxBench: 200,
                  maxOHP: 150,
                  maxSquat: 300,
                  maxDeadlift: 350
                },
                workoutType: 'UPPER'
              }
            ],
            workoutType: 'UPPER',
            scheme: { 
              sets: [{ reps: 5, percentage: 75 }], 
              restTime: 120 
            },
            supplementalWorkouts: []
          }
        }
      }).as('getClassDetailsWithWeights');

      // Login as user
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          user: { id: '1', firstName: 'John', lastName: 'Doe', role: 'USER' },
          token: 'fake-token'
        }
      }).as('userLogin');

      cy.visit('/login');
      cy.get('input[name="email"]').type('john@example.com');
      cy.get('input[name="password"]').type('password');
      cy.get('button[type="submit"]').click();
      cy.wait('@userLogin');

      cy.visit('/lifting-class');
      cy.wait('@getClassDetailsWithWeights');

      // Verify calculated weights are displayed
      cy.get('[data-testid="participant-weights"]').should('contain', '150'); // 75% of 200
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle API errors gracefully throughout the application', () => {
      // Login successfully first
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          user: { id: '1', firstName: 'John', lastName: 'Doe', role: 'USER' },
          token: 'fake-token'
        }
      }).as('successfulLogin');

      cy.visit('/login');
      cy.get('input[name="email"]').type('john@example.com');
      cy.get('input[name="password"]').type('password');
      cy.get('button[type="submit"]').click();
      cy.wait('@successfulLogin');

      // Test schedule fetch failure
      cy.intercept('GET', '/api/schedules', {
        statusCode: 500,
        body: { error: 'Internal server error' }
      }).as('scheduleError');

      cy.visit('/schedule');
      cy.wait('@scheduleError');
      cy.get('[data-testid="error-message"]').should('contain', 'Failed to load schedules');

      // Test class details fetch failure
      cy.intercept('GET', '/api/schedules/class', {
        statusCode: 404,
        body: { error: 'No class found' }
      }).as('classError');

      cy.visit('/lifting-class');
      cy.wait('@classError');
      cy.get('[data-testid="no-class-message"]').should('contain', 'No class available');

      // Test booking failure
      cy.intercept('GET', '/api/schedules', {
        statusCode: 200,
        body: [
          {
            id: 'schedule1',
            date: new Date().toISOString(),
            time: '10:00',
            maxParticipants: 8,
            currentParticipants: 8 // Full capacity
          }
        ]
      }).as('fullSchedule');

      cy.intercept('POST', '/api/schedules/schedule1/book', {
        statusCode: 400,
        body: { error: 'Class is at capacity' }
      }).as('bookingError');

      cy.visit('/schedule');
      cy.wait('@fullSchedule');
      cy.get('[data-testid="book-class-btn"]').click();
      cy.wait('@bookingError');
      cy.get('[data-testid="error-message"]').should('contain', 'Class is at capacity');
    });
  });

  describe('Responsive Design Integration', () => {
    it('should work correctly on mobile devices', () => {
      cy.viewport('iphone-x');
      
      // Login
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          user: { id: '1', firstName: 'John', lastName: 'Doe', role: 'USER' },
          token: 'fake-token'
        }
      }).as('mobileLogin');

      cy.visit('/login');
      cy.get('input[name="email"]').type('john@example.com');
      cy.get('input[name="password"]').type('password');
      cy.get('button[type="submit"]').click();
      cy.wait('@mobileLogin');

      // Test mobile navigation
      cy.get('[data-testid="mobile-menu-button"]').click();
      cy.get('[data-testid="mobile-nav-schedule"]').should('be.visible');
      cy.get('[data-testid="mobile-nav-schedule"]').click();
      
      cy.url().should('include', '/schedule');

      // Test mobile class view
      cy.intercept('GET', '/api/schedules/class', {
        statusCode: 200,
        body: {
          class: {
            participants: [
              { user: { firstName: 'John', lastName: 'Doe' } }
            ],
            workoutType: 'UPPER',
            scheme: { sets: [{ reps: 5 }] },
            supplementalWorkouts: []
          }
        }
      }).as('mobileClassDetails');

      cy.visit('/lifting-class');
      cy.wait('@mobileClassDetails');
      
      // Verify mobile layout
      cy.get('[data-testid="mobile-participant-card"]').should('be.visible');
    });
  });

  describe('Auto-Refresh Integration', () => {
    it('should auto-refresh class data at specified intervals', () => {
      // Initial login
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          user: { id: '1', firstName: 'John', lastName: 'Doe', role: 'USER' },
          token: 'fake-token'
        }
      }).as('login');

      cy.visit('/login');
      cy.get('input[name="email"]').type('john@example.com');
      cy.get('input[name="password"]').type('password');
      cy.get('button[type="submit"]').click();
      cy.wait('@login');

      // Initial class data
      cy.intercept('GET', '/api/schedules/class', {
        statusCode: 200,
        body: {
          class: {
            participants: [
              { user: { firstName: 'John', lastName: 'Doe' } }
            ],
            workoutType: 'UPPER',
            scheme: {},
            supplementalWorkouts: []
          }
        }
      }).as('initialClassData');

      cy.visit('/lifting-class');
      cy.wait('@initialClassData');
      cy.get('[data-testid="participant-count"]').should('contain', '1');

      // Updated class data for refresh
      cy.intercept('GET', '/api/schedules/class', {
        statusCode: 200,
        body: {
          class: {
            participants: [
              { user: { firstName: 'John', lastName: 'Doe' } },
              { user: { firstName: 'Jane', lastName: 'Smith' } }
            ],
            workoutType: 'UPPER',
            scheme: {},
            supplementalWorkouts: []
          }
        }
      }).as('refreshedClassData');

      // Wait for auto-refresh (this would need to be adjusted based on actual refresh timing)
      cy.wait('@refreshedClassData');
      cy.get('[data-testid="participant-count"]').should('contain', '2');
    });
  });
});
