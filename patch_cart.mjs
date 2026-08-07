import fs from 'fs';
let code = fs.readFileSync('src/components/CartDrawer.tsx', 'utf8');

// 1. imports
if (!code.includes('submitOrder')) {
    code = code.replace(
        "import { Trash2, X, AlertCircle } from 'lucide-react';",
        "import { Trash2, X, AlertCircle } from 'lucide-react';\nimport { submitOrder, type SubmitOrderResult } from '../lib/orderSubmission';"
    );
}

// 2. types and states
const typeStr = `type CheckoutStep = 'idle' | 'details' | 'sending' | 'completed' | 'error';`;
if (!code.includes('CheckoutStep =')) {
    code = code.replace(
        "export default function CartDrawer({ isOpen, onClose, cartItems, onRemoveItem, onUpdateQuantity, onClearCart }: CartDrawerProps) {",
        "type CheckoutStep = 'idle' | 'details' | 'sending' | 'completed' | 'error';\n\nexport default function CartDrawer({ isOpen, onClose, cartItems, onRemoveItem, onUpdateQuantity, onClearCart }: CartDrawerProps) {"
    );
}

// 3. state replacements
if (!code.includes('checkoutStep')) {
    code = code.replace(
        "const [isCheckingOut, setIsCheckingOut] = useState(false);\n  const [customerName, setCustomerName] = useState('');\n  const [customerPhone, setCustomerPhone] = useState('');\n  const [customerAddress, setCustomerAddress] = useState('');\n  const [customerCity, setCustomerCity] = useState('');\n  const [isSubmitting, setIsSubmitting] = useState(false);\n  const [orderSent, setOrderSent] = useState(false);\n  const [phoneError, setPhoneError] = useState('');",
        "const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('idle');\n  const [customerName, setCustomerName] = useState('');\n  const [customerPhone, setCustomerPhone] = useState('');\n  const [submitError, setSubmitError] = useState('');\n  const [completedOrder, setCompletedOrder] = useState<SubmitOrderResult | null>(null);\n  const [phoneError, setPhoneError] = useState('');"
    );
}

// 4. handleSubmit rewrite
const oldHandleSubmit = `  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !customerAddress || !customerCity) return;
    
    // Validate phone for exactly 10 digits
    const cleanedPhone = customerPhone.replace(/\\D/g, '');
    if (cleanedPhone.length !== 10) {
      setPhoneError('Please enter a valid 10-digit phone number');
      return;
    }
    setPhoneError('');
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setOrderSent(true);
      
      // WhatsApp Integration
      const orderDetails = cartItems.map(item => {
        let det = \`\${item.quantity}x \${item.painting.title} (\${item.painting.widthCm}x\${item.painting.heightCm}cm)\`;
        if (item.frame && item.frame.price > 0) det += \` + \${item.frame.name} Frame\`;
        if (item.personalization) {
          const modeStr = item.personalization.mode === 'draw' ? 'Signature' 
                        : item.personalization.mode === 'text' ? 'Text' 
                        : 'Signature & Text';
          det += \` + Personalization (\${modeStr})\`;
        }
        return det;
      }).join('\\n');
      
      const message = 
        \`*New Order Request*\\n\\n\` +
        \`*Customer Details:*\\n\` +
        \`Name: \${customerName}\\n\` +
        \`Phone: \${customerPhone}\\n\` +
        \`Address: \${customerAddress}\\n\` +
        \`City: \${customerCity}\\n\\n\` +
        \`*Order Items:*\\n\${orderDetails}\\n\\n\` +
        \`*White-Glove Service:* \${whiteGloveService ? 'Yes' : 'No'}\\n\` +
        \`*Total Estimate:* $\${grandTotal.toFixed(2)}\\n\\n\` +
        \`Please confirm my order and send payment details.\`;
        
      window.open(\`https://wa.me/212652297244?text=\${encodeURIComponent(message)}\`, '_blank');
      
      // Auto close after 3s
      setTimeout(() => {
        onClose();
        onClearCart();
        setOrderSent(false);
        setIsCheckingOut(false);
        setCustomerName('');
        setCustomerPhone('');
        setCustomerAddress('');
        setCustomerCity('');
      }, 3000);
    }, 1500);
  };`;

const newHandleSubmit = `  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (checkoutStep === 'sending') return;
    
    // Validate phone roughly
    const cleanedPhone = customerPhone.replace(/\\D/g, '');
    if (cleanedPhone.length < 8) {
      setPhoneError('Please enter a valid phone number');
      return;
    }
    setPhoneError('');
    
    setCheckoutStep('sending');
    setSubmitError('');
    
    try {
      const result = await submitOrder({
        customer: { name: customerName, whatsapp: customerPhone },
        cartItems,
        whiteGloveService,
        grandTotal,
      });
      setCompletedOrder(result);
      setCheckoutStep('completed');
      window.open(result.whatsappUrl, '_blank', 'noopener,noreferrer');
    } catch (cause) {
      setSubmitError(cause instanceof Error ? cause.message : 'Could not send the order.');
      setCheckoutStep('error');
    }
  };`;

code = code.replace(oldHandleSubmit, newHandleSubmit);

// 5. Drawer Reset
const oldReset = `  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setIsCheckingOut(false);
        setOrderSent(false);
        setIsSubmitting(false);
        setPhoneError('');
      }, 300);
    }
  }, [isOpen]);`;

const newReset = `  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setCheckoutStep('idle');
        setPhoneError('');
        setSubmitError('');
      }, 300);
    }
  }, [isOpen]);`;

code = code.replace(oldReset, newReset);

// 6. JSX replacements
code = code.replace(/isCheckingOut/g, "(checkoutStep === 'details' || checkoutStep === 'sending' || checkoutStep === 'error')");
code = code.replace(/orderSent/g, "(checkoutStep === 'completed')");

