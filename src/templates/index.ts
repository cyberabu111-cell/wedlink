import React from 'react';
import type { WeddingTemplateProps } from '@/types/wedding';
import RoyalRajwada from './RoyalRajwada';
import MinimalSage from './MinimalSage';
import BohoFloral from './BohoFloral';
import NikahEmerald from './NikahEmerald';
import BentoClay from './BentoClay';
import { PUBLISH_AMOUNT_INR } from '@/lib/payments/validation';

export type TemplateProps = WeddingTemplateProps;

export const TEMPLATE_REGISTRY: Record<string, React.ComponentType<WeddingTemplateProps>> = {
  'royal-rajwada': RoyalRajwada,
  'minimal-sage': MinimalSage,
  'boho-floral': BohoFloral,
  'nikah-emerald': NikahEmerald,
  'bento-clay': BentoClay,
};

export const TEMPLATE_METADATA = [
  { id: 'royal-rajwada', name: 'Royal Rajwada', price: PUBLISH_AMOUNT_INR, thumbnail: '/thumbs/royal.webp' },
  { id: 'minimal-sage', name: 'Minimal Sage', price: PUBLISH_AMOUNT_INR, thumbnail: '/thumbs/sage.webp' },
  { id: 'boho-floral', name: 'Boho Floral', price: PUBLISH_AMOUNT_INR, thumbnail: '/thumbs/boho.webp' },
  { id: 'nikah-emerald', name: 'Nikah Emerald (Kerala Royale)', price: PUBLISH_AMOUNT_INR, thumbnail: '/thumbs/emerald.webp' },
  { id: 'bento-clay', name: 'Bento Clay (Terracotta)', price: PUBLISH_AMOUNT_INR, thumbnail: '/thumbs/bento-clay.webp' },
];

export * from './registry';
