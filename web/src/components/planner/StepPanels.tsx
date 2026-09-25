"use client";

import { FormEvent, useEffect, useState } from "react";
import type {
  CompassSide,
  EvaluatedPlacement,
  FixedKind,
  FixedObject,
  Placement,
  Room,
  Thing,
} from "@/lib/types";
import {
  BUILD_STRUCTURE_KINDS,
  FIXED_KIND_DEFAULTS,
  FIXED_KIND_LABELS,
  KITCHEN_ELEMENT_KINDS,
  NORTH_SIDE_LABELS,
  WASHROOM_ELEMENT_KINDS,
} from "@/lib/types";

type RoomStepProps = {
  room: Room;
  onRoomChange: (
    room: Pick<Room, "name" | "lengthCm" | "widthCm" | "northSide">,
  ) => void;
};

export function RoomStepPanel({ room, onRoomChange }: RoomStepProps) {
  const [name, setName] = useState(room.name);
  const [roomL, setRoomL] = useState(String(room.lengthCm));
  const [roomW, setRoomW] = useState(String(room.widthCm));
  const [northSide, setNorthSide] = useState<CompassSide>(room.northSide);

  useEffect(() => {
    setName(room.name);
    setRoomL(String(room.lengthCm));
    setRoomW(String(room.widthCm));
    setNorthSide(room.northSide);
  }, [room.name, room.lengthCm, room.widthCm, room.northSide]);

  function applyRoom(event: FormEvent) {
    event.preventDefault();
    onRoomChange({
      name: name.trim() || "Room",
      lengthCm: Number(roomL) || 100,
      widthCm: Number(roomW) || 100,
      northSide,
    });
  }

  return (
    <aside className="side-panel">
      <section>
        <h2>1. Room</h2>
        <p className="panel-note">
          Set the empty room size and which side faces north. Build elements
          come next.
        </p>
        <form className="form-grid" onSubmit={applyRoom}>
          <label className="full">
            Room name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label>
            Length (cm)
            <input
              type="number"
              min={100}
              value={roomL}
              onChange={(e) => setRoomL(e.target.value)}
            />
          </label>
          <label>
            Width (cm)
            <input
              type="number"
              min={100}
              value={roomW}
              onChange={(e) => setRoomW(e.target.value)}
            />
          </label>
          <label className="full">
            North faces
            <select
              value={northSide}
              onChange={(e) => setNorthSide(e.target.value as CompassSide)}
            >
              {(Object.keys(NORTH_SIDE_LABELS) as CompassSide[]).map((side) => (
                <option key={side} value={side}>
                  {NORTH_SIDE_LABELS[side]}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="full">
            Save room
          </button>
        </form>
      </section>
    </aside>
  );
}

type BuildStepProps = {
  fixedObjects: FixedObject[];
  onAddFixed: (kind: FixedKind, parentId?: string) => void;
  onAddCustom: (
    parentId: string,
    input: { name: string; lengthCm: number; widthCm: number },
  ) => void;
  onUpdateFixed: (
    id: string,
    input: Pick<FixedObject, "name" | "lengthCm" | "widthCm" | "kind">,
  ) => void;
  onSelectFixed: (id: string) => void;
  selectedFixedId: string | null;
};

export function BuildStepPanel({
  fixedObjects,
  onAddFixed,
  onAddCustom,
  onUpdateFixed,
  onSelectFixed,
  selectedFixedId,
}: BuildStepProps) {
  const [addKind, setAddKind] = useState<FixedKind>("door");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editL, setEditL] = useState("");
  const [editW, setEditW] = useState("");
  const [editKind, setEditKind] = useState<FixedKind>("other");
  const [customName, setCustomName] = useState("");
  const [customL, setCustomL] = useState("60");
  const [customW, setCustomW] = useState("50");

  const structures = fixedObjects.filter((f) => !f.parentId);
  const kitchens = structures.filter((f) => f.kind === "kitchen");
  const washrooms = structures.filter((f) => f.kind === "washroom");

  function childrenOf(parentId: string) {
    return fixedObjects.filter((f) => f.parentId === parentId);
  }

  function resolveKitchenId() {
    return (
      (selectedFixedId &&
        kitchens.find((k) => k.id === selectedFixedId)?.id) ||
      kitchens[0]?.id
    );
  }

  function resolveWashroomId() {
    return (
      (selectedFixedId &&
        washrooms.find((w) => w.id === selectedFixedId)?.id) ||
      washrooms[0]?.id
    );
  }

  function startEdit(fixed: FixedObject) {
    setEditingId(fixed.id);
    setEditName(fixed.name);
    setEditL(String(fixed.lengthCm));
    setEditW(String(fixed.widthCm));
    setEditKind(fixed.kind);
    onSelectFixed(fixed.id);
  }

  function saveEdit(event: FormEvent) {
    event.preventDefault();
    if (!editingId) return;
    onUpdateFixed(editingId, {
      name: editName,
      lengthCm: Number(editL) || 10,
      widthCm: Number(editW) || 10,
      kind: editKind,
    });
    setEditingId(null);
  }

  function submitCustom(event: FormEvent, parentId: string | undefined) {
    event.preventDefault();
    if (!parentId) return;
    onAddCustom(parentId, {
      name: customName,
      lengthCm: Number(customL) || 10,
      widthCm: Number(customW) || 10,
    });
    setCustomName("");
  }

  function renderItem(fixed: FixedObject, nested = false) {
    return (
      <li
        key={fixed.id}
        className={`${selectedFixedId === fixed.id || editingId === fixed.id ? "editing" : ""} ${nested ? "nested" : ""}`}
      >
        <div>
          <strong>{fixed.name}</strong>
          <span>
            {FIXED_KIND_LABELS[fixed.kind]} · {fixed.lengthCm} ×{" "}
            {fixed.widthCm} cm
            {(fixed.kind === "door" ||
              fixed.kind === "balcony" ||
              fixed.kind === "washroom_door") &&
              (fixed.isOpen ? " · open" : " · closed")}
          </span>
        </div>
        <div className="row-actions">
          <button type="button" onClick={() => onSelectFixed(fixed.id)}>
            Select
          </button>
          <button
            type="button"
            className="ghost"
            onClick={() => startEdit(fixed)}
          >
            Edit
          </button>
        </div>
      </li>
    );
  }

  return (
    <aside className="side-panel">
      <section>
        <h2>2. Build elements</h2>
        <p className="panel-note">
          Add a kitchen or washroom to load basic fixtures (sink, slab, taps,
          chimney, toilet seat, washer…). Move them on the plan or add more.
        </p>

        <h3 className="subhead">Room structures</h3>
        <div className="form-grid">
          <label className="full">
            Type
            <select
              value={addKind}
              onChange={(e) => setAddKind(e.target.value as FixedKind)}
            >
              {BUILD_STRUCTURE_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {FIXED_KIND_LABELS[kind]} (
                  {FIXED_KIND_DEFAULTS[kind].lengthCm}×
                  {FIXED_KIND_DEFAULTS[kind].widthCm} cm)
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="full"
            onClick={() => onAddFixed(addKind)}
          >
            Add {FIXED_KIND_LABELS[addKind]}
            {(addKind === "kitchen" || addKind === "washroom") &&
              " + basic set"}
          </button>
        </div>

        {kitchens.length > 0 && (
          <>
            <h3 className="subhead">Kitchen presets</h3>
            <div className="preset-chips">
              {KITCHEN_ELEMENT_KINDS.map((kind) => (
                <button
                  key={kind}
                  type="button"
                  className="chip"
                  onClick={() => {
                    const id = resolveKitchenId();
                    if (id) onAddFixed(kind, id);
                  }}
                >
                  {FIXED_KIND_LABELS[kind]}
                </button>
              ))}
            </div>
          </>
        )}

        {washrooms.length > 0 && (
          <>
            <h3 className="subhead">Washroom presets</h3>
            <div className="preset-chips">
              {WASHROOM_ELEMENT_KINDS.map((kind) => (
                <button
                  key={kind}
                  type="button"
                  className="chip"
                  onClick={() => {
                    const id = resolveWashroomId();
                    if (id) onAddFixed(kind, id);
                  }}
                >
                  {FIXED_KIND_LABELS[kind]}
                </button>
              ))}
            </div>
          </>
        )}

        {(kitchens.length > 0 || washrooms.length > 0) && (
          <>
            <h3 className="subhead">Add custom element</h3>
            <form
              className="form-grid"
              onSubmit={(e) =>
                submitCustom(e, resolveKitchenId() || resolveWashroomId())
              }
            >
              <label className="full">
                Name
                <input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Gas pipe / rack / …"
                  required
                />
              </label>
              <label>
                Length (cm)
                <input
                  type="number"
                  min={10}
                  value={customL}
                  onChange={(e) => setCustomL(e.target.value)}
                />
              </label>
              <label>
                Width (cm)
                <input
                  type="number"
                  min={10}
                  value={customW}
                  onChange={(e) => setCustomW(e.target.value)}
                />
              </label>
              <button type="submit" className="full">
                Add custom to selected zone
              </button>
            </form>
            <p className="panel-note tight">
              Select a kitchen or washroom on the plan first (or the first one
              is used).
            </p>
          </>
        )}

        {editingId && (
          <form className="form-grid edit-block" onSubmit={saveEdit}>
            <label className="full">
              Name
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </label>
            <label className="full">
              Type
              <select
                value={editKind}
                onChange={(e) => setEditKind(e.target.value as FixedKind)}
              >
                {(Object.keys(FIXED_KIND_LABELS) as FixedKind[]).map((kind) => (
                  <option key={kind} value={kind}>
                    {FIXED_KIND_LABELS[kind]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Length (cm)
              <input
                type="number"
                min={10}
                value={editL}
                onChange={(e) => setEditL(e.target.value)}
              />
            </label>
            <label>
              Width (cm)
              <input
                type="number"
                min={10}
                value={editW}
                onChange={(e) => setEditW(e.target.value)}
              />
            </label>
            <button type="submit">Save element</button>
            <button
              type="button"
              className="ghost"
              onClick={() => setEditingId(null)}
            >
              Cancel
            </button>
          </form>
        )}

        <ul className="thing-list">
          {structures.map((fixed) => (
            <div key={fixed.id} className="build-group">
              {renderItem(fixed)}
              {childrenOf(fixed.id).map((child) => renderItem(child, true))}
            </div>
          ))}
          {structures.length === 0 && (
            <li>
              <div>
                <strong>No build elements yet</strong>
                <span>
                  Add Kitchen or Washroom to load a basic fixture set.
                </span>
              </div>
            </li>
          )}
        </ul>
      </section>
    </aside>
  );
}

type InventoryStepProps = {
  things: Thing[];
  placements: Placement[];
  onAddThing: (thing: Omit<Thing, "id">) => void;
  onUpdateThing: (thingId: string, thing: Omit<Thing, "id">) => void;
  onRemoveThing: (thingId: string) => void;
  onClearInventory: () => void;
};

export function InventoryStepPanel({
  things,
  placements,
  onAddThing,
  onUpdateThing,
  onRemoveThing,
  onClearInventory,
}: InventoryStepProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [lengthCm, setLengthCm] = useState("120");
  const [widthCm, setWidthCm] = useState("60");
  const placedIds = new Set(placements.map((p) => p.thingId));

  function resetForm() {
    setEditingId(null);
    setName("");
    setLengthCm("120");
    setWidthCm("60");
  }

  function startEdit(thing: Thing) {
    setEditingId(thing.id);
    setName(thing.name);
    setLengthCm(String(thing.lengthCm));
    setWidthCm(String(thing.widthCm));
  }

  function submitThing(event: FormEvent) {
    event.preventDefault();
    const payload = {
      name,
      lengthCm: Number(lengthCm) || 10,
      widthCm: Number(widthCm) || 10,
    };
    if (editingId) onUpdateThing(editingId, payload);
    else onAddThing(payload);
    resetForm();
  }

  return (
    <aside className="side-panel">
      <section>
        <h2>3. Inventory</h2>
        <p className="panel-note">
          Your movable furniture and appliances only — bed, sofa, fridge you
          own. Not kitchen/washroom build fixtures.
        </p>
        <form className="form-grid" onSubmit={submitThing}>
          <label className="full">
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dining table"
              required
            />
          </label>
          <label>
            Length (cm)
            <input
              type="number"
              min={10}
              value={lengthCm}
              onChange={(e) => setLengthCm(e.target.value)}
              required
            />
          </label>
          <label>
            Width (cm)
            <input
              type="number"
              min={10}
              value={widthCm}
              onChange={(e) => setWidthCm(e.target.value)}
              required
            />
          </label>
          <button type="submit" className="full">
            {editingId ? "Save changes" : "Add to inventory"}
          </button>
          {editingId && (
            <button type="button" className="full ghost" onClick={resetForm}>
              Cancel edit
            </button>
          )}
        </form>

        <ul className="thing-list">
          {things.map((thing) => (
            <li
              key={thing.id}
              className={editingId === thing.id ? "editing" : undefined}
            >
              <div>
                <strong>{thing.name}</strong>
                <span>
                  {thing.lengthCm} × {thing.widthCm} cm
                  {placedIds.has(thing.id) ? " · in room" : ""}
                </span>
              </div>
              <div className="row-actions">
                <button
                  type="button"
                  className="ghost"
                  onClick={() => startEdit(thing)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => {
                    if (editingId === thing.id) resetForm();
                    onRemoveThing(thing.id);
                  }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
        {things.length > 0 && (
          <div className="utility-actions" style={{ marginTop: "0.85rem" }}>
            <button type="button" className="danger" onClick={onClearInventory}>
              Clear inventory
            </button>
          </div>
        )}
      </section>
    </aside>
  );
}

type FitStepProps = {
  things: Thing[];
  placements: Placement[];
  evaluated: EvaluatedPlacement[];
  onPlaceThing: (thingId: string) => void;
  onClearFurniture: () => void;
  onResetDemo: () => void;
};

export function FitStepPanel({
  things,
  placements,
  evaluated,
  onPlaceThing,
  onClearFurniture,
  onResetDemo,
}: FitStepProps) {
  const placedIds = new Set(placements.map((p) => p.thingId));
  const statusByThing = new Map(
    evaluated.map((e) => [e.thingId, e.status] as const),
  );

  return (
    <aside className="side-panel">
      <section>
        <h2>4. Fit things</h2>
        <p className="panel-note">
          Place inventory into the room. Build elements stay fixed. To remove a
          placed item, select it on the canvas.
        </p>
        <ul className="thing-list">
          {things.map((thing) => {
            const placed = placedIds.has(thing.id);
            const status = statusByThing.get(thing.id);
            return (
              <li key={thing.id}>
                <div>
                  <strong>{thing.name}</strong>
                  <span>
                    {thing.lengthCm} × {thing.widthCm} cm
                    {status ? ` · ${status}` : ""}
                  </span>
                </div>
                <div className="row-actions">
                  <button
                    type="button"
                    onClick={() => onPlaceThing(thing.id)}
                    disabled={placed}
                  >
                    {placed ? "In room" : "Place"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
      <section className="utility-actions">
        <button type="button" onClick={onClearFurniture}>
          Clear furniture
        </button>
        <button type="button" className="ghost" onClick={onResetDemo}>
          Reset demo data
        </button>
      </section>
    </aside>
  );
}
