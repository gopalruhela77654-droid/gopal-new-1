/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, Component, ErrorInfo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  AlertTriangle
} from 'lucide-react';

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

// --- Error Boundary ---

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-brand-cream p-6">
          <div className="max-w-md w-full text-center space-y-4">
            <AlertTriangle className="mx-auto text-red-500" size={48} />
            <h1 className="text-2xl font-serif">Something went wrong</h1>
            <p className="text-sm opacity-60">We encountered an error while rendering the application. Please try refreshing the page.</p>
            <pre className="text-left bg-black/5 p-4 rounded-lg text-xs overflow-auto max-h-40">
              {this.state.error?.message}
            </pre>
            <button 
              onClick={() => window.location.reload()}
              className="btn-primary w-full"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Main Application ---

function AuraApp() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customType, setCustomType] = useState<'tshirt' | 'mug'>('tshirt');
  const [customImage, setCustomImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setIsCartOpen(true);
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
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-brand-cream/80 backdrop-blur-md border-b border-black/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <a href="#" className="text-2xl font-serif font-bold tracking-tighter">AURA</a>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium uppercase tracking-widest opacity-70">
            <a href="#shop" className="hover:opacity-100 transition-opacity">Shop</a>
            <a href="#customize" className="hover:opacity-100 transition-opacity">Customize</a>
          </div>
        </div>
        
        <button 
          onClick={() => setIsCartOpen(true)}
          className="relative p-2 hover:bg-black/5 rounded-full transition-colors"
        >
          <ShoppingBag size={24} strokeWidth={1.5} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-brand-ink text-brand-cream text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
              {cartCount}
            </span>
          )}
        </button>
      </nav>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative h-[80vh] flex items-center justify-center overflow-hidden px-6">
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
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
            </motion.div>
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
            {PRODUCTS.map((product, idx) => (
              <motion.div 
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
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
                    className="absolute bottom-4 right-4 bg-white p-3 rounded-full shadow-lg translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hover:bg-brand-ink hover:text-white"
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
              </motion.div>
            ))}
          </div>
        </section>

        {/* Customizer Section */}
        <section id="customize" className="py-24 bg-brand-ink text-brand-cream px-6">
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
                      customType === 'tshirt' ? 'bg-white text-brand-ink border-white' : 'border-white/20 hover:border-white/40'
                    }`}
                  >
                    <Shirt size={32} strokeWidth={1.5} />
                    <span className="font-medium">Premium Tee</span>
                  </button>
                  <button 
                    onClick={() => setCustomType('mug')}
                    className={`flex-1 p-6 rounded-2xl border transition-all flex flex-col items-center gap-3 ${
                      customType === 'mug' ? 'bg-white text-brand-ink border-white' : 'border-white/20 hover:border-white/40'
                    }`}
                  >
                    <Coffee size={32} strokeWidth={1.5} />
                    <span className="font-medium">Ceramic Mug</span>
                  </button>
                </div>

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/20 rounded-3xl p-12 text-center cursor-pointer hover:border-white/40 transition-colors group"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    className="hidden" 
                    accept="image/*"
                  />
                  <div className="bg-white/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Upload size={24} />
                  </div>
                  <h4 className="text-xl font-medium mb-2">Upload Your Artwork</h4>
                  <p className="text-sm opacity-50">PNG, JPG or SVG. Max 10MB.</p>
                </div>

                {customImage && (
                  <motion.button 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={handleAddCustomToCart}
                    className="w-full bg-white text-brand-ink py-4 rounded-full font-bold text-lg hover:bg-white/90 transition-colors"
                  >
                    Add to Cart
                  </motion.button>
                )}
              </div>
            </div>

            <div className="order-1 lg:order-2 flex justify-center">
              <div className="relative w-full max-w-md aspect-square bg-white/5 rounded-[40px] flex items-center justify-center overflow-hidden">
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
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`absolute inset-0 flex items-center justify-center p-24 ${customType === 'mug' ? 'translate-y-4' : '-translate-y-8'}`}
                    >
                      <img 
                        src={customImage} 
                        alt="Custom Design" 
                        className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                      />
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-brand-cream pt-24 pb-12 px-6 border-t border-black/5">
        <div className="max-w-7xl mx-auto text-center">
          <a href="#" className="text-3xl font-serif font-bold tracking-tighter mb-6 block">AURA</a>
          <p className="text-sm opacity-40 uppercase tracking-[0.2em]">© 2026 AURA PRINT STUDIO. ALL RIGHTS RESERVED.</p>
        </div>
      </footer>

      {/* Cart Sidebar */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-brand-cream z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-black/5 flex items-center justify-between">
                <h2 className="text-2xl font-serif">Your Bag ({cartCount})</h2>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 hover:bg-black/5 rounded-full transition-colors"
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
                      <div className="w-24 h-32 bg-black/5 rounded-xl overflow-hidden flex-shrink-0 relative">
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
                          <div className="flex items-center gap-3 bg-black/5 rounded-full px-3 py-1">
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
                <div className="p-6 border-t border-black/5">
                  <div className="flex justify-between items-end mb-4">
                    <span className="text-sm opacity-50 uppercase tracking-widest font-bold">Subtotal</span>
                    <span className="text-2xl font-serif">${cartTotal}</span>
                  </div>
                  <button className="w-full bg-brand-ink text-brand-cream py-4 rounded-full font-bold text-lg hover:bg-brand-ink/90 transition-colors">
                    Checkout
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuraApp />
    </ErrorBoundary>
  );
}
