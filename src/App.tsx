import React, { Suspense, lazy, useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import PageTransition from './components/PageTransition';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import RouteFallback from './components/RouteFallback';
import AuroraBackground from './components/AuroraBackground';

const GalleryView        = lazy(() => import('./components/GalleryView'));
const VisualizerView     = lazy(() => import('./components/VisualizerView'));
const ArtistBioView      = lazy(() => import('./components/ArtistBioView'));
const StickersView       = lazy(() => import('./components/StickersView'));
const PacksView          = lazy(() => import('./components/PacksView'));
const ThreeDPaintingView = lazy(() => import('./components/ThreeDPaintingView'));
const UploadView         = lazy(() => import('./components/UploadView'));
const ProductDetailModal = lazy(() => import('./components/ProductDetailModal'));
const WebsiteMapModal    = lazy(() => import('./components/WebsiteMapModal'));
const OrderStatusModal   = lazy(() => import('./components/OrderStatusModal'));

import MobileVisualizer    from './components/mobile/MobileVisualizer';
import MobileProductDetail from './components/mobile/MobileProductDetail';

import { useBreakpoint } from './hooks/useBreakpoint';
import CartDrawer from './components/CartDrawer';
import { Painting, FramingOption, CartItem, StyleType } from './types';
import type { Personalization } from './lib/personalization';
import { PAINTINGS, FRAMING_OPTIONS } from './data';
import { HelpCircle, ShieldCheck, Mail, Copyright, Instagram } from 'lucide-react';
import { useRemembered } from './hooks/useNavMemory';
import { installNavMemoryJanitor, recall } from './lib/navMemory';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useRemembered<'home' | 'gallery' | 'visualizer' | 'artists' | 'stickers' | 'packs' | 'threed' | 'upload'>('tab:active', 'home');
  const { isMobile } = useBreakpoint();
  const isMobileVisualizer = isMobile && activeTab === 'visualizer';
  const [initialStyleFilter, setInitialStyleFilter] = useState<StyleType | null>(null);
  const [showHomeContent, setShowHomeContent] = useState<boolean>(false);
  const [isMapOpen, setIsMapOpen] = useState<boolean>(false);

  useEffect(() => {
    return installNavMemoryJanitor();
  }, []);

  const handleTabChange = (tab: 'home' | 'gallery' | 'visualizer' | 'artists' | 'stickers' | 'packs' | 'threed' | 'upload') => {
    setActiveTab(tab);
    if (tab !== 'gallery') {
      setInitialStyleFilter(null);
    }
    if (tab === 'home') {
      setShowHomeContent(false);
    }
  };
  
  // Cart & Drawer State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // Order Status Modal state
  const [statusModalOrder, setStatusModalOrder] = useState<{
    id: string;
    folderUrl: string | null;
    whatsappUrl: string | null;
    customerName?: string;
  } | null>(null);
  
  // Painting detail modal state
  const [selectedPainting, setSelectedPainting] = useState<Painting | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);
  const [detailFrame, setDetailFrame] = useState<FramingOption>(FRAMING_OPTIONS[0]); // Default Oak

  // Visualizer state: holds the painting that should be pre-loaded into the virtual room
  const [visualizerPainting, setVisualizerPainting] = useState<Painting | null>(null);
  const [visualizerFrame, setVisualizerFrame] = useState<FramingOption>(FRAMING_OPTIONS[0]);

  // Handle viewing story / opening modal
  const handleOpenDetailModal = (painting: Painting) => {
    setSelectedPainting(painting);
    setDetailFrame(FRAMING_OPTIONS[0]); // Reset to raw oak or similar
    setDetailModalOpen(true);
  };

  // Add item to cart
  const handleAddToCart = (
    painting: Painting,
    frame: FramingOption,
    personalization?: Personalization,
  ) => {
    setCartItems((prev) => {
      const key = (i: CartItem) =>
        i.painting.id + '|' + i.frame.id + '|' + (i.personalization?.updatedAt ?? 0);
      const incoming = painting.id + '|' + frame.id + '|' + (personalization?.updatedAt ?? 0);

      const existing = prev.find((i) => key(i) === incoming);
      if (existing) {
        return prev.map((i) => (key(i) === incoming ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { painting, frame, quantity: 1, personalization }];
    });

    // Close detail modal if open
    setDetailModalOpen(false);

    // Auto open cart drawer to give direct luxury feedback
    setIsCartOpen(true);
  };

  // Remove item from cart
  const handleRemoveFromCart = (paintingId: string) => {
    setCartItems(prev => prev.filter(item => item.painting.id !== paintingId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Redirect to wall visualizer from detail modal
  const handleSimulateInRoom = (painting: Painting) => {
    setVisualizerPainting(painting);
    setVisualizerFrame(detailFrame);
    setDetailModalOpen(false);
    handleTabChange('visualizer');
  };

  /*
   * مستوى المعرض كما تراه الذاكرة. نقرأه ولا نخزّنه: مصدر الحقيقة
   * هو useGalleryFilters، وأي نسخة ثانية من نفس الحالة تصير مصدر تناقض.
   */
  const galleryScope = (() => {
    const cat = recall<string | null>('gallery:gallery:category');
    const sub = recall<string | null>('gallery:gallery:sub');
    const confirmed = recall<boolean>('gallery:gallery:confirmed');
    if (confirmed && sub) return `items:${sub}`;
    if (cat) return `collections:${cat}`;
    return 'categories';
  })();

  const stickersScope = (() => {
    const cat = recall<string | null>('stickers:category');
    const sub = recall<string | null>('stickers:sub');
    const confirmed = recall<boolean>('stickers:confirmed');
    if (confirmed && sub) return `items:${sub}`;
    if (cat) return `collections:${cat}`;
    return 'categories';
  })();

  const mainClassName = isMobileVisualizer
    ? 'flex-grow min-h-0'
    : activeTab !== 'home'
      ? 'flex-grow pt-24'
      : showHomeContent
        ? 'flex-grow w-full'
        : 'flex-grow h-full w-full overflow-hidden';

  return (
    <>
      <AuroraBackground />
      <div className={`relative z-10 min-h-screen text-forest-cream flex flex-col justify-between font-sans ${activeTab === 'home' && !showHomeContent ? 'h-screen overflow-hidden' : ''}`}>
      {/* 1. Header Navigation */}
      {!isMobileVisualizer && (
        <Header
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          onSelectCategory={(category) => {
            setInitialStyleFilter(category);
            handleTabChange('gallery');
          }}
          cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
          toggleCart={() => setIsCartOpen(!isCartOpen)}
          onOpenMap={() => setIsMapOpen(true)}
          logoOnly={activeTab === 'home' && !showHomeContent}
        />
      )}

      {/* 2. Main Content Routing */}
      <main className={mainClassName}>
        <Suspense fallback={<RouteFallback label={activeTab} />}>
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <PageTransition routeKey="home" resetScroll={false} className="h-full w-full">
              <HeroSection
                onExploreGallery={() => handleTabChange('gallery')}
                onTryVisualizer={() => handleTabChange('visualizer')}
                featuredPaintings={PAINTINGS.filter(p => p.featured)}
                onSelectPainting={handleOpenDetailModal}
                setActiveTab={handleTabChange}
                onSelectCategory={(category) => {
                  setInitialStyleFilter(category);
                  handleTabChange('gallery');
                }}
                showAllContent={showHomeContent}
                onExploreCategoriesClick={() => setShowHomeContent(true)}
              />
            </PageTransition>
          )}

          {activeTab === 'gallery' && (
            <PageTransition routeKey="gallery" scrollScope={galleryScope}>
              <GalleryView
                onSelectPainting={handleOpenDetailModal}
                initialStyleFilter={initialStyleFilter}
                onClearInitialStyleFilter={() => setInitialStyleFilter(null)}
              />
            </PageTransition>
          )}

          {activeTab === 'visualizer' && (
            <PageTransition
              routeKey={isMobile ? 'visualizer-mobile' : 'visualizer-desktop'}
              resetScroll={false}
              className={isMobile ? 'h-[100dvh] min-h-0 overflow-hidden' : ''}
            >
              {isMobile ? (
                <MobileVisualizer
                  selectedPainting={visualizerPainting}
                  selectedFrame={visualizerFrame}
                  onBack={() => handleTabChange('gallery')}
                  onAddToCart={handleAddToCart}
                />
              ) : (
                <VisualizerView
                  selectedPainting={visualizerPainting}
                  selectedFrame={visualizerFrame}
                  setSelectedFrame={setVisualizerFrame}
                  onAddToCart={handleAddToCart}
                />
              )}
            </PageTransition>
          )}

          {activeTab === 'artists' && (
            <PageTransition routeKey="artists">
              <ArtistBioView />
            </PageTransition>
          )}

          {activeTab === 'stickers' && (
            <PageTransition routeKey="stickers" scrollScope={stickersScope}>
              <StickersView onAddToCart={handleAddToCart} />
            </PageTransition>
          )}

          {activeTab === 'packs' && (
            <PageTransition routeKey="packs">
              <PacksView onAddToCart={handleAddToCart} />
            </PageTransition>
          )}

          {activeTab === 'threed' && (
            <PageTransition routeKey="threed">
              <ThreeDPaintingView 
                onExploreGallery={() => handleTabChange('gallery')}
                onTryVisualizer={() => handleTabChange('visualizer')}
              />
            </PageTransition>
          )}

          {activeTab === 'upload' && (
            <PageTransition routeKey="upload">
              <UploadView 
                onAddToCart={handleAddToCart}
                onSimulateInRoom={handleSimulateInRoom}
                onExploreGallery={() => handleTabChange('gallery')}
              />
            </PageTransition>
          )}
        </AnimatePresence>
        </Suspense>
      </main>

      {/* 3. Luxury Editorial Footer */}
      {!isMobileVisualizer && (activeTab !== 'home' || showHomeContent) && (
        <footer className="bg-forest-deep border-t border-forest-sage/20 pt-16 pb-12 px-6 lg:px-12 mt-12 text-forest-cream">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Logo Brand / Manifesto Column */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-4 pt-2 text-forest-sage hover:text-forest-cream transition-colors">
              <Instagram className="w-4 h-4 cursor-pointer" />
              <span className="text-[10px] font-mono tracking-wider uppercase select-none cursor-pointer">@nn.cyberspace</span>
            </div>
          </div>

          {/* Dynamic Navigation Columns */}
          <div className="space-y-4">
            <h4 className="font-sans text-[10px] uppercase font-bold tracking-widest text-forest-gold">
              Explore Atelier
            </h4>
            <ul className="space-y-2 text-xs text-forest-cream/70">
              <li>
                <button onClick={() => handleTabChange('gallery')} className="hover:text-forest-gold transition-colors cursor-pointer">
                  The Canvas Salon
                </button>
              </li>
              <li>
                <button onClick={() => handleTabChange('threed')} className="hover:text-forest-gold transition-colors cursor-pointer flex items-center gap-1">
                  <span>3D Painting Atelier</span>
                  <span className="text-[9px] font-mono text-forest-gold bg-forest-gold/10 border border-forest-gold/30 px-1.5 py-0.2 rounded">NEW</span>
                </button>
              </li>
              <li>
                <button onClick={() => handleTabChange('visualizer')} className="hover:text-forest-gold transition-colors cursor-pointer">
                  Wall Simulation
                </button>
              </li>
              <li>
                <button onClick={() => handleTabChange('artists')} className="hover:text-forest-gold transition-colors cursor-pointer">
                  Artist Provenance
                </button>
              </li>
              <li>
                <button onClick={() => handleTabChange('stickers')} className="hover:text-forest-gold transition-colors cursor-pointer">
                  Stickers Atelier
                </button>
              </li>
              <li>
                <button onClick={() => handleTabChange('packs')} className="hover:text-forest-gold transition-colors cursor-pointer">
                  Collector Packs
                </button>
              </li>
            </ul>
          </div>

          {/* Contact / Curation Newsletter */}
          <div className="space-y-4">
            <h4 className="font-sans text-[10px] uppercase font-bold tracking-widest text-forest-gold">
              Vernissage Invites
            </h4>
            <p className="text-xs text-forest-cream/70 leading-relaxed">
              Subscribe to receive private viewing logs and early-bird access to annual batches of original oils.
            </p>
            <div className="flex border-b border-forest-sage pb-1.5">
              <input 
                type="email" 
                placeholder="collector@email.com" 
                className="bg-transparent text-xs outline-none flex-1 pr-2 placeholder:text-forest-cream/40 text-forest-cream"
              />
              <button className="text-[10px] font-sans font-bold tracking-widest uppercase hover:text-forest-gold transition-colors cursor-pointer">
                Join
              </button>
            </div>
          </div>
        </div>
      </footer>
      )}

      {/* 4. Global Product Detailed Overlay Modal */}
      {selectedPainting && (
        <Suspense fallback={null}>
          {isMobile ? (
            detailModalOpen && (
              <MobileProductDetail
                painting={selectedPainting}
                onClose={() => setDetailModalOpen(false)}
                selectedFrame={detailFrame}
                onAddToCart={handleAddToCart}
                onSimulateInRoom={handleSimulateInRoom}
              />
            )
          ) : (
            <ProductDetailModal
              painting={selectedPainting}
              isOpen={detailModalOpen}
              onClose={() => setDetailModalOpen(false)}
              selectedFrame={detailFrame}
              setSelectedFrame={setDetailFrame}
              onAddToCart={handleAddToCart}
              onSimulateInRoom={handleSimulateInRoom}
            />
          )}
        </Suspense>
      )}

      {/* 5. Global Cart Sidebar Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onOpenStatusModal={setStatusModalOrder}
      />

      {/* 6. Global Interactive Cyberspace Map Modal */}
      {isMapOpen && (
        <Suspense fallback={null}>
          <WebsiteMapModal
            isOpen={isMapOpen}
            onClose={() => setIsMapOpen(false)}
            activeTab={activeTab}
            setActiveTab={(tab) => {
              setActiveTab(tab);
              if (tab !== 'gallery') {
                setInitialStyleFilter(null);
              }
            }}
            onSelectCategory={(category) => {
              setInitialStyleFilter(category);
              setActiveTab('gallery');
            }}
            cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
            toggleCart={() => setIsCartOpen(!isCartOpen)}
          />
        </Suspense>
      )}

      {/* 7. Global Order Status Timeline Modal */}
      {statusModalOrder && (
        <Suspense fallback={null}>
          <OrderStatusModal
            orderId={statusModalOrder.id}
            folderUrl={statusModalOrder.folderUrl}
            whatsappUrl={statusModalOrder.whatsappUrl}
            customerName={statusModalOrder.customerName}
            onClose={() => setStatusModalOrder(null)}
          />
        </Suspense>
      )}
    </div>
    </>
  );
}
