# Design

This file is the design entrypoint for the Capstone Cognitive Training Platform. The detailed Apple-inspired source reference stays in `apple/DESIGN.md`; this file translates it into practical rules for this app.

## Design Goal

The product should feel calm, research-grade, and reliable. The interface supports training and analysis tasks, so clarity and stability matter more than visual novelty.

## Primary References

Read in this order for design work:

1. `DESIGN.md`
2. `apple/DESIGN.md`
3. `client/src/index.css`
4. shared UI components in `client/src/components/ui/`
5. page shells in `client/src/components/DashboardLayout.tsx` and `client/src/components/PageHeader.tsx`

## Practical Rules

- Use existing tokens from `client/src/index.css` before adding new colors.
- Prefer `bg-background`、`bg-card`、`text-foreground`、`text-muted-foreground`、`border-border`、`text-primary`.
- Keep pages spacious, readable, and restrained.
- Make small page-by-page improvements; do not redesign the whole product at once.
- Keep icons visually centered in square/circle affordances.
- Use one clear selected state for navigation and cards.
- Avoid decorative gradients, heavy shadows, nested cards, and flashy motion.
- Motion should feel smooth and quiet. Avoid layout jitter, flicker, and repeated resize thrash.

## Current UI Boundaries

Safe polish targets:

- spacing and alignment
- button and icon centering
- tokenizing hardcoded colors
- card rhythm and readable hierarchy
- sidebar collapse smoothness

Avoid without a separate plan:

- changing game mechanics
- changing assessment logic
- changing tRPC/data shapes
- changing authentication
- broad refactors of `Dashboard.tsx` or `Analytics.tsx`

## Future Portfolio Use

If this project later becomes a project page in `charliechanstudio.com`, keep the app demo and portfolio narrative separate. Prepare screenshots, a short case-study narrative, and a privacy/data note first; do not move the runnable app into the website until deployment boundaries are clear.
