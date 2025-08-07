import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function URLRedirectHandler() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const { pathname, search } = location;

    // Handle legacy .html extensions
    if (pathname.endsWith('.html')) {
      const newPath = pathname.replace('.html', '');
      navigate(newPath + search, { replace: true });
      return;
    }

    // Handle trailing slashes for consistency
    if (pathname !== '/' && pathname.endsWith('/')) {
      const newPath = pathname.slice(0, -1);
      navigate(newPath + search, { replace: true });
      return;
    }

    // Handle old signup patterns
    if (pathname === '/pro-signup' || pathname === '/pro-signup.html') {
      navigate('/signup' + search, { replace: true });
      return;
    }

    // Handle old contact patterns
    if (pathname === '/contact.html') {
      navigate('/contact' + search, { replace: true });
      return;
    }

    // Handle old terms patterns
    if (pathname === '/terms.html') {
      navigate('/terms' + search, { replace: true });
      return;
    }

    // Handle old how-it-works patterns
    if (pathname === '/how-it-works.html') {
      navigate('/how-it-works' + search, { replace: true });
      return;
    }
  }, [location, navigate]);

  return null; // This component doesn't render anything
}