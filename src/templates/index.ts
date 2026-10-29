import React from 'react';
import type { WeddingTemplateProps } from '@/types/wedding';
import RoyalRajwada from './RoyalRajwada';
import MinimalSage from './MinimalSage';
import BohoFloral from './BohoFloral';
import NikahEmerald from './NikahEmerald';
import BentoClay from './BentoClay';
import MalabarRoyalGold from './MalabarRoyalGold';
import MinimalWhiteArch from './MinimalWhiteArch';
import RoyalMughalCrimson from './RoyalMughalCrimson';
import SaffronMarigoldFiesta from './SaffronMarigoldFiesta';
import { PUBLISH_AMOUNT_INR } from '@/lib/payments/validation';

export type TemplateProps = WeddingTemplateProps;

export const TEMPLATE_REGISTRY: Record<string, React.ComponentType<WeddingTemplateProps>> = {
  'royal-rajwada': RoyalRajwada,
  'minimal-sage': MinimalSage,
  'boho-floral': BohoFloral,
  'nikah-emerald': NikahEmerald,
  'bento-clay': BentoClay,
  'malabar-royal-gold': MalabarRoyalGold,
  'minimal-white-arch': MinimalWhiteArch,
  'royal-mughal-crimson': RoyalMughalCrimson,
  'saffron-marigold-fiesta': SaffronMarigoldFiesta,
};

export const TEMPLATE_METADATA = [
  { id: 'royal-rajwada', name: 'Royal Rajwada', price: PUBLISH_AMOUNT_INR, thumbnail: '/thumbs/royal.webp' },
  { id: 'minimal-sage', name: 'Minimal Sage', price: PUBLISH_AMOUNT_INR, thumbnail: '/thumbs/sage.webp' },
  { id: 'boho-floral', name: 'Boho Floral', price: PUBLISH_AMOUNT_INR, thumbnail: '/thumbs/boho.webp' },
  { id: 'nikah-emerald', name: 'Nikah Emerald (Kerala Royale)', price: PUBLISH_AMOUNT_INR, thumbnail: '/thumbs/emerald.webp' },
  { id: 'bento-clay', name: 'Bento Clay (Terracotta)', price: PUBLISH_AMOUNT_INR, thumbnail: '/thumbs/bento-clay.webp' },
  { id: 'malabar-royal-gold', name: 'Malabar Royal Gold', price: PUBLISH_AMOUNT_INR, thumbnail: '/thumbs/malabar-gold.webp' },
  { id: 'minimal-white-arch', name: 'Minimal White Arch', price: PUBLISH_AMOUNT_INR, thumbnail: '/thumbs/white-arch.webp' },
  { id: 'royal-mughal-crimson', name: 'Royal Mughal Crimson (Zari Gold)', price: PUBLISH_AMOUNT_INR, thumbnail: '/thumbs/royal-mughal.webp' },
  { id: 'saffron-marigold-fiesta', name: 'Saffron & Marigold Fiesta (Genda Phool)', price: PUBLISH_AMOUNT_INR, thumbnail: '/thumbs/saffron-marigold.webp' },
];

export * from './registry';
