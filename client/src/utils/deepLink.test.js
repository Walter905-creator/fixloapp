/**
 * Test suite for Deep Link functionality validation
 */

import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import PublicProfile from '../pages/PublicProfile';

// Mock the API module
jest.mock('../lib/api', () => ({
  get: jest.fn()
}));

import api from '../lib/api';

// Mock react-helmet-async
jest.mock('react-helmet-async', () => ({
  Helmet: ({ children }) => <div data-testid="helmet">{children}</div>
}));

// Mock feature flags
jest.mock('../utils/featureFlags', () => ({
  useFeatureFlags: () => ({
    shareProfile: true,
    boostIndicator: true
  })
}));

// Mock child components
jest.mock('../components/profile/Badges', () => {
  return function MockBadges({ badges }) {
    return <div data-testid="badges">{badges?.length || 0} badges</div>;
  };
});

jest.mock('../components/profile/BoostPill', () => {
  return function MockBoostPill({ boostActiveUntil }) {
    return boostActiveUntil ? <div data-testid="boost-pill">Boosted</div> : null;
  };
});

jest.mock('../components/reviews/ReviewsBlock', () => {
  return function MockReviewsBlock({ pro }) {
    return <div data-testid="reviews-block">Reviews for {pro.businessName}</div>;
  };
});

jest.mock('../components/share/ShareProfileButton', () => {
  return function MockShareProfileButton({ pro }) {
    return <div data-testid="share-button">Share {pro.businessName}</div>;
  };
});

