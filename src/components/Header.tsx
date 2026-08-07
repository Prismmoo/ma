import React, { useEffect, useState } from 'react';
import { Menu, User, ShoppingBag, X, Upload } from 'lucide-react';
import { StyleType } from '../types';
import { useRoutePrefetch } from '../hooks/useRoutePrefetch';
import { AnimatePresence, motion } from 'motion/react';

interface HeaderProps {
  activeTab:
    | 'home'
    | 'gallery'
    | 'visualizer'
    | 'artists'
    | 'stickers'
    | 'packs'
    | 'threed'
    | 'upload';
  setActiveTab: (
    tab:
      | 'home'
      | 'gallery'
      | 'visualizer'
      | 'artists'
      | 'stickers'
      | 'packs'
      | 'threed'
      | 'upload',
  ) => void;
  onSelectCategory: (category: StyleType) => void;
  cartCount: number;
  toggleCart: () => void;
  onOpenMap: () => void;
  logoOnly?: boolean;
}

export default function Header({
  activeTab,
  setActiveTab,
  cartCount,
  toggleCart,
  onOpenMap,
  logoOnly = false,
}: HeaderProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const prefetch = useRoutePrefetch();

  useEffect(() => {
    let lastScrollY = window.scrollY;
    setIsScrolled(window.scrollY > 15);
    setIsVisible(true);

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 15);

      if (activeTab !== 'home') {
        setIsVisible(true);
      } else {
        if (currentScrollY <= 40 || currentScrollY < lastScrollY) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeTab]);

  const navItems = [
    { label: 'THE SHOW', value: 'home' as const },
    { label: 'Paintings', value: 'gallery' as const },
    { label: 'Upload Artwork', value: 'upload' as const },
    { label: 'Stickers', value: 'stickers' as const },
    { label: 'Packs', value: 'packs' as const },
    { label: '3D Painting', value: 'threed' as const },
    { label: 'Artists', value: 'artists' as const },
  ];

  const logoOnlyMode = logoOnly || (activeTab === 'home' && !isScrolled);

  const shouldHideHeaderBar = activeTab === 'home' && !isScrolled;

  return (
    <>
      <header
        id="main-header"
      className={`fixed top-0 left-0 z-50 w-full px-4 py-3 transition-all duration-500 ease-in-out md:px-8 md:py-5 ${
        isVisible
          ? 'translate-y-0 opacity-100'
          : '-translate-y-full pointer-events-none opacity-0'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between relative min-h-[52px]">
        {/* Soft-UI Floating Capsule Bar (Desktop & Tablet) - Hidden ONLY on video home page top */}
        <div
          className={`nn-neumorphic-bar hidden md:flex items-center justify-between w-full transition-all duration-500 ease-in-out ${
            shouldHideHeaderBar
              ? 'opacity-0 pointer-events-none -translate-y-5 scale-95'
              : 'opacity-100 pointer-events-auto translate-y-0 scale-100'
          }`}
        >
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className="nn-soft-brand-button group"
              aria-label="Go to home page"
            >
              <img
                src="https://i.postimg.cc/TwBdkyhx/Untitled-(1898-x-947-px)-(1).png"
                alt="NN Logo"
                className="h-8 md:h-10 w-auto bg-transparent object-contain transition-transform group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
            </button>

            <button
              type="button"
              onClick={onOpenMap}
              className="nn-soft-pill-icon-btn"
              aria-label="Open website map"
              title="Site Navigation Map"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1.5" aria-label="Primary navigation">
            {navItems.map((item) => {
              const isActive = activeTab === item.value;

              return (
                <button
                  type="button"
                  key={item.label}
                  onClick={() => setActiveTab(item.value)}
                  onMouseEnter={() => prefetch(item.value)}
                  onFocus={() => prefetch(item.value)}
                  onTouchStart={() => prefetch(item.value)}
                  className={`nn-soft-nav-link ${
                    isActive ? 'nn-soft-nav-link--active' : ''
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* User Actions */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`nn-soft-pill-icon-btn relative group transition-all ${
                activeTab === 'upload' ? 'border-forest-gold text-forest-gold bg-forest-gold/15' : ''
              }`}
              title="Upload Custom Artwork"
              aria-label="Upload custom artwork"
            >
              <Upload className="h-4 w-4 text-forest-gold" />
            </button>

            <button
              type="button"
              onClick={toggleCart}
              className="nn-soft-pill-icon-btn relative group"
              aria-label="Open cart"
            >
              <ShoppingBag className="h-4 w-4 transition-transform group-hover:scale-105" />

              {cartCount > 0 && (
                <span className="nn-soft-cart-badge">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar - Hidden ONLY on video home page top */}
        <div
          className={`flex md:hidden items-center justify-between w-full nn-neumorphic-bar-mobile transition-all duration-500 ease-in-out ${
            shouldHideHeaderBar
              ? 'opacity-0 pointer-events-none -translate-y-5 scale-95'
              : 'opacity-100 pointer-events-auto translate-y-0 scale-100'
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className="nn-soft-brand-button"
            aria-label="Go to home page"
          >
            <img
              src="https://i.postimg.cc/TwBdkyhx/Untitled-(1898-x-947-px)-(1).png"
              alt="NN Logo"
              className="h-8 w-auto bg-transparent object-contain"
              referrerPolicy="no-referrer"
            />
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`nn-soft-pill-icon-btn relative ${
                activeTab === 'upload' ? 'border-forest-gold text-forest-gold bg-forest-gold/15' : ''
              }`}
              title="Upload Custom Artwork"
              aria-label="Upload custom artwork"
            >
              <Upload className="h-4 w-4 text-forest-gold" />
            </button>

            <button
              type="button"
              onClick={toggleCart}
              className="nn-soft-pill-icon-btn relative"
              aria-label="Open cart"
            >
              <ShoppingBag className="h-4 w-4" />
              {cartCount > 0 && (
                <span className="nn-soft-cart-badge">{cartCount}</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="nn-soft-pill-icon-btn"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="nn-soft-mobile-overlay fixed inset-0 z-[60] flex justify-end md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%', scale: 0.95, opacity: 0 }}
              animate={{ x: 0, scale: 1, opacity: 1 }}
              exit={{ x: '100%', scale: 0.95, opacity: 0, transition: { ease: 'easeInOut', duration: 0.3 } }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="nn-soft-mobile-panel h-full w-[85%] max-w-[350px] shadow-2xl flex flex-col"
              style={{ 
                borderRadius: '24px 0 0 24px', 
                borderRight: 'none',
                paddingTop: 'max(24px, env(safe-area-inset-top))',
                paddingBottom: 'max(24px, env(safe-area-inset-bottom))'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-8 mt-2 flex items-center justify-between px-2">
                <div className="flex items-center gap-2.5">
                  <img
                    src="https://i.postimg.cc/TwBdkyhx/Untitled-(1898-x-947-px)-(1).png"
                    alt="NN Logo"
                    className="h-8 w-auto bg-transparent object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="nn-soft-pill-icon-btn"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </div>

              <nav className="flex flex-col gap-3 px-2 overflow-y-auto" aria-label="Mobile navigation">
                {navItems.map((item, index) => {
                  const isActive = activeTab === item.value;

                  return (
                    <motion.button
                      initial={{ opacity: 0, x: 30, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 20, scale: 0.85, transition: { duration: 0.2, delay: (navItems.length - index - 1) * 0.03 } }}
                      transition={{ type: 'spring', delay: index * 0.05 + 0.1, damping: 20, stiffness: 250 }}
                      type="button"
                      key={item.label}
                      onClick={() => {
                        setActiveTab(item.value);
                        setMobileMenuOpen(false);
                      }}
                      onMouseEnter={() => prefetch(item.value)}
                      onFocus={() => prefetch(item.value)}
                      onTouchStart={() => prefetch(item.value)}
                      className={`nn-soft-mobile-link text-right flex justify-end text-lg py-3.5 tracking-wide ${
                        isActive ? 'nn-soft-mobile-link--active' : ''
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {item.label}
                    </motion.button>
                  );
                })}
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

