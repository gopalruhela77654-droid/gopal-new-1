// @ts-nocheck
import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface FabricationForgeProps {
  designImage: string | null;
  productType: 'tshirt' | 'mug';
  productColor: 'white' | 'black';
}

export default function FabricationForge({ designImage, productType, productColor }: FabricationForgeProps) {
  const [viewSide, setViewSide] = React.useState<'front' | 'back'>('front');

  const ASSETS = {
    tshirt: {
      front: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800',
      back: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=80&w=800'
    },
    mug: {
      front: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=800',
      back: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=800' // Mug back is same for now
    }
  };

  const getDesignPosition = () => {
    if (productType === 'tshirt') {
      return viewSide === 'front' 
        ? { top: '35%', left: '50%', width: '30%' } 
        : { top: '25%', left: '50%', width: '25%' };
    }
    return { top: '50%', left: '50%', width: '25%' }; // Mug
  };

  const pos = getDesignPosition();

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-[#000000] overflow-hidden rounded-[40px] border border-white/5">
      {/* Front/Back Toggle */}
      {productType === 'tshirt' && (
        <div className="absolute top-6 z-20 flex bg-white/5 backdrop-blur-md p-1 rounded-full border border-white/10">
          <button
            onClick={() => setViewSide('front')}
            className={`px-6 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
              viewSide === 'front' ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'
            }`}
          >
            Front
          </button>
          <button
            onClick={() => setViewSide('back')}
            className={`px-6 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
              viewSide === 'back' ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'
            }`}
          >
            Back
          </button>
        </div>
      )}

      {/* 2.5D Engine Viewport */}
      <div className="relative w-full h-full flex items-center justify-center p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${productType}-${productColor}-${viewSide}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4, ease: "circOut" }}
            className="relative w-full h-full flex items-center justify-center"
          >
            {/* Layer 1: Base Product */}
            <img
              src={ASSETS[productType][viewSide]}
              alt="Base Product"
              className={`w-full h-full object-contain pointer-events-none ${productColor === 'black' ? 'brightness-50 grayscale' : ''}`}
              referrerPolicy="no-referrer"
            />

            {/* Layer 2: The Design (2.5D Composite) */}
            {designImage ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0.9, y: 0 }}
                style={{
                  position: 'absolute',
                  top: pos.top,
                  left: pos.left,
                  width: pos.width,
                  transform: 'translate(-50%, -50%)',
                  mixBlendMode: 'multiply',
                }}
                className="pointer-events-none"
              >
                <img
                  src={designImage}
                  alt="Custom Design"
                  className="w-full h-auto drop-shadow-sm"
                />
              </motion.div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                  animate={{ opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-center"
                >
                  <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.4em]">
                    Awaiting Artwork
                  </p>
                </motion.div>
              </div>
            )}

            {/* Layer 3: Shadow/Texture Overlay (God-Tier Illusion) */}
            <img
              src={ASSETS[productType][viewSide]}
              alt="Texture Overlay"
              style={{ mixBlendMode: 'overlay', opacity: 0.3 }}
              className={`absolute inset-0 w-full h-full object-contain pointer-events-none ${productColor === 'black' ? 'brightness-50 grayscale' : ''}`}
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Engine Status Accents */}
      <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-[40px] overflow-hidden">
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-pulse" />
          <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Aura 2.5D Engine // Active</span>
        </div>
        
        <div className="absolute bottom-4 right-4 text-[8px] font-mono text-white/10 uppercase tracking-widest">
          {productType.toUpperCase()} // {viewSide.toUpperCase()} // RENDER_STABLE
        </div>
      </div>
    </div>
  );
}
