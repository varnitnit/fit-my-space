"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  clampFixed,
  clampPlacement,
  canToggleOpen,
  evaluatePlacements,
  nextRotation,
} from "@/lib/geometry";
import {
  defaultPlannerState,
  loadPlannerState,
  savePlannerState,
} from "@/lib/storage";
import type {
  FixedKind,
  FixedObject,
  Placement,
  PlannerState,
  PlannerStep,
  Room,
  Rotation,
  Selection,
  Thing,
  ViewMode,
} from "@/lib/types";
import { FIXED_KIND_DEFAULTS, NORTH_SIDE_LABELS, starterLayoutFor } from "@/lib/types";
import dynamic from "next/dynamic";
import { RoomCanvas } from "./RoomCanvas";
import {
  FitStepPanel,
  InventoryStepPanel,
  RoomStepPanel,
  BuildStepPanel,
} from "./StepPanels";

const RoomView3D = dynamic(
  () => import("./RoomView3D").then((m) => m.RoomView3D),
  {
    ssr: false,
    loading: () => (
      <div className="canvas-wrap view-3d-wrap view-3d-loading">
        <p>Loading 3D view…</p>
      </div>
    ),
  },
);

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

const STEPS: { id: PlannerStep; label: string; blurb: string }[] = [
  { id: "room", label: "1. Room", blurb: "Size + north" },
  { id: "build", label: "2. Build", blurb: "Kitchen, doors…" },
  { id: "inventory", label: "3. Inventory", blurb: "Your furniture" },
  { id: "fit", label: "4. Fit", blurb: "Place & check" },
];

