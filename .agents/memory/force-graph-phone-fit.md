---
name: Fitting a force-directed graph into a phone panel
description: Why scaling node positions packs nodes together, and what to scale instead, for d3-force graphs rendered with fixed-size HTML nodes inside SVG.
---

# Fitting a force-directed graph into a small fixed panel

When a d3-force graph is drawn with **fixed-size nodes** (e.g. a 48px box in a
`foreignObject`) and must fit a small panel without scrolling, fit it by
**scaling the SVG `viewBox` to the settled layout's bounding box**. Do not
normalise or compress the node positions.

**Why:** the node boxes are a fixed pixel size in the SVG user space, but node
positions are not. Multiplying positions by a fit factor shrinks the gaps while
the boxes stay the same size, so the separation `forceCollide` guaranteed is
destroyed and the boxes pile on top of each other. The `viewBox` scales
positions *and* boxes by the same factor, so the collide separation survives.

**How to apply:**
- Keep a `forceCollide` radius slightly larger than half the node box plus its
  caption; that is what guarantees separation in simulation space.
- After ticking the simulation, compute the node bounding box and set the
  `viewBox` to it plus padding. Pad the bottom more than the top if captions
  hang below the node. Enforce a minimum span so a two-node graph does not zoom
  to absurd size.
- Give the `<svg>` `h-full w-full` and let `preserveAspectRatio` do the fitting;
  a fixed pixel-size `<svg>` with `overflow-visible` will spill past a clipping
  parent instead.
- Graphs made of **disconnected clusters** need a weak `forceX(0)`/`forceY(0)`
  pull to the origin. Without it, charge repulsion flings the clusters apart,
  which inflates the fitted bounding box and shrinks every node to compensate —
  the symptom is tiny crowded clusters separated by empty space.
- Repeated edge labels are the last thing to collide. Showing an edge's label
  only when one of its endpoints is selected declutters more than any amount of
  layout tuning, and a `paint-order: stroke` outline in the panel background
  colour keeps it legible over connector lines.

## Panning a fitted graph

For a transformable graph that lives in a clipped game canvas, use explicit,
generous pan limits instead of unbounded panning.

**Why:** an unbounded transformed SVG can be dragged completely outside its
own visible viewport. With persistent HUD or action controls around that
viewport, this reads as though another component has hidden the graph.

**How to apply:** keep the initial centering, enable transform bounds, and set
deliberate min/max X and Y positions that provide exploration room without
letting every node leave the visible canvas. Do not use a zoomed-out centering
option as a substitute: some transform libraries treat it as a hard snap-back
constraint.
