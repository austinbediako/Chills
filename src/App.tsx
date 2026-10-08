import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Provider } from 'react-redux';
import axios from 'axios';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import AdminRoute from './components/AdminRoute';

const TagRouteRedirect: React.FC = () => {
  const { tag } = useParams<{ tag: string }>();
  return <Navigate to={`/explore${tag ? `?tag=${encodeURIComponent(tag.replace(/-/g, ' '))}` : ''}`} replace />;
};

const CategoryRouteRedirect: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  return <Navigate to={`/explore${category ? `?category=${encodeURIComponent(category.replace(/-/g, ' '))}` : ''}`} replace />;
};

// Store
import { store } from './redux/store';

// Layouts
import MainLayout from './layouts/MainLayout';

// Code-split / Lazy-loaded Pages
const HomePage = lazy(() => import('./pages/HomePage'));
const BlogListPage = lazy(() => import('./pages/blog/BlogListPage'));
const BlogDetailPage = lazy(() => import('./pages/blog/BlogDetailPage'));
const EditPostPage = lazy(() => import('./pages/admin/EditPostPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const Authors = lazy(() => import('./pages/Authors'));
const AuthorProfilePage = lazy(() => import('./pages/AuthorProfilePage'));
const AboutPage = lazy(() => import('./pages/About'));
const ContactPage = lazy(() => import('./pages/Contact'));
const MembershipPage = lazy(() => import('./pages/MembershipPage'));
const WritePage = lazy(() => import('./pages/WritePage'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const UsernameSetupPage = lazy(() => import('./pages/UsernameSetupPage'));
const BookmarksPage = lazy(() => import('./pages/BookmarksPage'));
const MyStoriesPage = lazy(() => import('./pages/MyStoriesPage'));
const ReviewsPage = lazy(() => import('./pages/ReviewsPage'));
const SocialFeedPage = lazy(() => import('./pages/SocialFeedPage'));

const HandleRouteRedirectOrProfile: React.FC = () => {
  const { handle } = useParams<{ handle: string }>();
  if (handle?.startsWith('@')) {
    return <AuthorProfilePage />;
  }
  return <NotFoundPage />;
};

// Components
import Notification from './components/common/Notification';
import ProtectedRoute from './components/common/ProtectedRoute';
import PublicRoute from './components/common/PublicRoute';

// Set base URL for API requests
axios.defaults.baseURL = import.meta.env.API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5005';

const PageLoadingFallback: React.FC = () => (
  <div className="min-h-[50vh] flex items-center justify-center py-16">
    <div className="flex flex-col items-center">
      <div className="h-10 w-10 animate-spin rounded-full border-3 border-primary-500 border-t-transparent"></div>
      <p className="mt-3 text-xs font-mono text-dark-400 dark:text-light-400">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <Router>
          <Notification />
          <AnimatePresence mode="wait">
            <Suspense fallback={<PageLoadingFallback />}>
              <Routes>
                <Route path="/" element={<MainLayout />}>
                  <Route index element={<HomePage />} />

                  {/* Social Feed (X-Style Timeline) */}
                  <Route
                    path="feed"
                    element={
                      <ErrorBoundary>
                        <SocialFeedPage />
                      </ErrorBoundary>
                    }
                  />

                {/* Explore Route */}
                <Route
                  path="explore"
                  element={
                    <ErrorBoundary>
                      <BlogListPage />
                    </ErrorBoundary>
                  }
                />

                {/* Bookmarks Route */}
                <Route
                  path="bookmarks"
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <BookmarksPage />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />

                {/* My Stories Route */}
                <Route
                  path="me/stories"
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <MyStoriesPage />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />

                {/* Blog Detail Route (Preserved for backwards compatibility, maybe rename later) */}
                <Route path="blog">
                  <Route
                    path=":slug"
                    element={
                      <ErrorBoundary>
                        <BlogDetailPage />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="edit/:slug"
                    element={
                      <ProtectedRoute>
                        <ErrorBoundary>
                          <EditPostPage />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                </Route>

                {/* Auth Routes */}
                <Route path="auth">
                  <Route
                    path="login"
                    element={
                      <PublicRoute>
                        <LoginPage />
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="signup"
                    element={
                      <PublicRoute>
                        <RegisterPage />
                      </PublicRoute>
                    }
                  />
                </Route>

                {/* Profile Route */}
                <Route
                  path="profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                
                {/* Settings Redirect to Profile */}
                <Route
                  path="settings"
                  element={<Navigate to="/profile" replace />}
                />
                
                {/* Onboarding Routes */}
                <Route path="onboarding">
                  <Route
                    index
                    element={<Navigate to="/onboarding/username" replace />}
                  />
                  <Route
                    path="username"
                    element={
                      <ProtectedRoute>
                        <UsernameSetupPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="interests"
                    element={
                      <ProtectedRoute>
                        <OnboardingPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="*"
                    element={<Navigate to="/onboarding/username" replace />}
                  />
                </Route>
                
                {/* Admin Users Route */}
                <Route
                  path="admin/users"
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <AdminRoute>
                          <Authors />
                        </AdminRoute>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />

                {/* Reviews Route */}
                <Route
                  path="reviews"
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <ReviewsPage />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />

                {/* New Pages */}
                <Route path="about" element={<AboutPage />} />
                <Route path="membership" element={<MembershipPage />} />
                <Route 
                  path="write" 
                  element={
                    <ProtectedRoute>
                      <WritePage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="write/:id" 
                  element={
                    <ProtectedRoute>
                      <WritePage />
                    </ProtectedRoute>
                  } 
                />
                <Route path="contact" element={<ContactPage />} />
                {/* Categories Routes: redirect to /explore?category=... */}
                <Route path="categories" element={<Navigate to="/explore" replace />} />
                <Route path="categories/:category" element={<CategoryRouteRedirect />} />
                
                {/* Author Profile Routes (X / Twitter style layout) */}
                <Route path="authors/:identifier" element={<AuthorProfilePage />} />
                <Route path="author/:identifier" element={<AuthorProfilePage />} />
                <Route path=":handle" element={<HandleRouteRedirectOrProfile />} />

                {/* Tags Routes: redirect to /explore?tag=... */}
                <Route path="tags" element={<Navigate to="/explore" replace />} />
                <Route path="tags/:tag" element={<TagRouteRedirect />} />

                {/* 404 Route */}
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </Suspense>
        </AnimatePresence>
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App;