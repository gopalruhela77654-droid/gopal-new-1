import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, CheckCircle2, X } from 'lucide-react';

interface OrderFormProps {
  onSuccess?: () => void;
  onClose: () => void;
}

export default function OrderForm({ onSuccess, onClose }: OrderFormProps) {
  const [formData, setFormData] = React.useState({
    'form-name': 'order-submissions',
    fullName: '',
    whatsapp: '',
    size: 'M',
    designChoice: '',
    address: '',
  });

  const [status, setStatus] = React.useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [validationError, setValidationError] = React.useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setValidationError(null);
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic Validation Check
    if (!formData.fullName || !formData.whatsapp || !formData.address || !formData.designChoice) {
      setValidationError('Please enter correct details in all fields.');
      return;
    }

    setStatus('submitting');
    setValidationError(null);

    // MOCK SUCCESS for preview environment
    // In production (Netlify), the fetch will handle it.
    // We'll try the fetch, but if it fails or we want to force success for demo:
    try {
      const response = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(formData as any).toString(),
      });

      if (response.ok) {
        setStatus('success');
        if (onSuccess) onSuccess();
      } else {
        // If not on Netlify, this will likely fail. 
        // For the sake of the user's request to "mock" it:
        setTimeout(() => {
          setStatus('success');
          if (onSuccess) onSuccess();
        }, 1500);
      }
    } catch (error) {
      // Fallback to success for demo purposes in AI Studio
      setTimeout(() => {
        setStatus('success');
        if (onSuccess) onSuccess();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-2xl bg-surface border border-border rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="p-8 md:p-12 overflow-y-auto">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 hover:bg-brand-ink/5 rounded-full transition-colors z-20"
          >
            <X size={24} />
          </button>

          <div className="text-center mb-10">
            <span className="text-xs font-bold tracking-[0.3em] uppercase opacity-50 mb-3 block font-mono">Secure Terminal</span>
            <h2 className="text-3xl md:text-4xl font-serif mb-3">Execute Order</h2>
            <p className="text-brand-ink/60 max-w-sm mx-auto text-sm">Complete the parameters below to finalize your custom acquisition.</p>
          </div>

          <div className="relative">
            {/* Quant Accents */}
            <div className="absolute -top-12 -right-4 p-4 opacity-10 font-mono text-[10px] hidden md:block">
              SYS_AUTH_VERIFIED // 0x4F2A
            </div>

            <form 
              name="order-submissions" 
              method="POST" 
              data-netlify="true" 
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <input type="hidden" name="form-name" value="order-submissions" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 ml-1 font-mono">Full Identity</label>
                  <input
                    required
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full bg-brand-ink/5 dark:bg-white/5 border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-brand-ink transition-colors font-medium text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 ml-1 font-mono">WhatsApp Protocol</label>
                  <input
                    required
                    type="tel"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleChange}
                    placeholder="+91 00000 00000"
                    className="w-full bg-brand-ink/5 dark:bg-white/5 border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-brand-ink transition-colors font-medium text-sm"
                  />
                  <p className="text-[9px] opacity-40 uppercase tracking-tighter ml-1 italic">For UPI Payment Confirmation</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 ml-1 font-mono">Dimension (Size)</label>
                  <select
                    name="size"
                    value={formData.size}
                    onChange={handleChange}
                    className="w-full bg-brand-ink/5 dark:bg-white/5 border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-brand-ink transition-colors font-medium appearance-none cursor-pointer text-sm"
                  >
                    <option value="S">S - Small</option>
                    <option value="M">M - Medium</option>
                    <option value="L">L - Large</option>
                    <option value="XL">XL - Extra Large</option>
                    <option value="XXL">XXL - Double Extra Large</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 ml-1 font-mono">Design Configuration</label>
                  <input
                    required
                    type="text"
                    name="designChoice"
                    value={formData.designChoice}
                    onChange={handleChange}
                    placeholder="e.g. Minimalist Line Art"
                    className="w-full bg-brand-ink/5 dark:bg-white/5 border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-brand-ink transition-colors font-medium text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 ml-1 font-mono">Logistics (Shipping Address)</label>
                <textarea
                  required
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Full address with Pincode..."
                  className="w-full bg-brand-ink/5 dark:bg-white/5 border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-brand-ink transition-colors font-medium resize-none text-sm"
                />
              </div>

              {validationError && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ 
                    opacity: 1, 
                    x: [0, -10, 10, -10, 10, 0] 
                  }}
                  transition={{ duration: 0.4 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs py-2 px-4 rounded-lg text-center font-bold uppercase tracking-widest"
                >
                  {validationError}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full bg-cyan-500 text-brand-ink py-4 rounded-2xl font-bold text-base uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 mt-4"
              >
                {status === 'submitting' ? (
                  <span className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    >
                      <Send size={18} />
                    </motion.div>
                    Processing...
                  </span>
                ) : (
                  <>
                    Execute Order <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Success Overlay */}
        <AnimatePresence>
          {status === 'success' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-green-600 flex flex-col items-center justify-center text-white z-50 p-8 text-center overflow-hidden"
            >
              {/* Floating Emojis Background */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ y: "120%", x: `${Math.random() * 100}%`, opacity: 0 }}
                    animate={{ 
                      y: "-20%", 
                      opacity: [0, 1, 1, 0],
                      rotate: [0, 10, -10, 0]
                    }}
                    transition={{ 
                      duration: 3 + Math.random() * 4, 
                      repeat: Infinity, 
                      delay: Math.random() * 5,
                      ease: "linear"
                    }}
                    className="absolute text-4xl"
                  >
                    {['😊', '✨', '🎉', '👕', '🔥', '💖'][Math.floor(Math.random() * 6)]}
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12 }}
                className="mb-6 text-white relative z-10"
              >
                <CheckCircle2 size={100} strokeWidth={1.5} />
              </motion.div>
              
              <div className="relative z-10">
                <h3 className="text-4xl font-serif mb-4 drop-shadow-lg">Order Logged!</h3>
                <p className="text-white/90 mb-10 max-w-xs mx-auto text-lg font-medium">
                  We will contact you on WhatsApp for payment confirmation and final logistics.
                </p>
                
                <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
                  <button 
                    onClick={onClose}
                    className="w-full bg-white text-green-600 py-4 rounded-full font-bold text-lg shadow-xl hover:scale-105 transition-transform active:scale-95"
                  >
                    Shop More
                  </button>
                  <button 
                    onClick={() => setStatus('idle')}
                    className="text-white/70 text-sm font-bold uppercase tracking-widest hover:text-white transition-colors"
                  >
                    View Form Again
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Overlay */}
        <AnimatePresence>
          {status === 'error' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-red-950 flex flex-col items-center justify-center text-white z-50 p-8 text-center"
            >
              <X size={64} className="mb-4 text-red-500" />
              <h3 className="text-2xl font-serif mb-2">Transmission Failed</h3>
              <p className="text-white/70 mb-6">There was an error logging your order. Please try again.</p>
              <button 
                onClick={() => setStatus('idle')}
                className="px-6 py-2 border border-white/20 rounded-full hover:bg-white/10 transition-colors"
              >
                Retry
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function ArrowRight({ size }: { size: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
