import { useState } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '~/components/ui/button';
import { useAuth } from '~/hooks/useAuth';
import { useLogout } from '~/hooks/api/useAuthMutations';
import { AuthDialog } from '~/components/auth/AuthDialog';
import { cn } from '~/lib/utils';
import { User, LogOut, Menu, X } from 'lucide-react';

/**
 * Navigation bar component with glassmorphism styling and auth state
 */
export function Navbar() {
  const { user } = useAuth();
  const logoutMutation = useLogout();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
  };

  return (
    <>
      <nav
        className={cn(
          // Position
          'sticky top-0 z-50',
          // Layout
          'w-full',
          // Box model
          'border-b border-white/20',
          // Visuals
          'bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-lg'
        )}
      >
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Booka
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-4">
              <AnimatePresence mode="wait">
                {user ? (
                  <motion.div
                    key="authenticated"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center space-x-4"
                  >
                    <Link to="/profile">
                      <Button variant="ghost" className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>{user.name}</span>
                      </Button>
                    </Link>
                    <Button variant="outline" onClick={handleLogout} disabled={logoutMutation.isPending}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="unauthenticated"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <Button onClick={() => setAuthDialogOpen(true)}>Login</Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden mt-4 space-y-2"
              >
                {user ? (
                  <>
                    <Link to="/profile" className="block">
                      <Button variant="ghost" className="w-full justify-start">
                        <User className="h-4 w-4 mr-2" />
                        {user.name}
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleLogout}
                      disabled={logoutMutation.isPending}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <Button className="w-full" onClick={() => setAuthDialogOpen(true)}>
                    Login
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </>
  );
}

