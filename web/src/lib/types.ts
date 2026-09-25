export type Rotation = 0 | 90 | 180 | 270;

export type FitStatus = "PASS" | "FAIL";

export type PlannerStep = "room" | "build" | "inventory" | "fit";

export type ViewMode = "2d" | "3d";

/** Room structure + built-in fixtures (not user inventory). */
export type FixedKind =
  | "door"
  | "window"
  | "balcony"
  | "kitchen"
  | "washroom"
  | "wardrobe"
  | "pillar"
  | "other"
  | "kitchen_sink"
  | "kitchen_stove"
  | "kitchen_chimney"
  | "kitchen_counter"
  | "kitchen_fridge"
  | "kitchen_slab"
  | "kitchen_tap"
  | "kitchen_washer"
  | "washroom_toilet"
  | "washroom_basin"
  | "washroom_shower"
  | "washroom_tap"
  | "washroom_washer"
  | "washroom_slab"
  | "washroom_door";

export interface Thing {
  id: string;
  name: string;
  lengthCm: number;
  widthCm: number;
}

export interface Placement {
  id: string;
  thingId: string;
  xCm: number;
  yCm: number;
  rotation: Rotation;
}

export interface FixedObject {
  id: string;
  kind: FixedKind;
  name: string;
  lengthCm: number;
  widthCm: number;
  xCm: number;
  yCm: number;
  rotation: Rotation;
  /** Doors (and similar) can swing open into the room */
  isOpen?: boolean;
  /** Optional parent structure (e.g. kitchen id for a stove) */
  parentId?: string;
}

export interface Room {
  lengthCm: number;
  widthCm: number;
  name: string;
  /** Which edge of the plan faces north */
  northSide: "top" | "right" | "bottom" | "left";
}

export type CompassSide = Room["northSide"];
export type Cardinal = "N" | "E" | "S" | "W";

export const NORTH_SIDE_LABELS: Record<CompassSide, string> = {
  top: "Top of plan",
  right: "Right of plan",
  bottom: "Bottom of plan",
  left: "Left of plan",
};

/** Map each plan edge to a cardinal direction given which edge is north. */
export function compassLabels(
  northSide: CompassSide,
): Record<CompassSide, Cardinal> {
  const sides: CompassSide[] = ["top", "right", "bottom", "left"];
  const cards: Cardinal[] = ["N", "E", "S", "W"];
  const start = sides.indexOf(northSide);
  const result = {} as Record<CompassSide, Cardinal>;
  sides.forEach((side, i) => {
    result[side] = cards[(i - start + 4) % 4];
  });
  return result;
}

