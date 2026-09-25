import type { PlannerState } from "./types";

const STORAGE_KEY = "movefit-planner-v4";

export const defaultPlannerState = (): PlannerState => ({
  room: {
    name: "Living room",
    lengthCm: 420,
    widthCm: 350,
    northSide: "top",
  },
  fixedObjects: [
    {
      id: "fixed-door",
      kind: "door",
      name: "Door",
      lengthCm: 90,
      widthCm: 20,
      xCm: 165,
      yCm: 330,
      rotation: 0,
      isOpen: false,
    },
    {
      id: "fixed-window",
      kind: "window",
      name: "Window",
      lengthCm: 120,
      widthCm: 20,
      xCm: 150,
      yCm: 0,
      rotation: 0,
    },
    {
      id: "fixed-kitchen",
      kind: "kitchen",
      name: "Kitchen",
      lengthCm: 200,
      widthCm: 60,
      xCm: 0,
      yCm: 0,
      rotation: 90,
    },
  ],
  things: [],
  placements: [],
});

function normalize(raw: unknown): PlannerState | null {
  if (!raw || typeof raw !== "object") return null;
  const parsed = raw as Partial<PlannerState>;
  if (
    !parsed.room?.lengthCm ||
    !parsed.room?.widthCm ||
    !Array.isArray(parsed.things) ||
    !Array.isArray(parsed.placements)
  ) {
    return null;
  }
  return {
    room: {
      name: parsed.room.name?.trim() || "Room",
      lengthCm: parsed.room.lengthCm,
      widthCm: parsed.room.widthCm,
      northSide:
        parsed.room.northSide === "right" ||
        parsed.room.northSide === "bottom" ||
        parsed.room.northSide === "left"
          ? parsed.room.northSide
          : "top",
    },
    fixedObjects: Array.isArray(parsed.fixedObjects)
      ? parsed.fixedObjects
      : [],
    things: parsed.things,
    placements: parsed.placements,
  };
}

export function loadPlannerState(): PlannerState {
  if (typeof window === "undefined") return defaultPlannerState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const normalized = normalize(JSON.parse(raw));
      if (normalized) return normalized;
    }
    // Keep room/build elements from older saves, but drop old inventory.
    for (const key of [
      "movefit-planner-v3",
      "movefit-planner-v2",
      "movefit-planner-v1",
    ]) {
      const legacy = window.localStorage.getItem(key);
      if (!legacy) continue;
      const normalized = normalize(JSON.parse(legacy));
      if (normalized) {
        return {
          ...normalized,
          things: [],
          placements: [],
        };
      }
    }
    return defaultPlannerState();
  } catch {
    return defaultPlannerState();
  }
}

export function savePlannerState(state: PlannerState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
