"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { fixedFootprint, footprintSize } from "@/lib/geometry";
import type {
  EvaluatedPlacement,
  FixedKind,
  FixedObject,
  Room,
  Thing,
} from "@/lib/types";

const ROOM_HEIGHT_CM = 280;

const FIXED_FILL: Record<FixedKind, string> = {
  door: "#8fa0b8",
  window: "#7eb6d9",
  balcony: "#8fbf9a",
  kitchen: "#c4a882",
  washroom: "#89a8c4",
  wardrobe: "#b5a48e",
  pillar: "#7a8680",
  other: "#9aa59d",
  kitchen_sink: "#a8c4d4",
  kitchen_stove: "#9a8b7a",
  kitchen_chimney: "#7d858c",
  kitchen_counter: "#d2b48c",
  kitchen_fridge: "#9aa7b5",
  kitchen_slab: "#cbb896",
  kitchen_tap: "#6f8798",
  kitchen_washer: "#8a9aa8",
  washroom_toilet: "#c5d0d8",
  washroom_basin: "#b7c9d6",
  washroom_shower: "#a3b8c9",
  washroom_tap: "#6f8798",
  washroom_washer: "#8a9aa8",
  washroom_slab: "#c5b8a4",
  washroom_door: "#8fa0b8",
};

function fixedHeight(kind: FixedKind): number {
  switch (kind) {
    case "door":
    case "washroom_door":
      return 210;
    case "window":
      return 120;
    case "balcony":
      return 210;
    case "kitchen":
    case "kitchen_counter":
    case "kitchen_slab":
    case "washroom_slab":
      return 90;
    case "kitchen_sink":
    case "washroom_basin":
      return 85;
    case "kitchen_stove":
      return 85;
    case "kitchen_chimney":
      return 70;
    case "kitchen_fridge":
      return 180;
    case "kitchen_tap":
    case "washroom_tap":
      return 35;
    case "kitchen_washer":
    case "washroom_washer":
      return 85;
    case "washroom":
      return 220;
    case "washroom_toilet":
      return 75;
    case "washroom_shower":
      return 200;
    case "wardrobe":
      return 210;
    case "pillar":
      return ROOM_HEIGHT_CM;
    default:
      return 100;
  }
}

function fixedLift(kind: FixedKind): number {
  if (kind === "window") return 90;
  if (kind === "kitchen_chimney") return 160;
  if (kind === "kitchen_tap" || kind === "washroom_tap") return 85;
  return 0;
}

function BoxMesh({
  xCm,
  yCm,
  w,
  h,
  heightCm,
  liftCm = 0,
  color,
  opacity = 1,
  room,
}: {
  xCm: number;
  yCm: number;
  w: number;
  h: number;
  heightCm: number;
  liftCm?: number;
  color: string;
  opacity?: number;
  room: Room;
}) {
  const cx = xCm + w / 2 - room.lengthCm / 2;
  const cz = yCm + h / 2 - room.widthCm / 2;
  const cy = liftCm + heightCm / 2;

  return (
    <mesh position={[cx, cy, cz]} castShadow receiveShadow>
      <boxGeometry args={[w, heightCm, h]} />
      <meshStandardMaterial
        color={color}
        transparent={opacity < 1}
        opacity={opacity}
      />
    </mesh>
  );
}

function RoomShell({ room }: { room: Room }) {
  const L = room.lengthCm;
  const W = room.widthCm;
  const H = ROOM_HEIGHT_CM;
  const wall = 8;

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[L, W]} />
        <meshStandardMaterial color="#dbe5df" />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, H, 0]}>
        <planeGeometry args={[L, W]} />
        <meshStandardMaterial color="#f2f5f3" transparent opacity={0.35} />
      </mesh>

      <mesh position={[0, H / 2, -W / 2 - wall / 2]}>
        <boxGeometry args={[L + wall * 2, H, wall]} />
        <meshStandardMaterial color="#e8eee9" />
      </mesh>
      <mesh position={[-L / 2 - wall / 2, H / 2, 0]}>
        <boxGeometry args={[wall, H, W]} />
        <meshStandardMaterial color="#e2e9e4" />
      </mesh>
      <mesh position={[L / 2 + wall / 2, H / 2, 0]}>
        <boxGeometry args={[wall, H, W]} />
        <meshStandardMaterial color="#e2e9e4" transparent opacity={0.25} />
      </mesh>
      <mesh position={[0, H / 2, W / 2 + wall / 2]}>
        <boxGeometry args={[L + wall * 2, H, wall]} />
        <meshStandardMaterial color="#e8eee9" transparent opacity={0.2} />
      </mesh>
    </group>
  );
}

