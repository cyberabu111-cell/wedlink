import React from 'react';
import type { WeddingData } from '@/types/wedding';
import RoyalRajwada from './RoyalRajwada';
import MinimalSage from './MinimalSage';
import BohoFloral from './BohoFloral';
import NikahEmerald from './NikahEmerald';

export interface TemplateProps {
  data: WeddingData;
  weddingId: string;
  isPreview?: boolean;
  isPaid?: boolean;
}

export const TEMPLATE_REGISTRY: Record<string, React.ComponentType<TemplateProps>> = {
  'royal-rajwada': RoyalRajwada,
  'minimal-sage': MinimalSage,
  'boho-floral': BohoFloral,
  'nikah-emerald': NikahEmerald,
};

export const TEMPLATE_METADATA = [
  { id: 'royal-rajwada', name: 'Royal Rajwada', price: 1499, thumbnail: '/thumbs/royal.webp' },
  { id: 'minimal-sage', name: 'Minimal Sage', price: 999, thumbnail: '/thumbs/sage.webp' },
  { id: 'boho-floral', name: 'Boho Floral', price: 1299, thumbnail: '/thumbs/boho.webp' },
  { id: 'nikah-emerald', name: 'Nikah Emerald (Kerala Royale)', price: 1499, thumbnail: '/thumbs/emerald.webp' },
];
