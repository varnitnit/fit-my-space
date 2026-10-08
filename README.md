# fit-my-space (MoveFit)

**Know it fits before you move.**

MoveFit helps renters check whether their own furniture and appliances fit a property before they move in. You enter the real room dimensions, add the room's built-in fixtures, add your belongings, then place everything on a to-scale floor plan to see what fits.

This repo is an early prototype. It runs entirely in the browser: there is no login and no backend yet, and data is saved in the browser's `localStorage`.

## Features

The planner walks through four steps:

1. **Room**: start from a ready apartment layout (**1 RK, 1 BHK, 2 BHK or 3 BHK**), or set a single room's name, length and width in centimeters. You also choose which side of the plan faces north. Apartment layouts come furnished with a sofa in the hall and a bed and almirah in each bedroom. These are normal inventory items, so you can move, edit or delete them.
2. **Build**: add fixed elements that belong to the room, such as doors, windows, balconies, pillars and built-in wardrobes.
   - Built-in room components: **kitchen**, **washroom**, **bedroom** and **hall**.
   - Adding a **kitchen** also adds a basic set of fixtures: slab, sink, tap, stove, chimney, fridge and washer.
   - Adding a **washroom** also adds a door, slab, basin, tap, toilet seat, shower and washer.
   - Bedrooms and halls are labeled areas, and furniture can be placed inside them.
   - **Duplicate** any element to make your own version. Duplicating a kitchen or washroom copies all its fixtures too.
   - You can move, rotate, edit or remove any of these, and add custom elements.
3. **Inventory**: add your own movable items (bed, sofa, table and so on) with their dimensions, then edit or delete them later.
4. **Fit**: place inventory items into the room, drag and rotate them, and check the result:
   - **PASS** means the item is inside the room and doesn't overlap anything.
   - **FAIL** means the item is outside the room, overlaps another item or a build element, or blocks an open door.

Other features:

- **2D / 3D views**: edit in the to-scale 2D plan, or switch to a 3D preview you can orbit around.
- **Doors** open and close, and the 2D plan shows each door's swing path.
- **Labels**: every item shows its dimensions on the plan, and compass directions (N/E/S/W) are shown around the room.

## Tech stack

- [Next.js](https://nextjs.org/) (App Router) + TypeScript
- Tailwind CSS
- SVG for the 2D planner
- [three.js](https://threejs.org/) with `@react-three/fiber` and `@react-three/drei` for the 3D view

## Running locally

### Frontend (Next.js)

You need Node.js 20 or newer.

```bash
cd web
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000). The page reloads automatically when you edit files.

To run a production build instead:

```bash
cd web
npm run build
npm run start
```

Other scripts (run from `web/`):

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start the development server on port 3000 |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

To use a different port, run `npm run dev -- -p 3001`.

### Backend

There is no backend yet. The frontend works on its own and saves everything in the browser's `localStorage`, so you only need to start the frontend.

The planned backend is a Go REST API with PostgreSQL (see [Roadmap](#roadmap)). Run instructions will be added here once a `services/api` folder exists.

## Project structure

```
MoveFit_Cursor_Blueprint.md   Product and architecture blueprint
web/                          Next.js app
  src/app/                    Layout, page, global styles
  src/components/planner/
    PlannerApp.tsx            State and step flow
    StepPanels.tsx            Room / Build / Inventory / Fit side panels
    RoomCanvas.tsx            2D SVG plan
    RoomView3D.tsx            3D preview
  src/lib/
    types.ts                  Data types and build-element presets
    geometry.ts               Collision checks, rotation, door swing
    presets.ts                Room components, duplicate, apartment layouts
    storage.ts                localStorage persistence
```

## Units and geometry

- All dimensions are in **centimeters**.
- Rotation is limited to 90° steps (0, 90, 180, 270), so collision checks use simple axis-aligned rectangles.
- Planner data is stored in `localStorage` under the key `movefit-planner-v4`. To start over, use **Reset demo data** in the Fit step or clear site data in your browser.

## Roadmap

See [`MoveFit_Cursor_Blueprint.md`](MoveFit_Cursor_Blueprint.md) for the full plan. Planned next steps include:

- A Go REST API with PostgreSQL
- Authentication with customer, owner and admin roles
- Property listings, search and a shortlist
- Multi-room properties
- Owner-uploaded measurements, photos and video

Deferred until later: credits and payments, AR and 3D scanning, and irregular room shapes.