function HingedDoor({
  fixed,
  room,
  onToggle,
}: {
  fixed: FixedObject;
  room: Room;
  onToggle?: () => void;
}) {
  const height = fixedHeight(fixed.kind);
  const hingeX = fixed.xCm - room.lengthCm / 2;
  const hingeZ = fixed.yCm - room.widthCm / 2;
  const baseYaw = (-fixed.rotation * Math.PI) / 180;
  const openYaw = fixed.isOpen ? -Math.PI / 2 : 0;

  return (
    <group position={[hingeX, 0, hingeZ]} rotation={[0, baseYaw, 0]}>
      <group rotation={[0, openYaw, 0]}>
        <mesh
          position={[fixed.lengthCm / 2, height / 2, fixed.widthCm / 2]}
          castShadow
          onClick={(e) => {
            e.stopPropagation();
            onToggle?.();
          }}
          onPointerOver={() => {
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            document.body.style.cursor = "default";
          }}
        >
          <boxGeometry args={[fixed.lengthCm, height, fixed.widthCm]} />
          <meshStandardMaterial color={FIXED_FILL[fixed.kind]} />
        </mesh>
      </group>
    </group>
  );
}

type SceneProps = {
  room: Room;
  fixedObjects: FixedObject[];
  thingsById: Map<string, Thing>;
  evaluated: EvaluatedPlacement[];
  onToggleOpen?: (id: string) => void;
};

function Scene({
  room,
  fixedObjects,
  thingsById,
  evaluated,
  onToggleOpen,
}: SceneProps) {
  const maxDim = Math.max(room.lengthCm, room.widthCm);

  return (
    <>
      <color attach="background" args={["#eef2ef"]} />
      <ambientLight intensity={0.75} />
      <directionalLight
        position={[maxDim * 0.6, ROOM_HEIGHT_CM * 1.4, maxDim * 0.4]}
        intensity={1.1}
        castShadow
      />

      <RoomShell room={room} />

      {fixedObjects.map((fixed) => {
        if (fixed.kind === "door" || fixed.kind === "balcony" || fixed.kind === "washroom_door") {
          return (
            <HingedDoor
              key={fixed.id}
              fixed={fixed}
              room={room}
              onToggle={() => onToggleOpen?.(fixed.id)}
            />
          );
        }
        const box = fixedFootprint(fixed);
        return (
          <BoxMesh
            key={fixed.id}
            room={room}
            xCm={box.x}
            yCm={box.y}
            w={box.w}
            h={box.h}
            heightCm={fixedHeight(fixed.kind)}
            liftCm={fixedLift(fixed.kind)}
            color={FIXED_FILL[fixed.kind]}
            opacity={0.92}
          />
        );
      })}

      {evaluated.map((item) => {
        const thing = thingsById.get(item.thingId);
        if (!thing) return null;
        const { w, h } = footprintSize(
          thing.lengthCm,
          thing.widthCm,
          item.rotation,
        );
        return (
          <BoxMesh
            key={item.id}
            room={room}
            xCm={item.xCm}
            yCm={item.yCm}
            w={w}
            h={h}
            heightCm={80}
            color={item.status === "PASS" ? "#6fbf8e" : "#e07a7a"}
          />
        );
      })}

      <OrbitControls
        makeDefault
        maxPolarAngle={Math.PI / 2.05}
        minDistance={maxDim * 0.4}
        maxDistance={maxDim * 3}
        target={[0, ROOM_HEIGHT_CM * 0.25, 0]}
      />
    </>
  );
}

export function RoomView3D({
  room,
  fixedObjects,
  thingsById,
  evaluated,
  onToggleOpen,
}: SceneProps) {
  const maxDim = Math.max(room.lengthCm, room.widthCm, 300);
  const camDist = maxDim * 1.15;

  return (
    <div className="canvas-wrap view-3d-wrap">
      <Canvas
        shadows
        camera={{
          position: [camDist * 0.85, ROOM_HEIGHT_CM * 0.9, camDist * 0.85],
          fov: 45,
          near: 1,
          far: maxDim * 20,
        }}
      >
        <Scene
          room={room}
          fixedObjects={fixedObjects}
          thingsById={thingsById}
          evaluated={evaluated}
          onToggleOpen={onToggleOpen}
        />
      </Canvas>
      <p className="canvas-caption">
        {room.name} · 3D preview · drag to orbit · click a door to open/close
      </p>
    </div>
  );
}