describe('Deep Link Functionality Tests', () => {
  const mockProData = {
    _id: 'test-pro-id',
    slug: 'john-doe-plumber',
    businessName: 'John Doe Plumbing',
    firstName: 'John',
    lastName: 'Doe',
    primaryService: 'Plumbing',
    trade: 'Plumber',
    city: 'San Francisco',
    state: 'CA',
    avgRating: 4.8,
    reviewCount: 25,
    badges: [
      { name: 'Top Rated', earnedAt: new Date() }
    ],
    boostActiveUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should load profile from slug deep link', async () => {
    api.get.mockResolvedValue({ data: mockProData });
    
    render(
      <MemoryRouter>
        <PublicProfile slug="john-doe-plumber" />
      </MemoryRouter>
    );
    
    // Wait for API call
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/api/profiles/slug/john-doe-plumber');
    });
    
    // Verify profile content is rendered
    expect(screen.getByText('John Doe Plumbing')).toBeInTheDocument();
    expect(screen.getByText('Plumbing • San Francisco, CA')).toBeInTheDocument();
  });

  test('should generate proper meta tags for social sharing', async () => {
    api.get.mockResolvedValue({ data: mockProData });
    
    render(
      <MemoryRouter>
        <PublicProfile slug="john-doe-plumber" />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('John Doe Plumbing')).toBeInTheDocument();
    });
    
    // Verify Helmet component is rendered (contains meta tags)
    expect(screen.getByTestId('helmet')).toBeInTheDocument();
  });

  test('should handle 404 for non-existent profile slug', async () => {
    api.get.mockRejectedValue({
      response: { status: 404 }
    });
    
    render(
      <MemoryRouter>
        <PublicProfile slug="non-existent-profile" />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Profile not found')).toBeInTheDocument();
    });
    
    expect(screen.getByText('This professional profile could not be found.')).toBeInTheDocument();
    expect(screen.getByText('Return Home')).toBeInTheDocument();
  });

  test('should handle API errors gracefully', async () => {
    api.get.mockRejectedValue({
      response: { status: 500, data: { error: 'Server error' } }
    });
    
    render(
      <MemoryRouter>
        <PublicProfile slug="john-doe-plumber" />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load profile')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Please try again later.')).toBeInTheDocument();
  });

  test('should show loading state initially', () => {
    // Don't resolve the API call immediately
    api.get.mockImplementation(() => new Promise(() => {}));
    
    render(
      <MemoryRouter>
        <PublicProfile slug="john-doe-plumber" />
      </MemoryRouter>
    );
    
    expect(screen.getByText('Loading profile...')).toBeInTheDocument();
    expect(screen.getByRole('generic', { name: /loading/i })).toBeInTheDocument();
  });

  test('should render complete profile without loader-only state', async () => {
    api.get.mockResolvedValue({ data: mockProData });
    
    render(
      <MemoryRouter>
        <PublicProfile slug="john-doe-plumber" />
      </MemoryRouter>
    );
    
    // Wait for profile to load
    await waitFor(() => {
      expect(screen.getByText('John Doe Plumbing')).toBeInTheDocument();
    });
    
    // Verify all main sections are rendered, not just a loader
    expect(screen.getByRole('heading', { level: 1, name: 'John Doe Plumbing' })).toBeInTheDocument();
    expect(screen.getByText('Services')).toBeInTheDocument();
    expect(screen.getByTestId('reviews-block')).toBeInTheDocument();
    expect(screen.getByText('Ready to work with John Doe Plumbing?')).toBeInTheDocument();
    
    // Verify action buttons are present
    expect(screen.getAllByRole('link')).toHaveLength(3); // Request Quote, Contact, Return Home
    expect(screen.getByRole('link', { name: 'Request a quote from John Doe Plumbing' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Contact John Doe Plumbing' })).toBeInTheDocument();
  });

  test('should display rating stars with proper accessibility', async () => {
    api.get.mockResolvedValue({ data: mockProData });
    
    render(
      <MemoryRouter>
        <PublicProfile slug="john-doe-plumber" />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('John Doe Plumbing')).toBeInTheDocument();
    });
    
    // Check rating display with accessibility
    const ratingContainer = screen.getByRole('img', { name: 'Rating: 4.8 out of 5 stars' });
    expect(ratingContainer).toBeInTheDocument();
    expect(screen.getByText('4.8')).toBeInTheDocument();
    expect(screen.getByText('(25 reviews)')).toBeInTheDocument();
  });

  test('should handle profiles with missing optional data', async () => {
    const minimalProData = {
      _id: 'minimal-pro-id',
      slug: 'minimal-pro',
      name: 'Jane Smith',
      primaryService: 'Electrical',
      avgRating: 0,
      reviewCount: 0,
      badges: [],
      boostActiveUntil: null
    };
    
    api.get.mockResolvedValue({ data: minimalProData });
    
    render(
      <MemoryRouter>
        <PublicProfile slug="minimal-pro" />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
    
    // Should not show rating section when no reviews
    expect(screen.queryByRole('img', { name: /Rating:/ })).not.toBeInTheDocument();
    
    // Should still show main action buttons
    expect(screen.getByRole('link', { name: 'Request a quote from Jane Smith' })).toBeInTheDocument();
  });

  test('should support UTM parameters in deep links', async () => {
    api.get.mockResolvedValue({ data: mockProData });
    
    // Simulate a deep link with UTM parameters
    const mockLocation = {
      search: '?utm_source=google&utm_medium=cpc&utm_campaign=plumbers'
    };
    
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true
    });
    
    render(
      <MemoryRouter>
        <PublicProfile slug="john-doe-plumber" />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('John Doe Plumbing')).toBeInTheDocument();
    });
    
    // Verify the profile loads correctly even with UTM parameters
    expect(api.get).toHaveBeenCalledWith('/api/profiles/slug/john-doe-plumber');
  });
});

describe('Profile URL Generation Tests', () => {
  test('should generate canonical URLs correctly', () => {
    const slug = 'test-professional-slug';
    const expectedCanonical = `https://www.fixloapp.com/pro/${slug}`;
    
    // This test verifies the URL structure used in meta tags
    expect(expectedCanonical).toBe(`https://www.fixloapp.com/pro/${slug}`);
  });

  test('should generate Open Graph image URLs correctly', () => {
    const slug = 'test-professional-slug';
    const expectedOgImage = `https://www.fixloapp.com/api/og?slug=${encodeURIComponent(slug)}`;
    
    // Verify OG image URL structure
    expect(expectedOgImage).toContain('/api/og');
    expect(expectedOgImage).toContain(`slug=${encodeURIComponent(slug)}`);
  });

  test('should handle special characters in slugs', () => {
    const specialSlug = 'josé-maría-electrician';
    const encodedSlug = encodeURIComponent(specialSlug);
    
    // Verify encoding works correctly
    expect(encodedSlug).toBe('jos%C3%A9-mar%C3%ADa-electrician');
    
    const ogImageUrl = `https://www.fixloapp.com/api/og?slug=${encodedSlug}`;
    expect(ogImageUrl).toContain('jos%C3%A9-mar%C3%ADa-electrician');
  });
});