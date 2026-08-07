import React, { useState } from 'react';
import { X, ShoppingBag, ShieldCheck, HelpCircle, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { CartItem, Painting } from '../types';
import { formatMAD, formatAddOn } from '../lib/pricing';
import { PackComposition } from '../lib/packComposition';
import { personalizationPrice, personalizationSummary } from '../lib/personalization';
import PersonalizationPreviewLayer from './personalization/PersonalizationPreviewLayer';
import { submitOrder, SubmitOrderResult, PrepareOrderProgress } from '../lib/orderSubmission';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useSwipeDismiss } from '../hooks/useSwipeDismiss';
import { useViewportSize } from '../hooks/useViewportSize';
import CubeLoader from './CubeLoader';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onRemoveItem: (paintingId: string) => void;
  onClearCart: () => void;
  onOpenStatusModal?: (info: { id: string; folderUrl: string | null; whatsappUrl: string | null; customerName?: string }) => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onRemoveItem,
  onClearCart,
  onOpenStatusModal,
}: CartDrawerProps) {
  const [clientRequestId, setClientRequestId] = useState(() => crypto.randomUUID());
  const [progress, setProgress] = useState<PrepareOrderProgress | null>(null);
  const [whiteGloveService, setWhiteGloveService] = useState<boolean>(false);
  const [checkoutStep, setCheckoutStep] = useState<'idle' | 'details' | 'submitting' | 'completed'>('idle');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerWhatsApp, setCustomerWhatsApp] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<SubmitOrderResult | null>(null);

  /*
   * RULES OF HOOKS — every hook must run on EVERY render.
   * React indexes hook state by call order, not by name, so the early
   * `if (!isOpen) return null` below must come AFTER the last hook. When these
   * four sat below it, a closed drawer recorded 8 hooks and an open one 12,
   * which is the "Rendered more hooks than during the previous render" crash.
   *
   * Calling them unconditionally is safe by design: useBodyScrollLock takes an
   * `active` flag and is reference-counted, and useSwipeDismiss takes `enabled`.
   * Neither does anything while the drawer is closed.
   */
  const { isMobile } = useBreakpoint();
  useBodyScrollLock(isOpen);
  const { offset, handlers } = useSwipeDismiss({
    enabled: isMobile && isOpen,
    onDismiss: onClose,
  });
  const { keyboardOpen } = useViewportSize();

  if (!isOpen) return null;

  const itemSubtotal = cartItems.reduce((acc, item) => {
    return (
      acc +
      (item.painting.price + item.frame.price + personalizationPrice(item.personalization)) *
        item.quantity
    );
  }, 0);

  const whiteGloveCost = whiteGloveService ? 350 : 0;
  const grandTotal = itemSubtotal + whiteGloveCost;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCheckoutStep('submitting');
    setProgress(null);

    try {
      const result = await submitOrder({
        clientRequestId,
        customer: { name: customerName, whatsapp: customerWhatsApp },
        cartItems,
        whiteGloveService,
        grandTotal,
      }, setProgress);
      setOrderResult(result);
      setCheckoutStep('completed');
    } catch (err: any) {
      setError(err.message || 'Failed to submit order. Please try again.');
      setCheckoutStep('details');
    }
  };

  const handleResetCheckout = () => {
    setClientRequestId(crypto.randomUUID());
    setCheckoutStep('idle');
    setCustomerName('');
    setCustomerWhatsApp('');
    setOrderResult(null);
    setError(null);
    onClearCart();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Dark backdrop */}
      <div 
        onClick={checkoutStep === 'idle' ? onClose : undefined}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in" 
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div 
          className={isMobile ? 'pz-sheet w-full bg-forest-deep flex flex-col shadow-2xl relative' : 'w-screen max-w-md bg-forest-deep border-l border-forest-sage/30 flex flex-col justify-between shadow-2xl relative'}
          style={isMobile ? { transform: `translateY(${offset}px)` } : undefined}
        >
          {isMobile && <div className="pz-sheet__grip" {...handlers} aria-hidden="true" />}
          
          {/* Drawer Header */}
          <div className="px-6 py-5 border-b border-forest-sage/20 flex items-center justify-between bg-forest-deep">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-forest-gold" />
              <h2 className="font-serif text-lg tracking-tight text-forest-cream font-bold">
                Your Shopping Bag
              </h2>
            </div>
            {(checkoutStep === 'idle' || checkoutStep === 'details') && (
              <button 
                onClick={onClose}
                className="p-1.5 hover:bg-forest-sage/20 rounded-full transition-colors cursor-pointer"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5 text-forest-cream" />
              </button>
            )}
          </div>

          {/* Checkout Steps Overlay */}
          {checkoutStep !== 'idle' ? (
            <div className={isMobile ? 'pz-sheet__body flex-1 p-6 flex flex-col bg-forest-deep' : 'flex-1 p-8 flex flex-col items-center justify-center bg-forest-deep overflow-y-auto'}>
              {checkoutStep === 'details' && (
                <div className="w-full space-y-5 text-left animate-fade-in py-2">
                  <div className="space-y-1">
                    <h3 className="font-serif text-lg text-forest-cream font-bold">Secure Checkout</h3>
                    <p className="text-[11px] text-forest-cream/70 leading-relaxed">
                      We will compile your order and high-resolution files. Once submitted, we will coordinate via WhatsApp for payment and delivery.
                    </p>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-950/40 border border-red-500/50 rounded flex items-center gap-3 text-red-200 text-[11px]">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <p>{error}</p>
                    </div>
                  )}

                  <form 
                    onSubmit={handleCheckout}
                    className="space-y-4 text-xs"
                  >
                    {/* Name */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider font-bold text-forest-gold block">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Noureddin El Mobaraki"
                        className="w-full bg-forest-black border border-forest-sage/20 rounded-sm py-2.5 px-3.5 text-forest-cream placeholder-forest-cream/30 focus:border-forest-gold focus:outline-none transition-colors"
                      />
                    </div>

                    {/* WhatsApp */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider font-bold text-forest-gold block">
                        WhatsApp Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={customerWhatsApp}
                        onChange={(e) => setCustomerWhatsApp(e.target.value)}
                        placeholder="+212 652 297244"
                        className="w-full bg-forest-black border border-forest-sage/20 rounded-sm py-2.5 px-3.5 text-forest-cream placeholder-forest-cream/30 focus:border-forest-gold focus:outline-none transition-colors"
                      />
                    </div>

                    <div className={isMobile ? `pz-sheet__footer pt-2 space-y-3 bg-forest-deep ${keyboardOpen ? 'relative' : 'sticky'}` : 'pt-2 space-y-3'}>
                      <button
                        type="submit"
                        className="w-full bg-forest-gold hover:opacity-90 text-forest-black text-[11px] tracking-[0.2em] uppercase font-bold py-3.5 transition-all shadow-md text-center cursor-pointer flex items-center justify-center gap-2 rounded-sm"
                      >
                        Submit Order
                      </button>

                      <button
                        type="button"
                        onClick={() => setCheckoutStep('idle')}
                        className="w-full border border-forest-sage/20 text-forest-cream hover:bg-forest-sage/10 text-[10px] tracking-[0.1em] uppercase font-medium py-2 rounded-sm transition-all"
                      >
                        Back to Bag
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {checkoutStep === 'submitting' && (
                <div className="space-y-6 text-center py-6">
                  <CubeLoader label={progress?.message || 'Preparing your order'} />
                  <div className="space-y-2">
                    <h3 className="font-serif text-xl text-forest-cream font-bold">
                      {progress?.message || 'Preparing Order...'}
                    </h3>
                    {progress && (
                      <p className="text-[10px] font-mono tracking-widest text-forest-gold uppercase">
                        Item {progress.itemIndex} of {progress.itemCount} — Phase: {progress.phase}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-forest-cream/60 max-w-xs mx-auto font-sans leading-relaxed">
                    Please keep this window open while we secure your assets and notify the curator.
                  </p>
                </div>
              )}

              {checkoutStep === 'completed' && orderResult && (
                <div className="space-y-6 animate-fade-in text-center py-6">
                  <div className="w-16 h-16 bg-forest-sage/20 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10 text-forest-gold" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-serif text-2xl text-forest-cream font-bold">Order Successful</h3>
                    <span className="text-[10px] font-mono tracking-widest text-forest-gold block uppercase">
                      ORDER ID: {orderResult.orderId}
                    </span>
                  </div>
                  <p className="text-xs text-forest-cream/80 max-w-xs mx-auto font-sans leading-relaxed">
                    Thank you, <strong className="text-forest-cream">{customerName}</strong>. Your order has been registered in our archival system.
                  </p>
                  <p className="text-xs text-forest-cream/60 max-w-xs mx-auto font-sans leading-relaxed">
                    Final confirmation and payment details will be handled directly via WhatsApp with our lead curator.
                  </p>
                  
                  <div className="pt-4 space-y-3">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenStatusModal?.({
                          id: orderResult.orderId,
                          folderUrl: orderResult.folderUrl,
                          whatsappUrl: orderResult.whatsappUrl,
                          customerName,
                        });
                      }}
                      className="w-full bg-[var(--pz-accent)] hover:bg-[var(--pz-accent-hover)] text-white text-[11px] tracking-[0.2em] uppercase font-bold py-3.5 transition-all shadow-md text-center cursor-pointer flex items-center justify-center gap-2 rounded-sm"
                    >
                      <span>Track Order Timeline</span>
                    </button>

                    <a
                      href={orderResult.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white text-[11px] tracking-[0.2em] uppercase font-bold py-3.5 transition-all shadow-md text-center cursor-pointer flex items-center justify-center gap-2 rounded-sm"
                    >
                      <span>Continue to WhatsApp</span>
                    </a>
                    
                    <button
                      onClick={handleResetCheckout}
                      className="w-full border border-forest-sage/20 hover:bg-forest-sage/10 text-forest-cream text-[11px] tracking-[0.2em] uppercase font-bold py-3 transition-all cursor-pointer rounded-sm"
                    >
                      Finish
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Cart Item List */}
              <div className={isMobile ? 'pz-sheet__body px-6 pt-2 pb-6 space-y-6' : 'flex-1 overflow-y-auto p-6 space-y-6'}>
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-12 h-12 rounded-full border border-forest-sage/20 flex items-center justify-center text-forest-sage">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg text-forest-cream font-medium">Your bag is empty</h3>
                      <p className="text-xs text-forest-cream/50 font-sans mt-1">
                        Explore our original collections to acquire master works.
                      </p>
                    </div>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div 
                      key={item.painting.id}
                      className="flex gap-4 border border-forest-sage/20 p-3.5 bg-forest-deep shadow-sm"
                    >
                      {/* Image Thumbnail */}
                      <div className="relative w-20 h-20 bg-forest-black border border-forest-sage/20 p-2 flex-shrink-0 flex items-center justify-center overflow-hidden" style={{ containerType: 'inline-size' }}>
                        <img 
                          src={item.painting.imageUrl} 
                          alt={item.painting.title} 
                          className="max-h-full max-w-full shadow-sm"
                          referrerPolicy="no-referrer"
                        />
                        {item.personalization && (
                          <PersonalizationPreviewLayer personalization={item.personalization} />
                        )}
                      </div>

                      {/* Detail Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div className="space-y-0.5">
                          <h4 className="font-serif text-sm text-forest-cream truncate font-bold">
                            {item.painting.title}
                          </h4>
                          <p className="text-[10px] text-forest-cream/50 font-serif italic">
                            by {item.painting.artistName}
                          </p>
                          <p className="text-[9px] font-mono uppercase text-forest-gold font-medium">
                            Size: {item.painting.widthCm}x{item.painting.heightCm} cm
                            {item.painting.printSpec
                              ? ` · ${item.painting.printSpec.sizeLabel} · ${
                                  item.painting.printSpec.fitMode === 'cover'
                                    ? 'filled'
                                    : 'whole artwork'
                                }`
                              : ''}
                          </p>
                          <p className="text-[9px] text-forest-cream/80 truncate">
                            Frame: <strong>{item.frame.name}</strong>
                          </p>
                          {item.personalization && personalizationPrice(item.personalization) > 0 && (
                            <p className="text-[11px] text-ui-accent mt-0.5">
                              Personalized: {personalizationSummary(item.personalization)} ({formatAddOn(personalizationPrice(item.personalization))})
                            </p>
                          )}
                        </div>

                        <div className="flex justify-between items-end pt-1">
                          <span className="font-mono text-xs font-bold text-forest-gold">
                            {formatMAD(item.painting.price + item.frame.price + personalizationPrice(item.personalization))}
                          </span>
                          <button
                            onClick={() => onRemoveItem(item.painting.id)}
                            className="text-forest-sage hover:text-red-400 p-1 rounded-sm transition-colors cursor-pointer"
                            title="Remove painting"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Drawer Footer (Pricing & Checkout) */}
              {cartItems.length > 0 && (
                <div className={isMobile ? 'pz-sheet__footer space-y-4' : 'border-t border-forest-sage/20 bg-forest-deep p-6 space-y-4'}>
                  
                  {/* Luxury Service Option */}
                  <label className="flex items-start gap-3 p-3 bg-forest-black border border-forest-sage/20 cursor-pointer hover:border-forest-gold transition-colors select-none">
                    <input
                      type="checkbox"
                      checked={whiteGloveService}
                      onChange={(e) => setWhiteGloveService(e.target.checked)}
                      className="rounded border-forest-sage/30 text-forest-gold focus:ring-forest-gold w-4 h-4 mt-0.5 cursor-pointer bg-forest-black"
                    />
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-forest-cream">
                          White-Glove Home Installation
                        </span>
                        <span className="text-[10px] font-mono font-bold text-forest-gold">{formatAddOn(350)}</span>
                      </div>
                      <p className="text-[9px] text-forest-cream/80 leading-relaxed mt-1">
                        Professional logistics agents will deliver inside your room, assess lighting, and wall-mount the heavy canvas using seismic-grade architectural hangers.
                      </p>
                    </div>
                  </label>

                  {/* Summary Pricing */}
                  <div className="space-y-1.5 text-xs text-forest-cream/80">
                    <div className="flex justify-between font-sans">
                      <span>Paintings & custom frames:</span>
                      <span className="font-mono font-medium text-forest-cream">{formatMAD(itemSubtotal)}</span>
                    </div>
                    {whiteGloveService && (
                      <div className="flex justify-between font-sans">
                        <span>White-glove premium installation:</span>
                        <span className="font-mono font-medium text-forest-cream">{formatMAD(350)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-sans text-forest-cream/60">
                      <span>Secure crate-freight delivery:</span>
                      <span className="font-mono text-[9px] uppercase font-bold tracking-widest text-forest-gold">Complimentary</span>
                    </div>
                    <div className="h-[1px] bg-forest-sage/20 my-2" />
                    <div className="flex justify-between text-base font-serif text-forest-cream font-bold">
                      <span>Grand Total Investment:</span>
                      <span className="font-mono text-lg text-forest-gold">{formatMAD(grandTotal)}</span>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <button
                    onClick={() => setCheckoutStep('details')}
                    className="w-full bg-forest-gold hover:opacity-90 text-forest-black text-[11px] tracking-[0.2em] uppercase font-bold py-4 transition-all shadow-md text-center cursor-pointer"
                  >
                    Checkout via WhatsApp
                  </button>

                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-forest-cream/50 font-sans">
                    <ShieldCheck className="w-3.5 h-3.5 text-forest-gold" />
                    <span>Certified Secure 256-bit Luxury Escrow Gateway</span>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
