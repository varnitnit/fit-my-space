import { clampFixed, fixedFootprint, footprintSize } from "./geometry";

function canToggleOpenKind(kind: FixedKind) {
  return kind === "door" || kind === "balcony" || kind === "washroom_door";
}
import type {
  FixedKind,
  FixedObject,
  Placement,
  Room,
  Rotation,
  Thing,
} from "./types";
import { FIXED_KIND_DEFAULTS, starterLayoutFor } from "./types";

export function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

type StructureOptions = {
  name?: string;
  lengthCm?: number;
  widthCm?: number;
  rotation?: Rotation;
  parentId?: string;
  /** Skip the starter fixtures for kitchen/washroom */
  bare?: boolean;
};

/** One structure, plus its starter fixtures when it is a kitchen or washroom. */
export function createStructure(
  kind: FixedKind,
  xCm: number,
  yCm: number,
  room: Room,
  options: StructureOptions = {},
): FixedObject[] {
  const defaults = FIXED_KIND_DEFAULTS[kind];
  const main = clampFixed(
    {
      id: uid("fixed"),
      kind,
      name: options.name ?? defaults.name,
      lengthCm: options.lengthCm ?? defaults.lengthCm,
      widthCm: options.widthCm ?? defaults.widthCm,
      xCm,
      yCm,
      rotation: options.rotation ?? 0,
      isOpen: false,
      parentId: options.parentId,
    },
    room,
  );

  if (options.parentId || options.bare) return [main];

  const mainBox = fixedFootprint(main);
  // The starter door is on the bottom edge; flip when that edge is an outer
  // wall so the door opens into the flat instead of outside it.
  const flipY =
    kind === "washroom" &&
    main.rotation === 0 &&
    mainBox.y > room.widthCm - (mainBox.y + mainBox.h);

  const children = starterLayoutFor(kind).map((item) => {
    const childDefaults = FIXED_KIND_DEFAULTS[item.kind];
    let rotation: Rotation = item.rotation ?? 0;
    let oy = item.oy;
    if (flipY) {
      const { h } = footprintSize(
        childDefaults.lengthCm,
        childDefaults.widthCm,
        rotation,
      );
      oy = mainBox.h - item.oy - h;
      if (!canToggleOpenKind(item.kind) && rotation % 180 === 0) {
        rotation = ((rotation + 180) % 360) as Rotation;
      }
    }
    return clampFixed(
      {
        id: uid("fixed"),
        kind: item.kind,
        name: childDefaults.name,
        lengthCm: childDefaults.lengthCm,
        widthCm: childDefaults.widthCm,
        xCm: main.xCm + item.ox,
        yCm: main.yCm + oy,
        rotation,
        isOpen: item.kind === "washroom_door" ? false : undefined,
        parentId: main.id,
      },
      room,
    );
  });

  return [main, ...children];
}

/** Copy a structure (and its fixtures) with a small offset so it is visible. */
export function duplicateStructure(
  fixedObjects: FixedObject[],
  id: string,
  room: Room,
): FixedObject[] {
  const source = fixedObjects.find((f) => f.id === id);
  if (!source) return [];
  const offset = 30;
  const copy = clampFixed(
    {
      ...source,
      id: uid("fixed"),
      name: `${source.name} copy`,
      xCm: source.xCm + offset,
      yCm: source.yCm + offset,
    },
    room,
  );
  const dx = copy.xCm - source.xCm;
  const dy = copy.yCm - source.yCm;
  const children = fixedObjects
    .filter((f) => f.parentId === id)
    .map((child) =>
      clampFixed(
        {
          ...child,
          id: uid("fixed"),
          xCm: child.xCm + dx,
          yCm: child.yCm + dy,
          parentId: copy.id,
        },
        room,
      ),
    );
  return [copy, ...children];
}

export type ApartmentPresetId = "1rk" | "1bhk" | "2bhk" | "3bhk";

export const APARTMENT_PRESETS: {
  id: ApartmentPresetId;
  label: string;
  blurb: string;
}[] = [
  { id: "1rk", label: "1 RK", blurb: "Room + kitchen + bath" },
  { id: "1bhk", label: "1 BHK", blurb: "Hall + 1 bedroom" },
  { id: "2bhk", label: "2 BHK", blurb: "Hall + 2 bedrooms" },
  { id: "3bhk", label: "3 BHK", blurb: "Hall + 3 bedrooms" },
];

