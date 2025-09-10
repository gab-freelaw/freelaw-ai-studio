# Freelaw Design System - v0 Style Guide

## Brand Colors
```css
/* Primary Colors */
--freelaw-purple: #5527AD;        /* Roxo Freelaw - Primary brand color */
--freelaw-purple-light: #A994E6;  /* Roxo sonho grande - Light variant */
--tech-blue: #241054;             /* Azul tech - Deep accent */
--tech-blue-light: #2B265C;       /* Azul tech 2.0 - Secondary accent */

/* Product Colors */
--product-pink: #DD2869;          /* Rosa produto - Alert/Important */
--product-pink-light: #AF115E;    /* Rosa produto 2.0 - Hover state */
--olympic-gold: #ECB43D;          /* Ouro olímpico - Success/Premium */
--olympic-gold-dark: #BC801F;     /* Ouro olímpico 2.0 - Hover state */

/* Neutral Colors */
--freelaw-white: #EDF0F7;         /* Branco Freelaw - Background */
--freelaw-black: #0C0C0C;         /* Preto Freelaw - Text */
--gray-50: #F9FAFB;
--gray-100: #F3F4F6;
--gray-200: #E5E7EB;
--gray-300: #D1D5DB;
--gray-400: #9CA3AF;
--gray-500: #6B7280;
--gray-600: #4B5563;
--gray-700: #374151;
--gray-800: #1F2937;
--gray-900: #111827;
```

## Typography
```css
/* Font Families */
--font-sans: 'Satoshi', 'Inter', system-ui, -apple-system, sans-serif;
--font-mono: 'IBM Plex Mono', 'Menlo', monospace;

/* Font Sizes - v0 Style */
--text-xs: 0.75rem;     /* 12px */
--text-sm: 0.875rem;    /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg: 1.125rem;    /* 18px */
--text-xl: 1.25rem;     /* 20px */
--text-2xl: 1.5rem;     /* 24px */
--text-3xl: 1.875rem;   /* 30px */
--text-4xl: 2.25rem;    /* 36px */
--text-5xl: 3rem;       /* 48px */

/* Font Weights */
--font-light: 300;
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-black: 900;
```

## v0-Style Component Patterns

### Spacing System
```css
--space-0: 0;
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
```

### Border Radius
```css
--radius-sm: 0.125rem;   /* 2px - Subtle */
--radius-md: 0.375rem;   /* 6px - Default */
--radius-lg: 0.5rem;     /* 8px - Cards */
--radius-xl: 0.75rem;    /* 12px - Modals */
--radius-2xl: 1rem;      /* 16px - Large elements */
--radius-full: 9999px;   /* Pills/Circles */
```

### Shadows (v0-style subtle shadows)
```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
--shadow-purple: 0 10px 40px -10px rgba(85, 39, 173, 0.3);
```

## Component Styles (v0 patterns)

### Buttons
- Primary: Purple gradient with subtle shadow
- Secondary: Ghost style with purple text
- Tertiary: Minimal with underline on hover
- Sizes: sm (32px), md (40px), lg (48px)
- Always include subtle transitions

### Cards
- Clean white/dark backgrounds
- Subtle borders (1px solid border-color)
- Minimal shadows (shadow-sm default, shadow-md on hover)
- Generous padding (space-6)
- Smooth hover transitions

### Forms
- Large, accessible inputs (min 44px height)
- Floating or top labels
- Purple focus states
- Clear error states with product-pink
- Success states with olympic-gold

### Navigation
- Sticky headers with backdrop blur
- Purple accent for active states
- Smooth transitions between states
- Mobile-first responsive design

### Animations
- Subtle and purposeful
- Duration: 150-300ms for micro-interactions
- Use ease-out for entrances, ease-in for exits
- Transform and opacity for smooth performance

## Dark Mode
- Background: #0C0C0C (freelaw-black)
- Surface: #1A1A2E
- Text: #EDF0F7 (freelaw-white)
- Maintain purple as primary accent
- Adjust opacity for hierarchy

## Accessibility
- WCAG AAA contrast ratios
- Focus-visible outlines (purple)
- Keyboard navigation support
- Screen reader optimized
- Reduced motion support

## Implementation Notes
1. Use CSS variables for all colors
2. Implement with Tailwind CSS config
3. Create reusable component classes
4. Mobile-first responsive approach
5. Support both light and dark themes
6. Use Satoshi as primary font (fall back to Inter)
7. Use IBM Plex Sans for technical/code content