export interface PlannerState {
  room: Room;
  fixedObjects: FixedObject[];
  things: Thing[];
  placements: Placement[];
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface EvaluatedPlacement extends Placement {
  status: FitStatus;
  reasons: string[];
  footprint: Box;
}

export type Selection =
  | { type: "fixed"; id: string }
  | { type: "furniture"; id: string }
  | null;

export const FIXED_KIND_DEFAULTS: Record<
  FixedKind,
  { name: string; lengthCm: number; widthCm: number }
> = {
  door: { name: "Door", lengthCm: 90, widthCm: 20 },
  window: { name: "Window", lengthCm: 120, widthCm: 20 },
  balcony: { name: "Balcony", lengthCm: 150, widthCm: 40 },
  kitchen: { name: "Kitchen", lengthCm: 280, widthCm: 180 },
  washroom: { name: "Washroom", lengthCm: 180, widthCm: 150 },
  wardrobe: { name: "Built-in wardrobe", lengthCm: 180, widthCm: 60 },
  pillar: { name: "Pillar", lengthCm: 40, widthCm: 40 },
  other: { name: "Custom build element", lengthCm: 60, widthCm: 50 },
  kitchen_sink: { name: "Sink", lengthCm: 60, widthCm: 50 },
  kitchen_stove: { name: "Stove", lengthCm: 60, widthCm: 60 },
  kitchen_chimney: { name: "Chimney", lengthCm: 70, widthCm: 40 },
  kitchen_counter: { name: "Counter", lengthCm: 150, widthCm: 60 },
  kitchen_fridge: { name: "Fridge", lengthCm: 70, widthCm: 70 },
  kitchen_slab: { name: "Slab", lengthCm: 200, widthCm: 60 },
  kitchen_tap: { name: "Tap", lengthCm: 15, widthCm: 15 },
  kitchen_washer: { name: "Washer", lengthCm: 60, widthCm: 60 },
  washroom_toilet: { name: "Toilet seat", lengthCm: 70, widthCm: 45 },
  washroom_basin: { name: "Basin", lengthCm: 55, widthCm: 40 },
  washroom_shower: { name: "Shower", lengthCm: 90, widthCm: 90 },
  washroom_tap: { name: "Tap", lengthCm: 12, widthCm: 12 },
  washroom_washer: { name: "Washer", lengthCm: 60, widthCm: 60 },
  washroom_slab: { name: "Slab", lengthCm: 120, widthCm: 50 },
  washroom_door: { name: "Washroom door", lengthCm: 80, widthCm: 20 },
};

export const FIXED_KIND_LABELS: Record<FixedKind, string> = {
  door: "Door",
  window: "Window",
  balcony: "Balcony",
  kitchen: "Kitchen",
  washroom: "Washroom",
  wardrobe: "Built-in wardrobe",
  pillar: "Pillar",
  other: "Custom",
  kitchen_sink: "Sink",
  kitchen_stove: "Stove",
  kitchen_chimney: "Chimney",
  kitchen_counter: "Counter",
  kitchen_fridge: "Fridge",
  kitchen_slab: "Slab",
  kitchen_tap: "Tap",
  kitchen_washer: "Washer",
  washroom_toilet: "Toilet seat",
  washroom_basin: "Basin",
  washroom_shower: "Shower",
  washroom_tap: "Tap",
  washroom_washer: "Washer",
  washroom_slab: "Slab",
  washroom_door: "Door",
};

/** Main room structures (owner places these first). */
export const BUILD_STRUCTURE_KINDS: FixedKind[] = [
  "door",
  "window",
  "balcony",
  "kitchen",
  "washroom",
  "wardrobe",
  "pillar",
  "other",
];

export const KITCHEN_ELEMENT_KINDS: FixedKind[] = [
  "kitchen_slab",
  "kitchen_sink",
  "kitchen_tap",
  "kitchen_stove",
  "kitchen_chimney",
  "kitchen_counter",
  "kitchen_fridge",
  "kitchen_washer",
];

export const WASHROOM_ELEMENT_KINDS: FixedKind[] = [
  "washroom_door",
  "washroom_slab",
  "washroom_toilet",
  "washroom_basin",
  "washroom_tap",
  "washroom_shower",
  "washroom_washer",
];

/** Offset from parent top-left when auto-seeding a kitchen/washroom. */
export const KITCHEN_STARTER_LAYOUT: {
  kind: FixedKind;
  ox: number;
  oy: number;
}[] = [
  { kind: "kitchen_slab", ox: 0, oy: 0 },
  { kind: "kitchen_sink", ox: 20, oy: 5 },
  { kind: "kitchen_tap", ox: 40, oy: 0 },
  { kind: "kitchen_stove", ox: 100, oy: 0 },
  { kind: "kitchen_chimney", ox: 95, oy: -5 },
  { kind: "kitchen_fridge", ox: 200, oy: 10 },
  { kind: "kitchen_washer", ox: 200, oy: 100 },
];

export const WASHROOM_STARTER_LAYOUT: {
  kind: FixedKind;
  ox: number;
  oy: number;
}[] = [
  { kind: "washroom_door", ox: 50, oy: 130 },
  { kind: "washroom_slab", ox: 0, oy: 0 },
  { kind: "washroom_basin", ox: 10, oy: 5 },
  { kind: "washroom_tap", ox: 28, oy: 0 },
  { kind: "washroom_toilet", ox: 110, oy: 20 },
  { kind: "washroom_shower", ox: 0, oy: 55 },
  { kind: "washroom_washer", ox: 110, oy: 80 },
];

export function isKitchenElement(kind: FixedKind) {
  return KITCHEN_ELEMENT_KINDS.includes(kind);
}

export function isWashroomElement(kind: FixedKind) {
  return WASHROOM_ELEMENT_KINDS.includes(kind);
}

export function isNestedBuildElement(kind: FixedKind) {
  return isKitchenElement(kind) || isWashroomElement(kind);
}

export function parentStructureKind(
  kind: FixedKind,
): "kitchen" | "washroom" | null {
  if (isKitchenElement(kind)) return "kitchen";
  if (isWashroomElement(kind)) return "washroom";
  return null;
}

export function starterLayoutFor(
  kind: FixedKind,
): { kind: FixedKind; ox: number; oy: number }[] {
  if (kind === "kitchen") return KITCHEN_STARTER_LAYOUT;
  if (kind === "washroom") return WASHROOM_STARTER_LAYOUT;
  return [];
}
