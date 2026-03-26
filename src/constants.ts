import React from 'react';

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: 'tshirt' | 'mug';
  description: string;
}

export const PRODUCTS: Product[] = [
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