// Address fields removal
const addressJsx = `                  <div>
                    <label className="block text-[10px] font-sans tracking-widest uppercase font-bold text-forest-gold mb-2">Delivery Address</label>
                    <input
                      type="text"
                      required
                      value={customerAddress}
                      onChange={e => setCustomerAddress(e.target.value)}
                      className="w-full bg-forest-deep/50 border border-forest-sage/20 px-4 py-3 text-sm text-forest-cream placeholder-forest-cream/30 focus:outline-none focus:border-forest-gold font-sans transition-colors rounded-sm"
                      placeholder="Street address, building, apartment..."
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-sans tracking-widest uppercase font-bold text-forest-gold mb-2">City</label>
                    <input
                      type="text"
                      required
                      value={customerCity}
                      onChange={e => setCustomerCity(e.target.value)}
                      className="w-full bg-forest-deep/50 border border-forest-sage/20 px-4 py-3 text-sm text-forest-cream placeholder-forest-cream/30 focus:outline-none focus:border-forest-gold font-sans transition-colors rounded-sm"
                      placeholder="Your city"
                    />
                  </div>`;
code = code.replace(addressJsx, "");

// Submit button replacement
const oldSubmitButton = `                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={\`w-full py-4 text-center font-sans font-bold text-xs uppercase tracking-widest transition-all rounded-sm flex items-center justify-center gap-2 \${
                        isSubmitting 
                          ? 'bg-forest-gold/80 text-forest-black/80 cursor-not-allowed' 
                          : 'bg-[#25D366] hover:bg-[#20ba5a] text-white hover:scale-[1.01] shadow-md cursor-pointer'
                      }\`}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-forest-black/30 border-t-forest-black rounded-full animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>Send Order via WhatsApp 💬</>
                      )}
                    </button>`;

const newSubmitButton = `                    {submitError && (
                      <div role="alert" className="p-3 bg-red-900/50 border border-red-500/50 rounded text-red-200 text-xs text-center mb-4">
                        {submitError}
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={checkoutStep === 'sending'}
                      className={\`w-full py-4 text-center font-sans font-bold text-xs uppercase tracking-widest transition-all rounded-sm flex items-center justify-center gap-2 \${
                        checkoutStep === 'sending'
                          ? 'bg-forest-gold/80 text-forest-black/80 cursor-not-allowed' 
                          : 'bg-[#25D366] hover:bg-[#20ba5a] text-white hover:scale-[1.01] shadow-md cursor-pointer'
                      }\`}
                    >
                      {checkoutStep === 'sending' ? (
                        <>
                          <div className="w-4 h-4 border-2 border-forest-black/30 border-t-forest-black rounded-full animate-spin" />
                          Saving order… / جارٍ حفظ الطلب…
                        </>
                      ) : (
                        <>Send Order via WhatsApp 💬</>
                      )}
                    </button>`;
code = code.replace(oldSubmitButton, newSubmitButton);

// Success view replacement
const oldSuccess = `                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fade-in space-y-6">
                  <div className="w-20 h-20 bg-forest-gold/10 rounded-full flex items-center justify-center mb-2">
                    <svg className="w-10 h-10 text-forest-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-forest-cream mb-3">Order Received!</h3>
                    <p className="text-sm text-forest-cream/70 font-sans leading-relaxed max-w-[280px]">
                      Your WhatsApp app should open shortly with the order details. We'll be in touch soon to confirm your bespoke piece.
                    </p>
                  </div>
                  <div className="pt-8">
                    <div className="w-8 h-8 border-2 border-forest-sage/20 border-t-forest-gold rounded-full animate-spin mx-auto" />
                    <p className="text-[10px] text-forest-cream/40 font-mono mt-4 uppercase">Closing automatically...</p>
                  </div>
                </div>`;

const newSuccess = `                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fade-in space-y-6">
                  <div className="w-20 h-20 bg-forest-gold/10 rounded-full flex items-center justify-center mb-2">
                    <svg className="w-10 h-10 text-forest-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-forest-cream mb-3">Order Received!</h3>
                    <p className="text-sm text-forest-cream/70 font-sans leading-relaxed max-w-[280px]">
                      Your WhatsApp app should open shortly with the order details. We'll be in touch soon to confirm your bespoke piece.
                    </p>
                    {completedOrder && (
                      <div className="mt-4 p-3 bg-forest-deep rounded border border-forest-sage/20">
                        <p className="text-[10px] text-forest-cream/60 font-mono uppercase mb-1">Order ID</p>
                        <p className="text-sm font-mono text-forest-gold">{completedOrder.orderId}</p>
                      </div>
                    )}
                  </div>
                  <div className="pt-8 space-y-4 w-full">
                    {completedOrder && (
                      <button
                        onClick={() => window.open(completedOrder.whatsappUrl, '_blank', 'noopener,noreferrer')}
                        className="w-full py-3 bg-[#25D366] text-white font-sans font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-[#20ba5a] transition-colors"
                      >
                        Open WhatsApp
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onClearCart();
                        onClose();
                      }}
                      className="w-full py-3 bg-forest-sage/10 text-forest-cream font-sans font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-forest-sage/20 transition-colors"
                    >
                      Return to Gallery
                    </button>
                  </div>
                </div>`;
code = code.replace(oldSuccess, newSuccess);

// change checkout button click
code = code.replace(
    'onClick={() => setIsCheckingOut(true)}',
    'onClick={() => setCheckoutStep(\'details\')}'
);
code = code.replace(
    'onClick={() => setIsCheckingOut(false)}',
    'onClick={() => setCheckoutStep(\'idle\')}'
);

fs.writeFileSync('src/components/CartDrawer.tsx', code);
