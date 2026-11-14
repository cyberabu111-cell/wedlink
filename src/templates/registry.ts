import dynamic from "next/dynamic";
import React from "react";
import type { WeddingTemplateProps } from "@/types/wedding";

export type TemplateCategory =
  | "Traditional"
  | "Minimal"
  | "Modern"
  | "Floral"
  | "Luxury";

export interface TemplateDefinition {
  id: string;
  name: string;
  category: TemplateCategory;
  thumbnailUrl: string;
  component: React.ComponentType<WeddingTemplateProps>;
}

/**
 * Loading fallback placeholder rendered while the template chunk downloads.
 * Uses React.createElement to keep registry.ts a valid .ts file.
 */
function TemplateLoadingFallback() {
  return React.createElement(
    "div",
    {
      className:
        "min-h-screen flex items-center justify-center bg-stone-50 text-stone-500 font-sans p-8",
    },
    React.createElement(
      "div",
      { className: "flex flex-col items-center space-y-3" },
      React.createElement("div", {
        className:
          "w-8 h-8 border-2 border-stone-300 border-t-stone-800 rounded-full animate-spin",
      }),
      React.createElement(
        "p",
        { className: "text-sm font-medium tracking-wide" },
        "Loading celebration template..."
      )
    )
  );
}

/**
 * Plug-and-Play Template Registry.
 *
 * Each template is lazy-loaded with next/dynamic so that adding 50+ templates
 * never bloats the initial client bundle.
 */
export const TEMPLATES: TemplateDefinition[] = [
  {
    id: "royal-rajwada",
    name: "Royal Rajwada",
    category: "Luxury",
    thumbnailUrl: "/thumbs/royal.webp",
    component: dynamic(() => import("./templates/RoyalRajwada"), {
      loading: () => TemplateLoadingFallback(),
      ssr: true,
    }),
  },
  {
    id: "minimal-sage",
    name: "Minimal Sage",
    category: "Minimal",
    thumbnailUrl: "/thumbs/sage.webp",
    component: dynamic(() => import("./templates/MinimalSage"), {
      loading: () => TemplateLoadingFallback(),
      ssr: true,
    }),
  },
  {
    id: "boho-floral",
    name: "Boho Floral",
    category: "Floral",
    thumbnailUrl: "/thumbs/boho.webp",
    component: dynamic(() => import("./templates/BohoFloral"), {
      loading: () => TemplateLoadingFallback(),
      ssr: true,
    }),
  },
  {
    id: "nikah-emerald",
    name: "Nikah Emerald (Kerala Royale)",
    category: "Traditional",
    thumbnailUrl: "/thumbs/emerald.webp",
    component: dynamic(() => import("./templates/NikahEmerald"), {
      loading: () => TemplateLoadingFallback(),
      ssr: true,
    }),
  },
  {
    id: "bento-clay",
    name: "Bento Clay (Terracotta)",
    category: "Modern",
    thumbnailUrl: "/thumbs/bento-clay.webp",
    component: dynamic(() => import("./templates/BentoClay"), {
      loading: () => TemplateLoadingFallback(),
      ssr: true,
    }),
  },
  {
    id: "malabar-royal-gold",
    name: "Malabar Royal Gold",
    category: "Luxury",
    thumbnailUrl: "/thumbs/malabar-gold.webp",
    component: dynamic(() => import("./templates/MalabarRoyalGold"), {
      loading: () => TemplateLoadingFallback(),
      ssr: true,
    }),
  },
  {
    id: "minimal-white-arch",
    name: "Minimal White Arch",
    category: "Minimal",
    thumbnailUrl: "/thumbs/white-arch.webp",
    component: dynamic(() => import("./templates/MinimalWhiteArch"), {
      loading: () => TemplateLoadingFallback(),
      ssr: true,
    }),
  },
  {
    id: "royal-mughal-crimson",
    name: "Royal Mughal Crimson (Zari Gold)",
    category: "Luxury",
    thumbnailUrl: "/thumbs/royal-mughal.webp",
    component: dynamic(() => import("./templates/RoyalMughalCrimson"), {
      loading: () => TemplateLoadingFallback(),
      ssr: true,
    }),
  },
  {
    id: "saffron-marigold-fiesta",
    name: "Saffron & Marigold Fiesta (Genda Phool)",
    category: "Traditional",
    thumbnailUrl: "/thumbs/saffron-marigold.webp",
    component: dynamic(() => import("./templates/SaffronMarigoldFiesta"), {
      loading: () => TemplateLoadingFallback(),
      ssr: true,
    }),
  },
  {
    id: "festie-rooftop",
    name: "Festie Rooftop",
    category: "Floral",
    thumbnailUrl: "/thumbs/festie-rooftop.webp",
    component: dynamic(() => import("./templates/FestieRooftop"), {
      loading: () => TemplateLoadingFallback(),
      ssr: true,
    }),
  },
  {
    id: "on-chair",
    name: "On Chair",
    category: "Modern",
    thumbnailUrl: "/templates/on-chair/poster.jpg",
    component: dynamic(() => import("./templates/OnChair"), {
      loading: () => TemplateLoadingFallback(),
      ssr: true,
    }),
  },
];

export const TEMPLATE_REGISTRY: Record<string, TemplateDefinition> = TEMPLATES.reduce(
  (acc, template) => {
    acc[template.id] = template;
    return acc;
  },
  {} as Record<string, TemplateDefinition>
);

export const TEMPLATE_COMPONENTS: Record<
  string,
  React.ComponentType<WeddingTemplateProps>
> = TEMPLATES.reduce((acc, template) => {
  acc[template.id] = template.component;
  return acc;
}, {} as Record<string, React.ComponentType<WeddingTemplateProps>>);

export function getTemplate(id: string): TemplateDefinition | undefined {
  return TEMPLATE_REGISTRY[id];
}

export function getTemplateComponent(
  id: string
): React.ComponentType<WeddingTemplateProps> {
  const entry = TEMPLATE_REGISTRY[id] || TEMPLATE_REGISTRY["royal-rajwada"];
  return entry.component;
}

export function isRegisteredTemplate(id: string): boolean {
  return id in TEMPLATE_REGISTRY;
}
