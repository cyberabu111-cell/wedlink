# AI Wedding Templates Directory

This folder is designed for plug-and-play AI-generated wedding templates.

## How to add a new template:

1. Create your template file here (or in `src/templates/`):
   `src/templates/templates/MyNewTemplate.tsx`
2. Ensure your component implements the shared `WeddingTemplateProps`:
   ```tsx
   import React from "react";
   import type { WeddingTemplateProps } from "@/types/wedding";
   import {
     getGoogleCalendarUrl,
     downloadIcsFile,
     getGoogleMapsDirectionUrl,
     EmbeddedMap,
   } from "@/components/shared/WeddingActionHelpers";

   export default function MyNewTemplate({ data, isPreview, onRsvpSubmit }: WeddingTemplateProps) {
     const { couple, events, story, gallery, theme, rsvpConfig } = data;
     // Your custom layout and design
     return <div>...</div>;
   }
   ```
3. Register the new template in `src/templates/registry.ts`:
   ```ts
   {
     id: 'my-new-template',
     name: 'My New Template',
     category: 'Luxury', // 'Traditional' | 'Minimal' | 'Modern' | 'Floral' | 'Luxury'
     thumbnailUrl: '/thumbs/my-new-template.webp',
     component: dynamic(() => import('./templates/MyNewTemplate')),
   }
   ```
4. Done! The template will instantly appear in the studio editor selector, live preview, and public invitation URLs without touching the database schema or form logic.

## Festie Rooftop

`festie-rooftop` is a responsive, asset-backed invitation inspired by the supplied mobile reference. Its artwork is stored in `public/templates/festie-rooftop/`, and its preview is available at `/preview/festie-rooftop`.
