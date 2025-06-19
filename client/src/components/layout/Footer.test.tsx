import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Footer from './Footer';

describe('Footer', () => {
  const renderFooter = () => {
    return render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );
  };

  it('renders the main heading and description', () => {
    renderFooter();
    
    expect(screen.getByText('TFW MMA Lifting Program')).toBeInTheDocument();
    expect(screen.getByText(/An 8-week progressive lifting program/)).toBeInTheDocument();
  });

  it('renders all navigation links', () => {
    renderFooter();
    
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Schedule' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Current Class' })).toBeInTheDocument();
  });

  it('has correct navigation link paths', () => {
    renderFooter();
    
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: 'Schedule' })).toHaveAttribute('href', '/schedule');
    expect(screen.getByRole('link', { name: 'Current Class' })).toHaveAttribute('href', '/class');
  });

  it('renders legal links', () => {
    renderFooter();
    
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Terms of Service' })).toBeInTheDocument();
  });

  it('displays copyright with current year', () => {
    renderFooter();
    
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(`© ${currentYear} TFW MMA. All rights reserved.`)).toBeInTheDocument();
  });

  it('renders social media links with proper accessibility', () => {
    renderFooter();
    
    expect(screen.getByText('Facebook')).toBeInTheDocument();
    expect(screen.getByText('Instagram')).toBeInTheDocument();
    expect(screen.getByText('Twitter')).toBeInTheDocument();
  });

  it('has proper section headings', () => {
    renderFooter();
    
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Legal')).toBeInTheDocument();
  });

  it('applies proper semantic structure', () => {
    renderFooter();
    
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
    expect(footer.tagName).toBe('FOOTER');
  });

  it('has responsive layout classes', () => {
    renderFooter();
    
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveClass('bg-gray-800', 'dark:bg-gray-900', 'text-white', 'py-8');
  });

  it('navigation links have hover styles', () => {
    renderFooter();
    
    const homeLink = screen.getByRole('link', { name: 'Home' });
    expect(homeLink).toHaveClass('text-gray-400', 'hover:text-white', 'transition-colors');
  });

  it('social media links have proper ARIA labels', () => {
    renderFooter();
    
    const socialLinks = screen.getAllByRole('link').filter(link => 
      link.getAttribute('aria-label') || link.querySelector('.sr-only')
    );
    
    expect(socialLinks).toHaveLength(3);
  });
});
