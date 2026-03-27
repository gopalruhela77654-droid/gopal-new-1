/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { 
  ShoppingBag, 
  Upload, 
  Shirt, 
  Coffee, 
  X, 
  Plus, 
  Minus, 
  ChevronRight,
  Instagram,
  Twitter,
  Facebook,
  ArrowRight,
  CheckCircle2,
  Moon,
  Sun
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import OrderForm from './components/OrderForm';

// --- Error Boundary ---

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-brand-cream p-4">
          <div className="bg-surface p-8 rounded-2xl shadow-xl max-w-md w-full border border-border">
            <h1 className="text-2xl font-bold text-red-600 mb-4 font-serif">Something went wrong</h1>
            <p className="text-brand-ink/70 mb-4">The application encountered an unexpected error.</p>
            <pre className="bg-red-500/10 p-4 rounded-lg text-xs text-red-600 overflow-auto max-h-40 mb-6 font-mono">
              {this.state.error?.message}
            </pre>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-brand-ink text-brand-cream py-3 rounded-xl font-bold hover:opacity-90 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Types & Constants ---

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: 'tshirt' | 'mug';
  description: string;
}

interface CartItem extends Product {
  quantity: number;
  customDesign?: string;
  isCustom?: boolean;
}

const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Minimalist Line Art Tee',
    price: 28,
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800',
    category: 'tshirt',
    description: '100% organic cotton with a subtle hand-drawn design.'
  },
  {
    id: '2',
    name: 'Morning Mist Mug',
    price: 18,
    image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=800',
    category: 'mug',
    description: 'Ceramic mug with a matte finish and ergonomic handle.'
  },
  {
    id: '3',
    name: 'Abstract Geometry Tee',
    price: 32,
    image: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&q=80&w=800',
    category: 'tshirt',
    description: 'Bold geometric shapes printed on premium heavy cotton.'
  },
  {
    id: '4',
    name: 'Terra Cotta Mug',
    price: 22,
    image: 'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&q=80&w=800',
    category: 'mug',
    description: 'Hand-glazed ceramic mug in earthy tones.'
  },
  {
    id: '5',
    name: 'Vintage Botanical Tee',
    price: 30,
    image: 'https://images.unsplash.com/photo-1576566582149-1346997a0501?auto=format&fit=crop&q=80&w=800',
    category: 'tshirt',
    description: 'Soft-wash tee featuring a vintage botanical illustration.'
  },
  {
    id: '6',
    name: 'Midnight Speckle Mug',
    price: 20,
    image: 'https://images.unsplash.com/photo-1517142089942-ba376ce32a2e?auto=format&fit=crop&q=80&w=800',
    category: 'mug',
    description: 'Dark ceramic with white speckle detail.'
  }
];

// --- Main Application ---