type Spec = [FixedKind, number, number, StructureOptions?];

/** [name, length, width, x, y, rotation] */
type FurnitureSpec = [string, number, number, number, number, Rotation];

const BED_QUEEN = 200;
const SOFA_3: [number, number] = [210, 90];
const ALMIRAH_WOOD: [number, number] = [120, 60];
const ALMIRAH_STEEL: [number, number] = [90, 50];

/* Rotation cheat sheet (see Furniture3D):
   bed   0 = head left, 90 = head top, 180 = head right, 270 = head bottom
   sofa / almirah   0 = back on top wall, 90 = back right, 180 = back bottom, 270 = back left */
const PRESET_FURNITURE: Record<ApartmentPresetId, FurnitureSpec[]> = {
  "1rk": [
    ["Double bed", 190, 135, 0, 30, 0],
    ["3-seater sofa", ...SOFA_3, 0, 250, 270],
    ["Steel almirah", ...ALMIRAH_STEEL, 290, 0, 0],
  ],
  "1bhk": [
    ["3-seater sofa", ...SOFA_3, 0, 60, 270],
    ["Queen bed", BED_QUEEN, 150, 100, 360, 90],
    ["Wooden almirah", ...ALMIRAH_WOOD, 390, 480, 90],
  ],
  "2bhk": [
    ["3-seater sofa", ...SOFA_3, 280, 0, 0],
    ["Queen bed (Bedroom 1)", BED_QUEEN, 150, 40, 400, 90],
    ["Wooden almirah (Bedroom 1)", ...ALMIRAH_WOOD, 230, 640, 180],
    ["Double bed (Bedroom 2)", 190, 135, 810, 450, 180],
    ["Steel almirah (Bedroom 2)", ...ALMIRAH_STEEL, 640, 650, 180],
  ],
  "3bhk": [
    ["3-seater sofa", ...SOFA_3, 340, 0, 0],
    ["Queen bed (Bedroom 1)", BED_QUEEN, 150, 40, 400, 90],
    ["Wooden almirah (Bedroom 1)", ...ALMIRAH_WOOD, 230, 740, 180],
    ["Double bed (Bedroom 2)", 190, 135, 710, 560, 180],
    ["Steel almirah (Bedroom 2)", ...ALMIRAH_STEEL, 620, 500, 270],
    ["Single bed (Bedroom 3)", 190, 90, 900, 490, 0],
    ["Steel almirah (Bedroom 3)", ...ALMIRAH_STEEL, 1090, 400, 0],
  ],
};

const PRESET_SPECS: Record<
  ApartmentPresetId,
  { room: Room; items: Spec[] }
