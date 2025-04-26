import React from 'react';
import { render, screen } from '../utils/test-utils';
import App from '../../App';

test('renders main application', () => {
  render(<App />);
  // Basic validation of structural elements
  const headerElement = screen.getByRole('banner');
  expect(headerElement).toBeInTheDocument();
});