export default function App() {
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = React.useState(false);
  const [isOrderFormOpen, setIsOrderFormOpen] = React.useState(false);
  const [customType, setCustomType] = React.useState<'tshirt' | 'mug'>('tshirt');
  const [customImage, setCustomImage] = React.useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [showToast, setShowToast] = React.useState(false);
  const [isBagAnimating, setIsBagAnimating] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    console.log("Aura Print App Mounted");
    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const addToCart = (product: Product, customDesign?: string) => {
    setCart(prev => {
      const existing = prev.find(item => 
        item.id === product.id && item.customDesign === customDesign
      );
      if (existing) {
        return prev.map(item => 
          (item.id === product.id && item.customDesign === customDesign)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1, customDesign, isCustom: !!customDesign }];
    });
    
    // Trigger animations and toast
    setShowToast(true);
    setIsBagAnimating(true);
    setTimeout(() => setShowToast(false), 3000);
    setTimeout(() => setIsBagAnimating(false), 500);
  };

  const removeFromCart = (id: string, customDesign?: string) => {
    setCart(prev => prev.filter(item => !(item.id === id && item.customDesign === customDesign)));
  };

  const updateQuantity = (id: string, delta: number, customDesign?: string) => {
    setCart(prev => prev.map(item => {
      if (item.id === id && item.customDesign === customDesign) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCustomToCart = () => {
    if (!customImage) return;
    
    const customProduct: Product = {
      id: `custom-${Date.now()}`,
      name: `Custom ${customType === 'tshirt' ? 'T-Shirt' : 'Mug'}`,
      price: customType === 'tshirt' ? 35 : 25,
      image: customType === 'tshirt' 
        ? 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800'
        : 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=800',
      category: customType,
      description: 'Personalized design printed with high-quality ink.'
    };
    
    addToCart(customProduct, customImage);
    setCustomImage(null);
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-brand-cream text-brand-ink">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-brand-cream/80 backdrop-blur-md border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <a href="#" className="text-2xl font-serif font-bold tracking-tighter">AURA</a>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium uppercase tracking-widest opacity-70">
            <a href="#shop" className="hover:opacity-100 transition-opacity">Shop</a>
            <a href="#customize" className="hover:opacity-100 transition-opacity">Customize</a>
            <button 
              onClick={() => setIsOrderFormOpen(true)}
              className="hover:opacity-100 transition-opacity uppercase tracking-widest"
            >
              Order
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="relative w-16 h-8 rounded-full p-1 transition-all duration-500 flex items-center cursor-pointer bg-brand-ink/10 border border-border overflow-hidden"
            aria-label="Toggle Dark Mode"
          >
            {/* Background Icons */}
            <div className="absolute inset-0 flex items-center justify-between px-2.5 opacity-20">
              <Sun size={12} strokeWidth={2.5} />
              <Moon size={12} strokeWidth={2.5} />
            </div>

            <motion.div
              className="w-6 h-6 bg-brand-ink rounded-full flex items-center justify-center shadow-lg z-10"
              animate={{ x: isDarkMode ? 32 : 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <motion.div
                key={isDarkMode ? 'moon' : 'sun'}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {isDarkMode ? (
                  <Moon size={14} strokeWidth={2.5} className="text-brand-cream" />
                ) : (
                  <Sun size={14} strokeWidth={2.5} className="text-brand-cream" />
                )}
              </motion.div>
            </motion.div>
          </button>
          
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 hover:bg-brand-ink/5 rounded-full transition-colors"
          >
            <motion.div
              animate={isBagAnimating ? {
                scale: [1, 1.2, 1],
                rotate: [0, -10, 10, -10, 0],
              } : {}}
              transition={{ duration: 0.4 }}
            >
              <ShoppingBag size={24} strokeWidth={1.5} />
            </motion.div>
            {cartCount > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 bg-brand-ink text-brand-cream text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full"
              >
                {cartCount}
              </motion.span>
            )}
          </button>
        </div>
      </nav>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative h-[70vh] flex items-center justify-center overflow-hidden px-6">
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=2000" 
              alt="Hero Background" 
              className="w-full h-full object-cover opacity-20"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-brand-cream/0 via-brand-cream/50 to-brand-cream" />
          </div>
          
          <div className="relative z-10 text-center max-w-3xl">
            <div>
              <span className="text-xs font-bold tracking-[0.3em] uppercase opacity-50 mb-4 block">Wear Your Story</span>
              <h1 className="text-6xl md:text-8xl font-serif mb-8 leading-[0.9]">
                Artistry in <br />
                <span className="italic">Every Thread.</span>
              </h1>
              <p className="text-lg opacity-70 mb-10 max-w-xl mx-auto leading-relaxed">
                Premium custom apparel and ceramics designed for the modern minimalist. 
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href="#customize" className="btn-primary flex items-center gap-2">
                  Start Customizing <ArrowRight size={18} />
                </a>
                <a href="#shop" className="btn-outline">Browse Collection</a>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section id="shop" className="py-24 px-6 max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="text-xs font-bold tracking-[0.2em] uppercase opacity-50 mb-2 block">The Collection</span>
              <h2 className="text-4xl font-serif">Curated Essentials</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {PRODUCTS.map((product) => (
              <div 
                key={product.id}
                className="aesthetic-card group"
              >
                <div className="aspect-[4/5] overflow-hidden relative">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <button 
                    onClick={() => addToCart(product)}
                    className="absolute bottom-4 right-4 bg-surface p-3 rounded-full shadow-lg opacity-100 transition-all duration-300 hover:bg-brand-ink hover:text-brand-cream"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-medium">{product.name}</h3>
                    <span className="font-medium">${product.price}</span>
                  </div>
                  <p className="text-sm opacity-60 line-clamp-2">{product.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Customizer Section */}
        <section id="customize" className="py-24 bg-brand-ink text-brand-cream px-6 transition-colors duration-300">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <span className="text-xs font-bold tracking-[0.2em] uppercase opacity-50 mb-4 block">Studio</span>
              <h2 className="text-5xl md:text-6xl font-serif mb-8 leading-tight">
                Your Design, <br />
                <span className="italic">Our Craft.</span>
              </h2>
              
              <div className="space-y-8">
                <div className="flex gap-4">
                  <button 
                    onClick={() => setCustomType('tshirt')}
                    className={`flex-1 p-6 rounded-2xl border transition-all flex flex-col items-center gap-3 ${
                      customType === 'tshirt' ? 'bg-brand-cream text-brand-ink border-brand-cream' : 'border-brand-cream/20 hover:border-brand-cream/40'
                    }`}
                  >
                    <Shirt size={32} strokeWidth={1.5} />
                    <span className="font-medium">Premium Tee</span>
                  </button>
                  <button 
                    onClick={() => setCustomType('mug')}
                    className={`flex-1 p-6 rounded-2xl border transition-all flex flex-col items-center gap-3 ${
                      customType === 'mug' ? 'bg-brand-cream text-brand-ink border-brand-cream' : 'border-brand-cream/20 hover:border-brand-cream/40'
                    }`}
                  >
                    <Coffee size={32} strokeWidth={1.5} />
                    <span className="font-medium">Ceramic Mug</span>
                  </button>
                </div>
 
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-brand-cream/20 rounded-3xl p-12 text-center cursor-pointer hover:border-brand-cream/40 transition-colors group"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    className="hidden" 
                    accept="image/*"
                  />
                  <div className="bg-brand-cream/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Upload size={24} />
                  </div>
                  <h4 className="text-xl font-medium mb-2">Upload Your Artwork</h4>
                  <p className="text-sm opacity-50">PNG, JPG or SVG. Max 10MB.</p>
                </div>
 
                {customImage && (
                  <button 
                    onClick={handleAddCustomToCart}
                    className="w-full bg-brand-cream text-brand-ink py-4 rounded-full font-bold text-lg hover:opacity-90 transition-colors"
                  >
                    Add to Cart
                  </button>
                )}
              </div>
            </div>
 
            <div className="order-1 lg:order-2 flex justify-center">
              <div className="relative w-full max-w-md aspect-square bg-brand-cream/5 rounded-[40px] flex items-center justify-center overflow-hidden">
                <div className="relative w-full h-full p-12">
                  {customType === 'tshirt' ? (
                    <img 
                      src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800" 
                      alt="T-shirt Mockup" 
                      className="w-full h-full object-contain opacity-40 mix-blend-overlay"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <img 
                      src="https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=800" 
                      alt="Mug Mockup" 
                      className="w-full h-full object-contain opacity-40 mix-blend-overlay"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  
                  {customImage && (
                    <div className={`absolute inset-0 flex items-center justify-center p-24 ${customType === 'mug' ? 'translate-y-4' : '-translate-y-8'}`}>
                      <img 
                        src={customImage} 
                        alt="Custom Design" 
                        className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-brand-cream pt-24 pb-12 px-6 border-t border-border transition-colors duration-300">
        <div className="max-w-7xl mx-auto text-center">
          <a href="#" className="text-3xl font-serif font-bold tracking-tighter mb-6 block">AURA</a>
          <p className="text-sm opacity-40 uppercase tracking-[0.2em]">© 2026 AURA PRINT STUDIO. ALL RIGHTS RESERVED.</p>
        </div>
      </footer>

      {/* Cart Sidebar */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div 
            onClick={() => setIsCartOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-md bg-brand-cream h-full shadow-2xl flex flex-col transition-colors duration-300">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-2xl font-serif">Your Bag ({cartCount})</h2>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-brand-ink/5 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
 
            <div className="flex-grow overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <ShoppingBag size={48} strokeWidth={1} className="mb-4" />
                  <p className="text-sm font-medium uppercase tracking-widest">Your bag is empty</p>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={`${item.id}-${idx}`} className="flex gap-4">
                    <div className="w-24 h-32 bg-brand-ink/5 rounded-xl overflow-hidden flex-shrink-0 relative">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {item.customDesign && (
                        <div className="absolute inset-0 flex items-center justify-center p-4">
                          <img 
                            src={item.customDesign} 
                            alt="Custom" 
                            className="max-w-full max-h-full object-contain shadow-lg"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex-grow flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium">{item.name}</h3>
                          <button 
                            onClick={() => removeFromCart(item.id, item.customDesign)}
                            className="opacity-40 hover:opacity-100 transition-opacity"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3 bg-brand-ink/5 rounded-full px-3 py-1">
                          <button onClick={() => updateQuantity(item.id, -1, item.customDesign)}><Minus size={14} /></button>
                          <span className="text-sm font-medium">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1, item.customDesign)}><Plus size={14} /></button>
                        </div>
                        <span className="font-medium">${item.price * item.quantity}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
 
            {cart.length > 0 && (
              <div className="p-6 border-t border-border">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-sm opacity-50 uppercase tracking-widest font-bold">Subtotal</span>
                  <span className="text-2xl font-serif">${cartTotal}</span>
                </div>
                <button 
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsOrderFormOpen(true);
                  }}
                  className="w-full bg-brand-ink text-brand-cream py-4 rounded-full font-bold text-lg hover:opacity-90 transition-colors"
                >
                  Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order Modal */}
      <AnimatePresence>
        {isOrderFormOpen && (
          <OrderForm onClose={() => setIsOrderFormOpen(false)} />
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-surface/80 backdrop-blur-xl border border-border px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3"
          >
            <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
            <span className="text-sm font-medium tracking-wide">Item added to bag</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Cart Button */}
      <AnimatePresence>
        {cartCount > 0 && !isCartOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCartOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-brand-ink text-brand-cream rounded-full shadow-2xl flex items-center justify-center group"
          >
            <ShoppingBag size={24} strokeWidth={1.5} />
            <span className="absolute -top-1 -right-1 bg-brand-accent text-brand-cream text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-brand-ink">
              {cartCount}
            </span>
          </motion.button>
        )}
      </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}
