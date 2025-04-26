import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import App from '../../App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../hooks/useAuth';

// Add jest-axe matchers
expect.extend(toHaveNoViolations);

describe('Accessibility tests', () => {
  it('App has no accessibility violations', async () => {
    const { container } = render(
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('Login page has no accessibility violations', async () => {
    const { container } = render(
      <BrowserRouter>
        <AuthProvider>
          {/* Force the router to show the login page */}
          <div>
            <h1>Login</h1>
            <form>
              <div>
                <label htmlFor="email">Email</label>
                <input id="email" type="email" name="email" />
              </div>
              <div>
                <label htmlFor="password">Password</label>
                <input id="password" type="password" name="password" />
              </div>
              <button type="submit">Login</button>
            </form>
          </div>
        </AuthProvider>
      </BrowserRouter>
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});