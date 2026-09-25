import type {
  Box,
  EvaluatedPlacement,
  FitStatus,
  FixedObject,
  Placement,
  Room,
  Rotation,
  Thing,
} from "./types";

export function footprintSize(
  lengthCm: number,
  widthCm: number,
  rotation: Rotation,
): { w: number; h: number } {
  const quarterTurns = rotation / 90;
  if (quarterTurns % 2 === 1) {
    return { w: widthCm, h: lengthCm };
  }
  return { w: lengthCm, h: widthCm };
}

export function sizedFootprint(
  lengthCm: number,
  widthCm: number,
  xCm: number,
  yCm: number,
  rotation: Rotation,
): Box {
  const { w, h } = footprintSize(lengthCm, widthCm, rotation);
  return { x: xCm, y: yCm, w, h };
}

export function placementFootprint(
  thing: Thing,
  placement: Pick<Placement, "xCm" | "yCm" | "rotation">,
) {
  return sizedFootprint(
    thing.lengthCm,
    thing.widthCm,
    placement.xCm,
    placement.yCm,
    placement.rotation,
  );
}

export function nextRotation(rotation: Rotation): Rotation {
  return ((rotation + 90) % 360) as Rotation;
}

export function fixedFootprint(fixed: FixedObject): Box {
  const rotation =
    (fixed.kind === "door" ||
      fixed.kind === "balcony" ||
      fixed.kind === "washroom_door") &&
    fixed.isOpen
      ? nextRotation(fixed.rotation)
      : fixed.rotation;
  return sizedFootprint(
    fixed.lengthCm,
    fixed.widthCm,
    fixed.xCm,
    fixed.yCm,
    rotation,
  );
}

export function canToggleOpen(fixed: FixedObject): boolean {
  return (
    fixed.kind === "door" ||
    fixed.kind === "balcony" ||
    fixed.kind === "washroom_door"
  );
}

/** Closed footprint (ignores open state) — used for hinge / swing path. */
export function closedFixedFootprint(fixed: FixedObject): Box {
  return sizedFootprint(
    fixed.lengthCm,
    fixed.widthCm,
    fixed.xCm,
    fixed.yCm,
    fixed.rotation,
  );
}

function polarFromHinge(
  hx: number,
  hy: number,
  radius: number,
  degrees: number,
) {
  const rad = (degrees * Math.PI) / 180;
  return {
    x: hx + radius * Math.cos(rad),
    y: hy + radius * Math.sin(rad),
  };
}

/**
 * 90° door swing path in room coordinates (hinge = closed top-left).
 * SVG y grows downward, so rotation 0 = +x, 90 = +y.
 */
export function doorSwingGeometry(fixed: FixedObject): {
  hinge: { x: number; y: number };
  radius: number;
  closedTip: { x: number; y: number };
  openTip: { x: number; y: number };
  arcD: string;
  sectorD: string;
} | null {
  if (!canToggleOpen(fixed)) return null;

  const hx = fixed.xCm;
  const hy = fixed.yCm;
  const radius = Math.max(fixed.lengthCm, 10);
  const closedAngle = fixed.rotation;
  const openAngle = fixed.rotation + 90;
  const closedTip = polarFromHinge(hx, hy, radius, closedAngle);
  const openTip = polarFromHinge(hx, hy, radius, openAngle);

  // sweep-flag 1 = clockwise in SVG (matches closed → open for our angles)
  const arcD = `M ${closedTip.x} ${closedTip.y} A ${radius} ${radius} 0 0 1 ${openTip.x} ${openTip.y}`;
  const sectorD = `M ${hx} ${hy} L ${closedTip.x} ${closedTip.y} A ${radius} ${radius} 0 0 1 ${openTip.x} ${openTip.y} Z`;

  return { hinge: { x: hx, y: hy }, radius, closedTip, openTip, arcD, sectorD };
}

export function aabbOverlap(a: Box, b: Box): boolean {
  return !(
    a.x + a.w <= b.x ||
    b.x + b.w <= a.x ||
    a.y + a.h <= b.y ||
    b.y + b.h <= a.y
  );
}

export function insideRoom(box: Box, room: Room): boolean {
  return (
    box.x >= 0 &&
    box.y >= 0 &&
    box.x + box.w <= room.lengthCm &&
    box.y + box.h <= room.widthCm
  );
}

export function clampBox(
  lengthCm: number,
  widthCm: number,
  xCm: number,
  yCm: number,
  rotation: Rotation,
  room: Room,
): { xCm: number; yCm: number } {
  const { w, h } = footprintSize(lengthCm, widthCm, rotation);
  return {
    xCm: Math.min(Math.max(0, xCm), Math.max(0, room.lengthCm - w)),
    yCm: Math.min(Math.max(0, yCm), Math.max(0, room.widthCm - h)),
  };
}

export function clampPlacement(
  thing: Thing,
  placement: Placement,
  room: Room,
): Placement {
  const pos = clampBox(
    thing.lengthCm,
    thing.widthCm,
    placement.xCm,
    placement.yCm,
    placement.rotation,
    room,
  );
  return { ...placement, ...pos };
}

export function clampFixed(fixed: FixedObject, room: Room): FixedObject {
  const pos = clampBox(
    fixed.lengthCm,
    fixed.widthCm,
    fixed.xCm,
    fixed.yCm,
    fixed.rotation,
    room,
  );
  return { ...fixed, ...pos };
}

export function evaluatePlacements(
  room: Room,
  things: Thing[],
  placements: Placement[],
  fixedObjects: FixedObject[],
): EvaluatedPlacement[] {
  const byId = new Map(things.map((t) => [t.id, t]));
  const fixedBoxes = fixedObjects.map((f) => ({
    fixed: f,
    footprint: fixedFootprint(f),
  }));

  const footprints = placements.map((p) => {
    const thing = byId.get(p.thingId);
    if (!thing) {
      return {
        placement: p,
        footprint: { x: p.xCm, y: p.yCm, w: 0, h: 0 },
        thing: null as Thing | null,
      };
    }
    return {
      placement: p,
      footprint: placementFootprint(thing, p),
      thing,
    };
  });

  return footprints.map((entry, index) => {
    const reasons: string[] = [];
    if (!entry.thing) {
      reasons.push("Missing item");
    } else if (!insideRoom(entry.footprint, room)) {
      reasons.push("Outside room");
    }

    for (const fixed of fixedBoxes) {
      if (aabbOverlap(entry.footprint, fixed.footprint)) {
        reasons.push(`Overlaps ${fixed.fixed.name}`);
        break;
      }
    }

    for (let j = 0; j < footprints.length; j++) {
      if (j === index) continue;
      if (aabbOverlap(entry.footprint, footprints[j].footprint)) {
        const other = byId.get(footprints[j].placement.thingId);
        reasons.push(`Overlaps ${other?.name ?? "another item"}`);
        break;
      }
    }

    const status: FitStatus = reasons.length === 0 ? "PASS" : "FAIL";
    return {
      ...entry.placement,
      status,
      reasons,
      footprint: entry.footprint,
    };
  });
}
