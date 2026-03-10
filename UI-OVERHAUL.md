# UI/UX Overhaul Plan

> Load this file on-demand when working on UI tasks. Do NOT add to CLAUDE.md or CONTEXT.md bulk.

## Status

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Design System Foundation | not started |
| 2 | Landing Page Redesign | not started |
| 3 | Dashboard / Portal Modernization | not started |
| 4 | Chatbot UI Redesign | not started |
| 5 | Mobile Chatbot Optimization | not started |

**Implementation order:** 1 → 5 → 4 → 2 → 3

## New Dependencies

| Package | Purpose | Size |
|---------|---------|------|
| `lucide-react` | Consistent icon set | ~5KB per icon (tree-shakes) |
| `react-markdown` + `remark-gfm` | Bot message markdown rendering | ~30KB |
| (optional) `framer-motion` | Page transitions, message animations | ~30KB |

No heavy UI library (no shadcn, no MUI) — Tailwind utilities + these focused additions.

---

## Phase 1: Design System Foundation

**Goal:** Establish a modern design system that all phases build on.

### 1.1 Tailwind Config (`tailwind.config.ts`)
- Custom color palette: branded gradient palette (indigo-to-violet primary, warm neutrals instead of pure gray)
- Custom `boxShadow`: `shadow-soft`, `shadow-card`, `shadow-glow` for depth
- Custom `animation` keyframes: `fadeIn`, `slideUp`, `slideInRight`, `scaleIn`, `shimmer` (skeleton loaders)
- Custom `borderRadius` tokens
- `backdrop-blur` utilities for glassmorphism

### 1.2 Global CSS (`globals.css`)
- CSS custom properties for the new palette (supports future dark mode)
- Smooth scroll on `html`
- Custom `::selection` color
- Thin, subtle custom scrollbar
- Gradient utility classes (`.gradient-primary`, `.gradient-hero`)

---

## Phase 2: Landing Page Redesign

**Current problems:** Generic, no visual interest, stock blue, no animations, no social proof, template feel.

### 2.1 Navigation Bar
- Glassmorphism: `backdrop-blur-xl bg-white/70 border-b border-white/20`
- Sticky with scroll-aware opacity increase
- Logo/brand mark on left
- Gradient CTA button ("Get Started")

### 2.2 Hero Section
- Split layout: left = heading + subtitle + CTAs, right = animated product mockup/screenshot
- Gradient text on key words: `bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent`
- Staggered entrance animations (CSS `animation-delay`)
- Subtle grid/dot pattern background
- Floating pill badge above heading ("Set up in 5 minutes")
- Bigger CTAs with icons

### 2.3 Social Proof / Stats Bar (NEW)
- Horizontal row between hero and how-it-works
- 3 animated counters: "X bots created", "X messages sent", "5 min avg setup"
- Light gradient background

### 2.4 How-It-Works Section
- Custom icons/illustrations replacing numbered circles
- Card hover: `translateY(-4px)` + shadow increase
- Connecting line/arrow between steps
- Mini screenshot/illustration per card
- Stagger fade-in on scroll (Intersection Observer)

### 2.5 Features Section
- Bento grid layout (asymmetric: one large card + two smaller)
- Icons with gradient background circles
- Subtle border gradient on cards
- Hover glow via `ring` + transition

### 2.6 Bottom CTA
- Full-width gradient section (indigo → violet)
- White heading + subtitle + white CTA button
- Subtle pattern overlay or radial glow

### 2.7 Footer
- Multi-column (Product, Resources, Legal)
- Gradient top border fade
- Social icons placeholder

---

## Phase 3: Dashboard / Portal Modernization

**Current problems:** Plain white cards + gray borders, no depth, no micro-interactions, generic admin panel feel.

### 3.1 Dashboard Shell (`DashboardShell.tsx`)
- Sidebar: subtle gradient/off-white bg, gradient pill active state with left accent bar
- Icons: switch to Lucide (consistent set)
- Hover: background transition + slight indent
- User section: avatar circle with initials
- Collapse to icon-only mode on desktop
- Mobile: better hamburger animation (X transform), breadcrumb
- Page transition: simple fade-in on route change

### 3.2 Overview Panel
- Welcome hero: gradient banner "Welcome back! Your bot is live." with green status dot
- Quick stat pills (messages today, total conversations) above detail cards
- Cards: rounded-2xl, subtle shadow (no border), icon + title headers
- Shareable link: copy button inside input (right-aligned)
- Embed code: dark bg code block look (monospace, syntax-colored)
- Empty state: SVG illustration + guided CTA