> = {
  "1rk": {
    room: { name: "1 RK", lengthCm: 740, widthCm: 480, northSide: "top" },
    items: [
      ["hall", 0, 0, { name: "Room", lengthCm: 400, widthCm: 480 }],
      ["hall", 400, 180, { name: "Passage", lengthCm: 340, widthCm: 120 }],
      ["hall", 620, 300, { name: "Entrance", lengthCm: 120, widthCm: 180 }],
      ["kitchen", 400, 0, { lengthCm: 340 }],
      ["washroom", 400, 300],
      ["door", 720, 340, { name: "Main door", rotation: 90 }],
      ["other", 705, 190, { name: "Shoe rack", lengthCm: 90, widthCm: 35, rotation: 90 }],
      ["window", 140, 0],
      ["balcony", 120, 440],
    ],
  },
  "1bhk": {
    room: { name: "1 BHK", lengthCm: 800, widthCm: 650, northSide: "top" },
    items: [
      ["hall", 0, 0, { lengthCm: 450, widthCm: 350 }],
      ["bedroom", 0, 350, { lengthCm: 450, widthCm: 300 }],
      ["hall", 450, 180, { name: "Passage", lengthCm: 220, widthCm: 290 }],
      ["hall", 670, 180, { name: "Entrance", lengthCm: 130, widthCm: 200 }],
      ["kitchen", 450, 0],
      ["washroom", 450, 470],
      ["door", 780, 280, { name: "Main door", rotation: 90 }],
      ["other", 765, 185, { name: "Shoe rack", lengthCm: 90, widthCm: 35, rotation: 90 }],
      ["door", 300, 340, { name: "Bedroom door" }],
      ["window", 150, 0],
      ["window", 0, 430, { rotation: 90 }],
      ["balcony", 100, 610],
    ],
  },
  "2bhk": {
    room: { name: "2 BHK", lengthCm: 1000, widthCm: 700, northSide: "top" },
    items: [
      ["hall", 0, 0, { lengthCm: 500, widthCm: 400 }],
      ["hall", 500, 180, { name: "Dining", lengthCm: 360, widthCm: 220 }],
      ["hall", 860, 180, { name: "Entrance", lengthCm: 140, widthCm: 220 }],
      ["other", 880, 360, { name: "Shoe rack", lengthCm: 90, widthCm: 35 }],
      ["bedroom", 0, 400, { name: "Bedroom 1", lengthCm: 400, widthCm: 300 }],
      ["bedroom", 620, 400, { name: "Bedroom 2", lengthCm: 380, widthCm: 300 }],
      ["kitchen", 500, 0],
      ["washroom", 780, 0, { name: "Common bath" }],
      ["washroom", 400, 520, { name: "Bath 2" }],
      ["door", 980, 250, { name: "Main door", rotation: 90 }],
      ["door", 250, 390, { name: "Bedroom 1 door" }],
      ["door", 700, 390, { name: "Bedroom 2 door" }],
      ["window", 150, 0],
      ["window", 0, 480, { rotation: 90 }],
      ["window", 750, 680],
      ["balcony", 0, 100, { rotation: 90 }],
    ],
  },
  "3bhk": {
    room: { name: "3 BHK", lengthCm: 1200, widthCm: 800, northSide: "top" },
    items: [
      ["hall", 0, 0, { lengthCm: 550, widthCm: 400 }],
      ["hall", 550, 180, { name: "Dining", lengthCm: 510, widthCm: 220 }],
      ["hall", 1060, 180, { name: "Entrance", lengthCm: 140, widthCm: 220 }],
      ["other", 1080, 360, { name: "Shoe rack", lengthCm: 90, widthCm: 35 }],
      ["bedroom", 0, 400, { name: "Bedroom 1", lengthCm: 400, widthCm: 400 }],
      ["bedroom", 620, 400, { name: "Bedroom 2", lengthCm: 280, widthCm: 400 }],
      ["bedroom", 900, 400, { name: "Bedroom 3", lengthCm: 300, widthCm: 400 }],
      ["kitchen", 550, 0],
      ["washroom", 980, 0, { name: "Common bath" }],
      ["washroom", 400, 620, { name: "Bath 2" }],
      ["washroom", 980, 620, { name: "Attached bath" }],
      ["door", 1180, 250, { name: "Main door", rotation: 90 }],
      ["door", 250, 390, { name: "Bedroom 1 door" }],
      ["door", 650, 390, { name: "Bedroom 2 door" }],
      ["door", 930, 390, { name: "Bedroom 3 door" }],
      ["window", 200, 0],
      ["window", 0, 550, { rotation: 90 }],
      ["window", 680, 780],
      ["window", 1180, 480, { rotation: 90 }],
      ["balcony", 0, 100, { rotation: 90 }],
    ],
  },
};

export function buildApartmentPreset(id: ApartmentPresetId): {
  room: Room;
  fixedObjects: FixedObject[];
  things: Thing[];
  placements: Placement[];
} {
  const spec = PRESET_SPECS[id];
  const room = { ...spec.room };
  const fixedObjects = spec.items.flatMap(([kind, x, y, options]) =>
    createStructure(kind, x, y, room, options),
  );
  const things: Thing[] = [];
  const placements: Placement[] = [];
  for (const [name, lengthCm, widthCm, xCm, yCm, rotation] of PRESET_FURNITURE[id]) {
    const thing: Thing = { id: uid("thing"), name, lengthCm, widthCm, preset: true };
    things.push(thing);
    placements.push({ id: uid("place"), thingId: thing.id, xCm, yCm, rotation });
  }
  return { room, fixedObjects, things, placements };
}
