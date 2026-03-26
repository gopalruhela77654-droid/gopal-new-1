/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
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
  CheckCircle2
} from 'lucide-react';
import { PRODUCTS, Product } from './constants';

interface CartItem extends Product {
  quantity: number;
  customDesign?: string;
  isCustom?: boolean;
}

export default function App() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customType, setCustomType] = useState<'tshirt' | 'mug'>('tshirt');
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [isCustomizing, setIsCustomizing] = useState(false);
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
    setIsCustomizing(false);
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
            <a href="#about" className="hover:opacity-100 transition-opacity">About</a>
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
                Upload your vision or choose from our curated collection.
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
            <div className="hidden sm:flex gap-4">
              <button className="text-sm font-medium underline underline-offset-8">All Products</button>
              <button className="text-sm font-medium opacity-50 hover:opacity-100 transition-opacity">T-Shirts</button>
              <button className="text-sm font-medium opacity-50 hover:opacity-100 transition-opacity">Mugs</button>
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
                    <span className="text-xs opacity-60">$35.00</span>
                  </button>
                  <button 
                    onClick={() => setCustomType('mug')}
                    className={`flex-1 p-6 rounded-2xl border transition-all flex flex-col items-center gap-3 ${
                      customType === 'mug' ? 'bg-white text-brand-ink border-white' : 'border-white/20 hover:border-white/40'
                    }`}
                  >
                    <Coffee size={32} strokeWidth={1.5} />
                    <span className="font-medium">Ceramic Mug</span>
                    <span className="text-xs opacity-60">$25.00</span>
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
                {/* Mockup Preview */}
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

                  {!customImage && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-sm font-medium tracking-widest opacity-30 uppercase">Preview Area</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-24 px-6 border-y border-black/5">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-12 h-12 bg-brand-accent/10 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-accent">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-xl font-serif mb-3">Sustainable Sourcing</h3>
              <p className="text-sm opacity-60 leading-relaxed">We use 100% organic cotton and ethically produced ceramics for all our products.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-brand-accent/10 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-accent">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-xl font-serif mb-3">High-Fidelity Print</h3>
              <p className="text-sm opacity-60 leading-relaxed">Our advanced DTG printing ensures your custom designs stay vibrant wash after wash.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-brand-accent/10 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-accent">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-xl font-serif mb-3">Global Shipping</h3>
              <p className="text-sm opacity-60 leading-relaxed">Beautifully packaged and delivered to your doorstep, wherever you are in the world.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-brand-cream pt-24 pb-12 px-6 border-t border-black/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="lg:col-span-1">
              <a href="#" className="text-3xl font-serif font-bold tracking-tighter mb-6 block">AURA</a>
              <p className="text-sm opacity-60 leading-relaxed mb-8">
                Redefining custom print through aesthetic minimalism and sustainable practices.
              </p>
              <div className="flex gap-4">
                <a href="#" className="p-2 hover:bg-black/5 rounded-full transition-colors"><Instagram size={20} /></a>
                <a href="#" className="p-2 hover:bg-black/5 rounded-full transition-colors"><Twitter size={20} /></a>
                <a href="#" className="p-2 hover:bg-black/5 rounded-full transition-colors"><Facebook size={20} /></a>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-xs uppercase tracking-[0.2em] mb-6">Shop</h4>
              <ul className="space-y-4 text-sm opacity-60">
                <li><a href="#" className="hover:opacity-100 transition-opacity">All Products</a></li>
                <li><a href="#" className="hover:opacity-100 transition-opacity">T-Shirts</a></li>
                <li><a href="#" className="hover:opacity-100 transition-opacity">Coffee Mugs</a></li>
                <li><a href="#" className="hover:opacity-100 transition-opacity">New Arrivals</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-xs uppercase tracking-[0.2em] mb-6">Support</h4>
              <ul className="space-y-4 text-sm opacity-60">
                <li><a href="#" className="hover:opacity-100 transition-opacity">Shipping Policy</a></li>
                <li><a href="#" className="hover:opacity-100 transition-opacity">Returns & Exchanges</a></li>
                <li><a href="#" className="hover:opacity-100 transition-opacity">Care Guide</a></li>
                <li><a href="#" className="hover:opacity-100 transition-opacity">Contact Us</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-xs uppercase tracking-[0.2em] mb-6">Newsletter</h4>
              <p className="text-sm opacity-60 mb-6">Join our community for early access and design inspiration.</p>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="Your email" 
                  className="bg-black/5 border-none rounded-full px-4 py-2 text-sm flex-grow focus:ring-1 focus:ring-brand-ink outline-none"
                />
                <button className="bg-brand-ink text-brand-cream p-2 rounded-full hover:bg-brand-ink/90 transition-colors">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-black/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">
            <p>© 2026 AURA PRINT STUDIO. ALL RIGHTS RESERVED.</p>
            <div className="flex gap-8">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
            </div>
          </div>
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
                          <p className="text-xs opacity-50 uppercase tracking-wider mt-1">{item.category}</p>
                          {item.isCustom && (
                            <span className="text-[10px] bg-brand-accent/10 text-brand-accent px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter mt-2 inline-block">
                              Custom Design
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3 bg-black/5 rounded-full px-3 py-1">
                            <button 
                              onClick={() => updateQuantity(item.id, -1, item.customDesign)}
                              className="opacity-50 hover:opacity-100"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, 1, item.customDesign)}
                              className="opacity-50 hover:opacity-100"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <span className="font-medium">${item.price * item.quantity}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t border-black/5 space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-sm opacity-50 uppercase tracking-widest font-bold">Subtotal</span>
                    <span className="text-2xl font-serif">${cartTotal}</span>
                  </div>
                  <p className="text-[10px] opacity-40 uppercase tracking-widest text-center">Shipping & taxes calculated at checkout</p>
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