export function PlannerApp() {
  const [state, setState] = useState<PlannerState>(defaultPlannerState);
  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState<PlannerStep>("room");
  const [viewMode, setViewMode] = useState<ViewMode>("2d");
  const [selection, setSelection] = useState<Selection>(null);
  const skipSave = useRef(true);

  useEffect(() => {
    setState(loadPlannerState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    savePlannerState(state);
  }, [state, hydrated]);

  const thingsById = useMemo(
    () => new Map(state.things.map((t) => [t.id, t])),
    [state.things],
  );

  const evaluated = useMemo(
    () =>
      evaluatePlacements(
        state.room,
        state.things,
        state.placements,
        state.fixedObjects,
      ),
    [state.room, state.things, state.placements, state.fixedObjects],
  );

  const passCount = evaluated.filter((e) => e.status === "PASS").length;
  const failCount = evaluated.length - passCount;

  function updateRoom(input: {
    name: string;
    lengthCm: number;
    widthCm: number;
    northSide: Room["northSide"];
  }) {
    setState((prev) => {
      const room = {
        name: input.name.trim() || "Room",
        lengthCm: Math.max(100, input.lengthCm),
        widthCm: Math.max(100, input.widthCm),
        northSide: input.northSide,
      };
      return {
        ...prev,
        room,
        fixedObjects: prev.fixedObjects.map((f) => clampFixed(f, room)),
        placements: prev.placements.map((p) => {
          const thing = prev.things.find((t) => t.id === p.thingId);
          if (!thing) return p;
          return clampPlacement(thing, p, room);
        }),
      };
    });
  }

  function addFixed(kind: FixedKind, parentId?: string) {
    const defaults = FIXED_KIND_DEFAULTS[kind];
    const parent = parentId
      ? state.fixedObjects.find((f) => f.id === parentId)
      : undefined;
    const parentFixed = parent
      ? parent
      : undefined;

    const mainId = uid("fixed");
    const mainDraft: FixedObject = {
      id: mainId,
      kind,
      name: defaults.name,
      lengthCm: defaults.lengthCm,
      widthCm: defaults.widthCm,
      xCm: parentFixed ? parentFixed.xCm + 10 : 20,
      yCm: parentFixed ? parentFixed.yCm + 10 : 20,
      rotation: 0,
      isOpen: false,
      parentId,
    };
    const main = clampFixed(mainDraft, state.room);

    const seeded: FixedObject[] = [main];
    if (!parentId) {
      for (const item of starterLayoutFor(kind)) {
        const childDefaults = FIXED_KIND_DEFAULTS[item.kind];
        const childDraft: FixedObject = {
          id: uid("fixed"),
          kind: item.kind,
          name: childDefaults.name,
          lengthCm: childDefaults.lengthCm,
          widthCm: childDefaults.widthCm,
          xCm: main.xCm + item.ox,
          yCm: main.yCm + item.oy,
          rotation: 0,
          isOpen: item.kind === "washroom_door" ? false : undefined,
          parentId: mainId,
        };
        seeded.push(clampFixed(childDraft, state.room));
      }
    }

    setState((prev) => ({
      ...prev,
      fixedObjects: [...prev.fixedObjects, ...seeded],
    }));
    setSelection({ type: "fixed", id: mainId });
  }

  function addCustomBuildElement(
    parentId: string,
    input: { name: string; lengthCm: number; widthCm: number },
  ) {
    const parent = state.fixedObjects.find((f) => f.id === parentId);
    const draft: FixedObject = {
      id: uid("fixed"),
      kind: "other",
      name: input.name.trim() || "Custom element",
      lengthCm: Math.max(10, input.lengthCm),
      widthCm: Math.max(10, input.widthCm),
      xCm: parent ? parent.xCm + 15 : 30,
      yCm: parent ? parent.yCm + 15 : 30,
      rotation: 0,
      parentId,
    };
    const fixed = clampFixed(draft, state.room);
    setState((prev) => ({
      ...prev,
      fixedObjects: [...prev.fixedObjects, fixed],
    }));
    setSelection({ type: "fixed", id: fixed.id });
  }

  function updateFixed(
    id: string,
    input: Pick<FixedObject, "name" | "lengthCm" | "widthCm" | "kind">,
  ) {
    setState((prev) => ({
      ...prev,
      fixedObjects: prev.fixedObjects.map((f) => {
        if (f.id !== id) return f;
        return clampFixed(
          {
            ...f,
            kind: input.kind,
            name: input.name.trim() || FIXED_KIND_DEFAULTS[input.kind].name,
            lengthCm: Math.max(10, input.lengthCm),
            widthCm: Math.max(10, input.widthCm),
          },
          prev.room,
        );
      }),
    }));
  }

  function removeFixed(id: string) {
    setState((prev) => ({
      ...prev,
      fixedObjects: prev.fixedObjects.filter(
        (f) => f.id !== id && f.parentId !== id,
      ),
    }));
    setSelection((cur) =>
      cur?.type === "fixed" && cur.id === id ? null : cur,
    );
  }

  function moveFixed(id: string, xCm: number, yCm: number) {
    setState((prev) => ({
      ...prev,
      fixedObjects: prev.fixedObjects.map((f) =>
        f.id === id ? { ...f, xCm, yCm } : f,
      ),
    }));
  }

  function rotateFixed(id: string) {
    setState((prev) => ({
      ...prev,
      fixedObjects: prev.fixedObjects.map((f) => {
        if (f.id !== id) return f;
        return clampFixed(
          { ...f, rotation: nextRotation(f.rotation) as Rotation },
          prev.room,
        );
      }),
    }));
  }

  function toggleFixedOpen(id: string) {
    setState((prev) => ({
      ...prev,
      fixedObjects: prev.fixedObjects.map((f) => {
        if (f.id !== id || !canToggleOpen(f)) return f;
        return { ...f, isOpen: !f.isOpen };
      }),
    }));
  }

  function addThing(input: Omit<Thing, "id">) {
    const thing: Thing = {
      id: uid("thing"),
      name: input.name.trim() || "Item",
      lengthCm: Math.max(10, input.lengthCm),
      widthCm: Math.max(10, input.widthCm),
    };
    setState((prev) => ({ ...prev, things: [...prev.things, thing] }));
  }

  function updateThing(thingId: string, input: Omit<Thing, "id">) {
    setState((prev) => {
      const things = prev.things.map((t) =>
        t.id === thingId
          ? {
              ...t,
              name: input.name.trim() || "Item",
              lengthCm: Math.max(10, input.lengthCm),
              widthCm: Math.max(10, input.widthCm),
            }
          : t,
      );
      const updated = things.find((t) => t.id === thingId);
      const placements = prev.placements.map((p) => {
        if (p.thingId !== thingId || !updated) return p;
        return clampPlacement(updated, p, prev.room);
      });
      return { ...prev, things, placements };
    });
  }

  function removeThing(thingId: string) {
    setState((prev) => ({
      ...prev,
      things: prev.things.filter((t) => t.id !== thingId),
      placements: prev.placements.filter((p) => p.thingId !== thingId),
    }));
    setSelection((cur) => {
      if (cur?.type !== "furniture") return cur;
      const placement = state.placements.find((p) => p.id === cur.id);
      if (placement?.thingId === thingId) return null;
      return cur;
    });
  }

  function placeThing(thingId: string) {
    const thing = thingsById.get(thingId);
    if (!thing) return;
    const already = state.placements.find((p) => p.thingId === thingId);
    if (already) {
      setSelection({ type: "furniture", id: already.id });
      return;
    }
    const placement: Placement = {
      id: uid("place"),
      thingId,
      xCm: 40,
      yCm: 40,
      rotation: 0,
    };
    const clamped = clampPlacement(thing, placement, state.room);
    setState((prev) => ({
      ...prev,
      placements: [...prev.placements, clamped],
    }));
    setSelection({ type: "furniture", id: clamped.id });
  }

  function moveFurniture(id: string, xCm: number, yCm: number) {
    setState((prev) => ({
      ...prev,
      placements: prev.placements.map((p) =>
        p.id === id ? { ...p, xCm, yCm } : p,
      ),
    }));
  }

  function rotateFurniture(id: string) {
    setState((prev) => ({
      ...prev,
      placements: prev.placements.map((p) => {
        if (p.id !== id) return p;
        const thing = prev.things.find((t) => t.id === p.thingId);
        if (!thing) return p;
        return clampPlacement(
          thing,
          { ...p, rotation: nextRotation(p.rotation) as Rotation },
          prev.room,
        );
      }),
    }));
  }

  function deleteFurniture(id: string) {
    setState((prev) => ({
      ...prev,
      placements: prev.placements.filter((p) => p.id !== id),
    }));
    setSelection((cur) =>
      cur?.type === "furniture" && cur.id === id ? null : cur,
    );
  }

  function clearFurniture() {
    setState((prev) => ({ ...prev, placements: [] }));
    setSelection((cur) => (cur?.type === "furniture" ? null : cur));
  }

  function clearInventory() {
    setState((prev) => ({ ...prev, things: [], placements: [] }));
    setSelection((cur) => (cur?.type === "furniture" ? null : cur));
  }

  function resetDemo() {
    const next = defaultPlannerState();
    setState(next);
    setSelection(null);
    setStep("room");
    savePlannerState(next);
  }

  const selectedFixed =
    selection?.type === "fixed"
      ? state.fixedObjects.find((f) => f.id === selection.id) ?? null
      : null;
  const selectedEval =
    selection?.type === "furniture"
      ? evaluated.find((e) => e.id === selection.id) ?? null
      : null;
  const selectedThing = selectedEval
    ? thingsById.get(selectedEval.thingId) ?? null
    : null;

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="planner">
      <header className="planner-header">
        <div>
          <p className="brand">MoveFit</p>
          <h1>Room → Build → Inventory → Fit</h1>
          <p className="subtitle">
            Build elements stay with the room. Inventory is your movable stuff.
          </p>
        </div>
        {step === "fit" && (
          <div className="header-stats">
            <span className="stat pass">{passCount} pass</span>
            <span className="stat fail">{failCount} fail</span>
          </div>
        )}
      </header>

      <nav className="step-nav" aria-label="Planner steps">
        {STEPS.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={`step-tab ${step === item.id ? "active" : ""} ${index < stepIndex ? "done" : ""}`}
            onClick={() => {
              setStep(item.id);
              setSelection(null);
            }}
          >
            <strong>{item.label}</strong>
            <span>{item.blurb}</span>
          </button>
        ))}
      </nav>

      <div className="planner-grid">
        {step === "room" && (
          <RoomStepPanel room={state.room} onRoomChange={updateRoom} />
        )}
        {step === "build" && (
          <BuildStepPanel
            fixedObjects={state.fixedObjects}
            onAddFixed={addFixed}
            onAddCustom={addCustomBuildElement}
            onUpdateFixed={updateFixed}
            onSelectFixed={(id) => setSelection({ type: "fixed", id })}
            selectedFixedId={selectedFixed?.id ?? null}
          />
        )}
        {step === "inventory" && (
          <InventoryStepPanel
            things={state.things}
            placements={state.placements}
            onAddThing={addThing}
            onUpdateThing={updateThing}
            onRemoveThing={removeThing}
            onClearInventory={clearInventory}
          />
        )}
        {step === "fit" && (
          <FitStepPanel
            things={state.things}
            placements={state.placements}
            evaluated={evaluated}
            onPlaceThing={placeThing}
            onClearFurniture={clearFurniture}
            onResetDemo={resetDemo}
          />
        )}

        <section className="canvas-panel">
          <div className="view-tabs" role="tablist" aria-label="Room view">
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "2d"}
              className={viewMode === "2d" ? "active" : ""}
              onClick={() => setViewMode("2d")}
            >
              2D
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "3d"}
              className={viewMode === "3d" ? "active" : ""}
              onClick={() => {
                setViewMode("3d");
                setSelection(null);
              }}
            >
              3D
            </button>
          </div>

          <div className="canvas-toolbar">
            <p>
              {state.room.name} · {state.room.lengthCm} × {state.room.widthCm}{" "}
              cm · North:{" "}
              {NORTH_SIDE_LABELS[state.room.northSide ?? "top"]}
            </p>
            {viewMode === "2d" && selectedFixed && step === "build" ? (
              <div className="selection-actions">
                <span>{selectedFixed.name}</span>
                {canToggleOpen(selectedFixed) && (
                  <button
                    type="button"
                    onClick={() => toggleFixedOpen(selectedFixed.id)}
                  >
                    {selectedFixed.isOpen ? "Close" : "Open"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => rotateFixed(selectedFixed.id)}
                >
                  Rotate 90°
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => removeFixed(selectedFixed.id)}
                >
                  Remove from room
                </button>
              </div>
            ) : viewMode === "2d" &&
              selectedFixed &&
              canToggleOpen(selectedFixed) &&
              step === "fit" ? (
              <div className="selection-actions">
                <span>
                  {selectedFixed.name} ·{" "}
                  {selectedFixed.isOpen ? "open" : "closed"}
                </span>
                <button
                  type="button"
                  onClick={() => toggleFixedOpen(selectedFixed.id)}
                >
                  {selectedFixed.isOpen ? "Close door" : "Open door"}
                </button>
              </div>
            ) : viewMode === "2d" &&
              selectedEval &&
              selectedThing &&
              step === "fit" ? (
              <div className="selection-actions">
                <span>{selectedThing.name}</span>
                <button
                  type="button"
                  onClick={() => rotateFurniture(selectedEval.id)}
                >
                  Rotate 90°
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => deleteFurniture(selectedEval.id)}
                >
                  Remove from room
                </button>
              </div>
            ) : (
              <p className="hint">
                {viewMode === "3d"
                  ? "3D preview of the same room — edit layout in 2D"
                  : step === "room"
                    ? "Set room size, then continue to Build elements"
                    : step === "build"
                      ? "Add kitchen/doors and fixtures — select on plan to edit"
                      : step === "inventory"
                        ? "Add your movable furniture only"
                        : "Place inventory — click door to open/close"}
              </p>
            )}
          </div>

          {viewMode === "2d" ? (
            <RoomCanvas
              room={state.room}
              fixedObjects={state.fixedObjects}
              thingsById={thingsById}
              evaluated={
                step === "inventory" || step === "room" ? [] : evaluated
              }
              selection={selection}
              step={step}
              onSelect={setSelection}
              onMoveFixed={moveFixed}
              onMoveFurniture={moveFurniture}
            />
          ) : (
            <RoomView3D
              room={state.room}
              fixedObjects={state.fixedObjects}
              thingsById={thingsById}
              evaluated={
                step === "inventory" || step === "room" ? [] : evaluated
              }
              onToggleOpen={toggleFixedOpen}
            />
          )}

          {viewMode === "2d" && step === "fit" && selectedEval && (
            <ul className="reason-list">
              <li className={selectedEval.status === "PASS" ? "ok" : "bad"}>
                {selectedEval.status}
                {selectedEval.reasons.length > 0
                  ? ` — ${selectedEval.reasons.join("; ")}`
                  : " — fits in room"}
              </li>
            </ul>
          )}

          <div className="step-footer">
            {stepIndex > 0 && (
              <button
                type="button"
                className="ghost"
                onClick={() => {
                  setStep(STEPS[stepIndex - 1].id);
                  setSelection(null);
                }}
              >
                Back
              </button>
            )}
            {stepIndex < STEPS.length - 1 && (
              <button
                type="button"
                onClick={() => {
                  setStep(STEPS[stepIndex + 1].id);
                  setSelection(null);
                }}
              >
                Continue
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
