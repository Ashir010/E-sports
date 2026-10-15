import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/layout/Navbar.jsx';
import Footer from '../components/layout/Footer.jsx';
import { PageTransition } from '../components/layout/Motion.jsx';
import PageFallback from '../components/ui/PageFallback.jsx';

export default function PublicLayout() {
  const location = useLocation();
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main id="main" className="flex-1">
        {/* Enter-only transition keyed by path: never blocks navigation */}
        <PageTransition key={location.pathname}>
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </PageTransition>
      </main>
      <Footer />
    </div>
  );
}
