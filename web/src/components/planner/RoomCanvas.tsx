"use client";

import {
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { doorSwingGeometry, fixedFootprint } from "@/lib/geometry";
import type {
  EvaluatedPlacement,
  FixedObject,
  PlannerStep,
  Room,
  Selection,
  Thing,
} from "@/lib/types";
import { compassLabels, type Cardinal } from "@/lib/types";

function cardinalLabel(cardinal: Cardinal) {
  switch (cardinal) {
    case "N":
      return "North (N)";
    case "S":
      return "South (S)";
    case "E":
      return "East (E)";
    case "W":
      return "West (W)";
  }
}

type Props = {
  room: Room;
  fixedObjects: FixedObject[];
  thingsById: Map<string, Thing>;
  evaluated: EvaluatedPlacement[];
  selection: Selection;
  step: PlannerStep;
  onSelect: (selection: Selection) => void;
  onMoveFixed: (id: string, xCm: number, yCm: number) => void;
  onMoveFurniture: (id: string, xCm: number, yCm: number) => void;
};

function BoxLabels({
  w,
  h,
  name,
  nameClass,
  metaClass,
}: {
  w: number;
  h: number;
  name: string;
  nameClass: string;
  metaClass: string;
}) {
  const showSideLabels = w >= 55 && h >= 45;
  const fontSize = Math.max(10, Math.min(14, Math.min(w, h) / 8));

  return (
    <>
      <text
        x={w / 2}
        y={showSideLabels ? h / 2 - fontSize * 0.35 : h / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        className={nameClass}
        style={{ fontSize }}
      >
        {name}
      </text>
      {showSideLabels ? (
        <>
          <text
            x={w / 2}
            y={h / 2 + fontSize * 0.9}
            textAnchor="middle"
            dominantBaseline="middle"
            className={metaClass}
            style={{ fontSize: fontSize * 0.9 }}
          >
            {Math.round(w)} × {Math.round(h)} cm
          </text>
          <text
            x={w / 2}
            y={Math.min(14, h * 0.18)}
            textAnchor="middle"
            className="edge-dim"
          >
            {Math.round(w)} cm
          </text>
          <text
            x={Math.min(12, w * 0.12)}
            y={h / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            className="edge-dim"
            transform={`rotate(-90 ${Math.min(12, w * 0.12)} ${h / 2})`}
          >
            {Math.round(h)} cm
          </text>
        </>
      ) : (
        <text
          x={w / 2}
          y={h / 2 + fontSize * 0.95}
          textAnchor="middle"
          dominantBaseline="middle"
          className={metaClass}
          style={{ fontSize: Math.max(9, fontSize * 0.85) }}
        >
          {Math.round(w)}×{Math.round(h)} cm
        </text>
      )}
    </>
  );
}

export function RoomCanvas({
  room,
  fixedObjects,
  thingsById,
  evaluated,
  selection,
  step,
  onSelect,
  onMoveFixed,
  onMoveFurniture,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<{
    type: "fixed" | "furniture";
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const padding = 40;
  const viewW = room.lengthCm + padding * 2;
  const viewH = room.widthCm + padding * 2;
  const canDragFixed = step === "build";
  const canDragFurniture = step === "fit";
  const directions = compassLabels(room.northSide ?? "top");

  const scaleHint = useMemo(() => {
    const maxSide = Math.max(room.lengthCm, room.widthCm);
    return maxSide > 0 ? `${maxSide} cm across` : "";
  }, [room.lengthCm, room.widthCm]);

  function clientToCm(clientX: number, clientY: number) {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const local = point.matrixTransform(ctm.inverse());
    return {
      x: local.x - padding,
      y: local.y - padding,
    };
  }

  function startDrag(
    event: ReactPointerEvent,
    type: "fixed" | "furniture",
    id: string,
    xCm: number,
    yCm: number,
  ) {
    event.preventDefault();
    event.stopPropagation();
    const { x, y } = clientToCm(event.clientX, event.clientY);
    setDragging({
      type,
      id,
      offsetX: x - xCm,
      offsetY: y - yCm,
    });
    onSelect({ type, id });
    (event.currentTarget as Element).setPointerCapture?.(event.pointerId);
  }

  function onPointerMove(event: ReactPointerEvent) {
    if (!dragging) return;
    const { x, y } = clientToCm(event.clientX, event.clientY);
    const nextX = x - dragging.offsetX;
    const nextY = y - dragging.offsetY;
    if (dragging.type === "fixed") {
      onMoveFixed(dragging.id, nextX, nextY);
    } else {
      onMoveFurniture(dragging.id, nextX, nextY);
    }
  }

  function onPointerUp() {
    setDragging(null);
  }

  return (
    <div className="canvas-wrap">
      <svg
        ref={svgRef}
        className="room-svg"
        viewBox={`0 0 ${viewW} ${viewH}`}
        role="img"
        aria-label={`${room.name} ${room.lengthCm} by ${room.widthCm} centimeters`}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onPointerDown={() => onSelect(null)}
      >
        <defs>
          <pattern
            id="fixed-hatch"
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="10" stroke="#6b7c72" strokeWidth="2" />
          </pattern>
        </defs>
        <rect x={0} y={0} width={viewW} height={viewH} className="canvas-bg" />
        <rect
          x={padding}
          y={padding}
          width={room.lengthCm}
          height={room.widthCm}
          className="room-floor"
        />

        {/* Compass labels around the room */}
        <text
          x={padding + room.lengthCm / 2}
          y={padding - 22}
          textAnchor="middle"
          className={`compass-label ${directions.top === "N" ? "north" : ""}`}
        >
          {cardinalLabel(directions.top)}
        </text>
        <text
          x={padding + room.lengthCm / 2}
          y={padding + room.widthCm + 28}
          textAnchor="middle"
          className={`compass-label ${directions.bottom === "N" ? "north" : ""}`}
        >
          {cardinalLabel(directions.bottom)}
        </text>
        <text
          x={padding - 18}
          y={padding + room.widthCm / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className={`compass-label ${directions.left === "N" ? "north" : ""}`}
          transform={`rotate(-90 ${padding - 18} ${padding + room.widthCm / 2})`}
        >
          {cardinalLabel(directions.left)}
        </text>
        <text
          x={padding + room.lengthCm + 18}
          y={padding + room.widthCm / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className={`compass-label ${directions.right === "N" ? "north" : ""}`}
          transform={`rotate(90 ${padding + room.lengthCm + 18} ${padding + room.widthCm / 2})`}
        >
          {cardinalLabel(directions.right)}
        </text>

        <text
          x={padding + room.lengthCm / 2}
          y={padding - 6}
          textAnchor="middle"
          className="dim-label"
        >
          {room.lengthCm} cm
        </text>
        <text
          x={padding - 6}
          y={padding + room.widthCm / 2}
          textAnchor="middle"
          className="dim-label"
          transform={`rotate(-90 ${padding - 6} ${padding + room.widthCm / 2})`}
        >
          {room.widthCm} cm
        </text>

        {/* Door swing paths (under furniture, above floor) */}
        {fixedObjects.map((fixed) => {
          const swing = doorSwingGeometry(fixed);
          if (!swing) return null;
          return (
            <g
              key={`swing-${fixed.id}`}
              transform={`translate(${padding} ${padding})`}
              pointerEvents="none"
              className={fixed.isOpen ? "door-path is-open" : "door-path"}
            >
              <path d={swing.sectorD} className="door-swing-fill" />
              <path d={swing.arcD} className="door-swing-arc" />
              <line
                x1={swing.hinge.x}
                y1={swing.hinge.y}
                x2={swing.closedTip.x}
                y2={swing.closedTip.y}
                className="door-swing-leaf closed-leaf"
              />
              <line
                x1={swing.hinge.x}
                y1={swing.hinge.y}
                x2={swing.openTip.x}
                y2={swing.openTip.y}
                className="door-swing-leaf open-leaf"
              />
              <circle
                cx={swing.hinge.x}
                cy={swing.hinge.y}
                r={4}
                className="door-hinge"
              />
            </g>
          );
        })}

        {fixedObjects.map((fixed) => {
          const box = fixedFootprint(fixed);
          const isSelected =
            selection?.type === "fixed" && selection.id === fixed.id;
          const label =
            (fixed.kind === "door" ||
              fixed.kind === "balcony" ||
              fixed.kind === "washroom_door") &&
            fixed.isOpen
              ? `${fixed.name} (open)`
              : fixed.kind === "door" ||
                  fixed.kind === "balcony" ||
                  fixed.kind === "washroom_door"
                ? `${fixed.name} (closed)`
                : fixed.name;
          return (
            <g
              key={fixed.id}
              transform={`translate(${padding + box.x} ${padding + box.y})`}
              onPointerDown={(e) => {
                if (!canDragFixed) {
                  e.stopPropagation();
                  onSelect({ type: "fixed", id: fixed.id });
                  return;
                }
                startDrag(e, "fixed", fixed.id, fixed.xCm, fixed.yCm);
              }}
              style={{
                cursor: canDragFixed
                  ? dragging?.id === fixed.id
                    ? "grabbing"
                    : "grab"
                  : "pointer",
              }}
            >
              <rect
                width={box.w}
                height={box.h}
                rx={4}
                className={`fixed-object ${fixed.kind} ${fixed.isOpen ? "open" : ""} ${isSelected ? "selected" : ""}`}
              />
              <rect
                width={box.w}
                height={box.h}
                rx={4}
                fill="url(#fixed-hatch)"
                opacity={0.2}
                pointerEvents="none"
              />
              <BoxLabels
                w={box.w}
                h={box.h}
                name={label}
                nameClass="fixed-label"
                metaClass="furniture-meta"
              />
            </g>
          );
        })}

        {evaluated.map((item) => {
          const thing = thingsById.get(item.thingId);
          if (!thing) return null;
          const isSelected =
            selection?.type === "furniture" && selection.id === item.id;
          return (
            <g
              key={item.id}
              transform={`translate(${padding + item.footprint.x} ${padding + item.footprint.y})`}
              onPointerDown={(e) => {
                if (!canDragFurniture) {
                  e.stopPropagation();
                  onSelect({ type: "furniture", id: item.id });
                  return;
                }
                startDrag(e, "furniture", item.id, item.xCm, item.yCm);
              }}
              style={{
                cursor: canDragFurniture
                  ? dragging?.id === item.id
                    ? "grabbing"
                    : "grab"
                  : "default",
              }}
            >
              <rect
                width={item.footprint.w}
                height={item.footprint.h}
                rx={Math.min(8, item.footprint.w / 10)}
                className={`furniture ${item.status === "PASS" ? "ok" : "bad"} ${isSelected ? "selected" : ""}`}
              />
              <BoxLabels
                w={item.footprint.w}
                h={item.footprint.h}
                name={thing.name}
                nameClass="furniture-label"
                metaClass="furniture-meta"
              />
            </g>
          );
        })}
      </svg>
      <p className="canvas-caption">
        {room.name} · proportional to real size · {scaleHint}
        {step === "build" && " · drag build elements · door path shows swing"}
        {step === "fit" && " · drag your furniture · door arc = swing path"}
        {step === "room" && " · set size first, then add build elements"}
        {step === "inventory" && " · build elements stay fixed on the plan"}
      </p>
    </div>
  );
}