### 3.3 Customize Panel
- Live preview: mini chat mockup on right, updates as owner changes name/color/persona
- Color picker: preset swatches row (6-8 sports colors) + custom hex
- Persona selector: cards with emoji + description
- Sticky floating save bar at bottom

### 3.4 Knowledge Base Panel
- Pill-style tabs (not underline) with smooth background transition
- FAQ entries: collapsible accordion
- Upload zone: dashed border animation on drag, file type icons, progress indicator
- Entry cards: hover lift, inline slide delete

### 3.5 Analytics Panel
- Stat cards: trend indicator (↑12% vs last period), icon per stat
- Bar chart: gradient fill, rounded tops, hover tooltip
- Time toggle: pill/segmented control

### 3.6 Settings Panel
- Danger zone: red-tinted card with warning icon, better visual separation
- Delete: modal confirmation instead of inline expand

### 3.7 Create Bot Modal
- Progress bar (gradient fill) instead of step circles
- Animated slide transitions between steps
- Sport/league: visual cards with sport icons instead of dropdowns
- Success: confetti or checkmark animation

---

## Phase 4: Chatbot UI Redesign

**Current problems:** Very basic bubbles, no avatars, no markdown, plain input bar, no typing indicator, no personality.

### 4.1 Chat Header
- Bot avatar/icon (circle with first letter or sport emoji) + bot name + "Online" status dot
- Subtle gradient or blur instead of flat color
- Embed: minimize/close button in header

### 4.2 Message Bubbles (`MessageBubble.tsx`)
- Bot avatar: small circle left of bot messages
- Markdown rendering: bold, italic, lists, links (`react-markdown`)
- Better bubble shapes: more rounded, subtle shadow on bot messages
- Timestamps: "just now" / "2m ago" below message groups (optional, grouped)
- User bubble: gradient background (indigo → violet) instead of flat blue-600
- Animation: messages slide in from bottom with fade

### 4.3 Typing Indicator (replace `StreamingCursor.tsx`)
- Three bouncing dots in a bubble (standard chat typing indicator)
- Left-aligned like bot message
- Smooth appear/disappear transition

### 4.4 Chat Input (`ChatInput.tsx`)
- Rounded-full or rounded-2xl (chat-app feel)
- Send button inside input (right side), icon-only (arrow-up in circle)
- Subtle shadow on input container
- Auto-grow textarea for long messages
- Character count near limit (900+/1000)

### 4.5 Welcome State
- Centered welcome card (not plain bot message): bot name, sport icon, 2-3 suggested question chips
- Tapping a chip sends that question
- E.g., "Who won last night?", "League standings", "Top scorers"

### 4.6 Scrolling & Polish
- Smooth scroll to bottom
- "Scroll to bottom" FAB when user scrolls up and new messages arrive
- Date separators for long conversations

---

## Phase 5: Mobile Chatbot Optimization

**Current problems:** `h-screen` ignores mobile browser chrome, keyboard hides input, no safe area padding, small touch targets.

### 5.1 Viewport & Height
- Replace `h-screen` with `h-dvh` (dynamic viewport height — respects mobile chrome)
- Fallback: JS-based `window.visualViewport.height`
- `viewport-fit=cover` in meta tag + safe area inset padding

### 5.2 Keyboard Handling
- Detect `visualViewport` resize → scroll input into view when keyboard opens
- Input bar stays above keyboard
- Prevent iOS bounce-scroll when keyboard open

### 5.3 Touch Optimizations
- Send button: minimum 44x44px touch target
- Larger text on mobile: `text-base` instead of `text-sm`
- No accidental horizontal scroll
- Pull-to-refresh disabled in chat view

### 5.4 Mobile Chat Input
- Full-width input (no wasted side padding)
- Auto-grow textarea
- Circular send button, fixed size, always visible
- Bottom safe area padding (`env(safe-area-inset-bottom)`)

### 5.5 Mobile Header
- Compact padding, no overflow on bot name
- Embed: touch-friendly close/minimize button

### 5.6 Mobile Message Display
- Bubbles: max-width 85% on mobile (wider than desktop 80%)
- Font: `text-sm md:text-sm` → `text-base` on small screens
- Slightly tighter message spacing for more visible content
