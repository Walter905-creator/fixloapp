/**
 * Test suite for Social Sharing functionality (Twitter/Facebook validation)
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ShareProfileButton from '../components/share/ShareProfileButton';
import ShareProfileModal from '../components/share/ShareProfileModal';

// Mock the API module
jest.mock('../lib/api', () => ({
  post: jest.fn()
}));

import api from '../lib/api';

// Mock window.open
const mockWindowOpen = jest.fn();
Object.defineProperty(window, 'open', {
  writable: true,
  value: mockWindowOpen
});

// Mock navigator.clipboard
const mockClipboard = {
  writeText: jest.fn()
};
Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  value: mockClipboard
});

describe('ShareProfileButton Tests', () => {
  const mockPro = {
    _id: 'test-pro-id',
    slug: 'john-doe-plumber',
    businessName: 'John Doe Plumbing',
    firstName: 'John',
    lastName: 'Doe',
    primaryService: 'Plumbing',
    city: 'San Francisco',
    state: 'CA'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockWindowOpen.mockClear();
    mockClipboard.writeText.mockClear();
  });

  test('should render share button with proper accessibility attributes', () => {
    render(<ShareProfileButton pro={mockPro} />);
    
    const shareButton = screen.getByRole('button', { name: 'Share profile on social media' });
    expect(shareButton).toBeInTheDocument();
    expect(shareButton).toHaveAttribute('aria-expanded', 'false');
    expect(shareButton).toHaveAttribute('aria-haspopup', 'menu');
  });

  test('should open share menu when clicked', () => {
    render(<ShareProfileButton pro={mockPro} />);
    
    const shareButton = screen.getByRole('button', { name: 'Share profile on social media' });
    fireEvent.click(shareButton);
    
    expect(shareButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menu', { name: 'Share options' })).toBeInTheDocument();
  });

  test('should support keyboard navigation', () => {
    render(<ShareProfileButton pro={mockPro} />);
    
    const shareButton = screen.getByRole('button', { name: 'Share profile on social media' });
    
    // Test Enter key
    fireEvent.keyDown(shareButton, { key: 'Enter', code: 'Enter' });
    expect(shareButton).toHaveAttribute('aria-expanded', 'true');
    
    // Test Space key
    fireEvent.click(shareButton); // Close menu first
    fireEvent.keyDown(shareButton, { key: ' ', code: 'Space' });
    expect(shareButton).toHaveAttribute('aria-expanded', 'true');
  });

  test('should handle Facebook sharing correctly', async () => {
    mockApi.post.mockResolvedValue({ data: { ok: true } });
    
    render(<ShareProfileButton pro={mockPro} />);
    
    const shareButton = screen.getByRole('button', { name: 'Share profile on social media' });
    fireEvent.click(shareButton);
    
    const facebookButton = screen.getByRole('menuitem', { name: 'Share profile on Facebook' });
    fireEvent.click(facebookButton);
    
    // Verify Facebook URL format
    await waitFor(() => {
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('facebook.com/sharer/sharer.php'),
        '_blank',
        'width=600,height=400,scrollbars=yes,resizable=yes'
      );
    });
    
    // Verify API call for tracking
    expect(api.post).toHaveBeenCalledWith(
      `/api/profiles/${mockPro._id}/share-event`,
      { medium: 'facebook' }
    );
  });

  test('should handle Twitter/X sharing correctly', async () => {
    mockApi.post.mockResolvedValue({ data: { ok: true } });
    
    render(<ShareProfileButton pro={mockPro} />);
    
    const shareButton = screen.getByRole('button', { name: 'Share profile on social media' });
    fireEvent.click(shareButton);
    
    const twitterButton = screen.getByRole('menuitem', { name: 'Share profile on Twitter/X' });
    fireEvent.click(twitterButton);
    
    // Verify Twitter URL format
    await waitFor(() => {
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('twitter.com/intent/tweet'),
        '_blank',
        'width=600,height=400,scrollbars=yes,resizable=yes'
      );
    });
    
    // Verify API call for tracking
    expect(api.post).toHaveBeenCalledWith(
      `/api/profiles/${mockPro._id}/share-event`,
      { medium: 'x' }
    );
  });

  test('should handle copy link functionality', async () => {
    mockApi.post.mockResolvedValue({ data: { ok: true } });
    mockClipboard.writeText.mockResolvedValue();
    
    render(<ShareProfileButton pro={mockPro} />);
    
    const shareButton = screen.getByRole('button', { name: 'Share profile on social media' });
    fireEvent.click(shareButton);
    
    const copyButton = screen.getByRole('menuitem', { name: 'Copy profile link to clipboard' });
    fireEvent.click(copyButton);
    
    // Verify clipboard operation
    await waitFor(() => {
      expect(mockClipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('/pro/')
      );
    });
    
    // Verify API call for tracking
    expect(api.post).toHaveBeenCalledWith(
      `/api/profiles/${mockPro._id}/share-event`,
      { medium: 'copy' }
    );
  });

  test('should generate correct share text and URLs', () => {
    render(<ShareProfileButton pro={mockPro} />);
    
    const shareButton = screen.getByRole('button', { name: 'Share profile on social media' });
    fireEvent.click(shareButton);
    
    const facebookButton = screen.getByRole('menuitem', { name: 'Share profile on Facebook' });
    fireEvent.click(facebookButton);
    
    const expectedProfileUrl = `${window.location.origin}/pro/${mockPro.slug}`;
    const expectedShareText = `Check out ${mockPro.businessName}, a trusted ${mockPro.primaryService} professional in ${mockPro.city}, ${mockPro.state}. Get your free quote on Fixlo!`;
    
    expect(mockWindowOpen).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent(expectedProfileUrl)),
      '_blank',
      'width=600,height=400,scrollbars=yes,resizable=yes'
    );
    
    expect(mockWindowOpen).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent(expectedShareText)),
      '_blank',
      'width=600,height=400,scrollbars=yes,resizable=yes'
    );
  });
});

describe('ShareProfileModal Tests', () => {
  const mockPro = {
    _id: 'test-pro-id',
    slug: 'jane-smith-electrician',
    businessName: 'Jane Smith Electric',
    firstName: 'Jane',
    lastName: 'Smith'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockWindowOpen.mockClear();
  });

  test('should render modal with proper accessibility attributes', () => {
    const mockOnClose = jest.fn();
    
    render(
      <ShareProfileModal 
        isOpen={true} 
        onClose={mockOnClose} 
        pro={mockPro} 
        api={mockApi}
      />
    );
    
    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();
    expect(modal).toHaveAttribute('aria-modal', 'true');
    expect(modal).toHaveAttribute('aria-labelledby', 'share-modal-title');
    expect(modal).toHaveAttribute('aria-describedby', 'share-modal-description');
  });

  test('should generate UTM-tagged URLs', () => {
    const mockOnClose = jest.fn();
    
    render(
      <ShareProfileModal 
        isOpen={true} 
        onClose={mockOnClose} 
        pro={mockPro} 
        api={api}
        origin="https://www.fixloapp.com"
      />
    );
    
    // Check that the displayed URL contains UTM parameters
    const shareUrl = screen.getByText(/Your share URL:/);
    expect(shareUrl.textContent).toContain('utm_source=share');
    expect(shareUrl.textContent).toContain('utm_campaign=profile_share');
  });

  test('should handle platform-specific sharing', async () => {
    api.post.mockResolvedValue({ data: { ok: true } });
    const mockOnClose = jest.fn();
    
    render(
      <ShareProfileModal 
        isOpen={true} 
        onClose={mockOnClose} 
        pro={mockPro} 
        api={api}
      />
    );
    
    const linkedinButton = screen.getByRole('button', { name: 'Share profile on LinkedIn' });
    fireEvent.click(linkedinButton);
    
    await waitFor(() => {
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('linkedin.com/sharing/share-offsite'),
        '_blank',
        'noopener,noreferrer'
      );
    });
    
    // Verify tracking call with UTM parameters
    expect(api.post).toHaveBeenCalledWith(
      `/api/profiles/${mockPro._id}/share-event`,
      {
        medium: 'linkedin',
        utm: { source: 'share', campaign: 'profile_share', medium: 'linkedin' }
      }
    );
  });

  test('should support keyboard navigation in modal', () => {
    const mockOnClose = jest.fn();
    
    render(
      <ShareProfileModal 
        isOpen={true} 
        onClose={mockOnClose} 
        pro={mockPro} 
        api={api}
      />
    );
    
    const facebookButton = screen.getByRole('button', { name: 'Share profile on Facebook' });
    
    // Test keyboard interaction
    fireEvent.keyDown(facebookButton, { key: 'Enter', code: 'Enter' });
    
    expect(mockWindowOpen).toHaveBeenCalledWith(
      expect.stringContaining('facebook.com'),
      '_blank',
      'noopener,noreferrer'
    );
  });

  test('should not render when isOpen is false', () => {
    const mockOnClose = jest.fn();
    
    render(
      <ShareProfileModal 
        isOpen={false} 
        onClose={mockOnClose} 
        pro={mockPro} 
        api={api}
      />
    );
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});