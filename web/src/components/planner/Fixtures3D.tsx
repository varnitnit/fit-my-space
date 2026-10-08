"use client";

import { closedFixedFootprint, fixedFootprint } from "@/lib/geometry";
import type { FixedKind, FixedObject, Room } from "@/lib/types";
import { Almirah } from "./Furniture3D";

type Vec3 = [number, number, number];

const COUNTER_TOP = 90;
const CEILING = 280;

const STEEL = "#c3c9cf";
const CHROME = "#d9dee2";
const GRANITE = "#3b3f45";
const CABINET = "#efe9df";
const CABINET_DOOR = "#d8c7ab";
const PORCELAIN = "#f7f8f8";
const DARK = "#2b2f33";

function Part({
  p,
  s,
  c,
  metal = 0,
  rough = 0.6,
  opacity,
}: {
  p: Vec3;
  s: Vec3;
  c: string;
  metal?: number;
  rough?: number;
  opacity?: number;
}) {
  return (
    <mesh position={p} castShadow receiveShadow>
      <boxGeometry args={s} />
      <meshStandardMaterial
        color={c}
        metalness={metal}
        roughness={rough}
        transparent={opacity !== undefined}
        opacity={opacity ?? 1}
      />
    </mesh>
  );
}

function Cyl({
  p,
  r,
  rTop,
  h,
  c,
  rot = [0, 0, 0],
  segments = 24,
  metal = 0,
  rough = 0.5,
  opacity,
}: {
  p: Vec3;
  r: number;
  rTop?: number;
  h: number;
  c: string;
  rot?: Vec3;
  segments?: number;
  metal?: number;
  rough?: number;
  opacity?: number;
}) {
  return (
    <mesh position={p} rotation={rot} castShadow receiveShadow>
      <cylinderGeometry args={[rTop ?? r, r, h, segments]} />
      <meshStandardMaterial
        color={c}
        metalness={metal}
        roughness={rough}
        transparent={opacity !== undefined}
        opacity={opacity ?? 1}
      />
    </mesh>
  );
}

/* Every model is drawn in local space: length along x, width along z,
   centered on the origin, with the front facing +z. */

function BaseCabinet({
  L,
  W,
  top = GRANITE,
  height = COUNTER_TOP,
  backsplash = true,
}: {
  L: number;
  W: number;
  top?: string;
  height?: number;
  backsplash?: boolean;
}) {
  const body = height - 14;
  const doors = Math.max(1, Math.round(L / 60));
  const doorW = L / doors;
  const front = W / 2 - 3;
  return (
    <>
      <Part p={[0, 5, -2]} s={[L, 10, W - 8]} c={DARK} />
      <Part p={[0, 10 + body / 2, -1]} s={[L, body, W - 4]} c={CABINET} />
      {Array.from({ length: doors }, (_, i) => {
        const x = -L / 2 + doorW * (i + 0.5);
        return (
          <group key={i}>
            <Part
              p={[x, 10 + body / 2, front + 0.75]}
              s={[doorW - 1.2, body - 4, 1.5]}
              c={CABINET_DOOR}
              rough={0.45}
            />
            <Part
              p={[x, 10 + body - 8, front + 2]}
              s={[Math.min(16, doorW * 0.4), 1.2, 1.2]}
              c={CHROME}
              metal={0.9}
              rough={0.2}
            />
          </group>
        );
      })}
      <Part p={[0, height - 2, 0]} s={[L, 4, W]} c={top} rough={0.25} />
      {backsplash && (
        <Part
          p={[0, height + 30, -W / 2 + 1]}
          s={[L, 60, 2]}
          c="#e3ecee"
          rough={0.3}
        />
      )}
    </>
  );
}

function KitchenSink({ L, W }: { L: number; W: number }) {
  return (
    <>
      <Part p={[0, 45, -4]} s={[L - 2, 86, W - 8]} c={CABINET} />
      <Part
        p={[0, COUNTER_TOP + 0.6, 0]}
        s={[L - 2, 1.2, W - 4]}
        c={STEEL}
        metal={0.85}
        rough={0.25}
      />
      <Part
        p={[0, COUNTER_TOP + 1.3, 0]}
        s={[L * 0.72, 0.3, (W - 4) * 0.68]}
        c="#7f878d"
        metal={0.8}
        rough={0.3}
      />
      <Cyl p={[0, COUNTER_TOP + 1.5, 0]} r={2.2} h={0.4} c={DARK} />
    </>
  );
}

function Tap({ base }: { base: number }) {
  return (
    <>
      <Cyl p={[0, base + 2, -3]} r={3} h={4} c={CHROME} metal={0.9} rough={0.15} />
      <Cyl
        p={[0, base + 16, -3]}
        r={1.4}
        h={26}
        c={CHROME}
        metal={0.9}
        rough={0.15}
      />
      <Cyl
        p={[0, base + 28, 4]}
        r={1.2}
        h={15}
        c={CHROME}
        rot={[Math.PI / 2, 0, 0]}
        metal={0.9}
        rough={0.15}
      />
      <Part
        p={[0, base + 24, -6]}
        s={[1.5, 1.5, 8]}
        c={CHROME}
        metal={0.9}
        rough={0.15}
      />
    </>
  );
}

function Stove({ L, W }: { L: number; W: number }) {
  const burnerR = Math.min(L, W) * 0.11;
  const spots: [number, number][] =
    L >= 45
      ? [
          [-L / 4, -W / 4],
          [L / 4, -W / 4],
          [-L / 4, W / 6],
          [L / 4, W / 6],
        ]
      : [[0, 0]];
  return (
    <>
      <Part p={[0, 45, -4]} s={[L - 2, 86, W - 8]} c="#4a4f55" metal={0.5} rough={0.4} />
      <Part
        p={[0, 50, W / 2 - 7.5]}
        s={[L * 0.75, 30, 0.6]}
        c="#1b1f23"
        rough={0.1}
        opacity={0.85}
      />
      <Part
        p={[0, COUNTER_TOP + 0.75, 0]}
        s={[L - 4, 1.5, W - 4]}
        c="#111418"
        metal={0.3}
        rough={0.15}
      />
      {spots.map(([x, z], i) => (
        <group key={i}>
          <Cyl p={[x, COUNTER_TOP + 2, z]} r={burnerR} h={1.2} c="#3a3e43" metal={0.6} />
          <Cyl p={[x, COUNTER_TOP + 2.8, z]} r={burnerR * 0.5} h={1} c="#1e2125" />
        </group>
      ))}
      {[-L / 3, -L / 9, L / 9, L / 3].map((x, i) => (
        <Cyl
          key={i}
          p={[x, COUNTER_TOP + 2.5, W / 2 - 4]}
          r={1.6}
          h={2.5}
          c={CHROME}
          metal={0.8}
        />
      ))}
    </>
  );
}

function Chimney({ L, W }: { L: number; W: number }) {
  const ductW = Math.max(18, L * 0.35);
  const ductD = Math.max(18, W * 0.45);
  const hoodBottom = 165;
  return (
    <>
      <Part p={[0, hoodBottom + 3, 0]} s={[L, 6, W]} c={STEEL} metal={0.75} rough={0.3} />
      <Part
        p={[0, hoodBottom + 0.2, 0]}
        s={[L * 0.8, 0.4, W * 0.7]}
        c="#5f666c"
        metal={0.6}
      />
      <group position={[0, hoodBottom + 16, 0]} scale={[L, 1, W]}>
        <mesh rotation={[0, Math.PI / 4, 0]} castShadow>
          <cylinderGeometry args={[0.2 * Math.SQRT2, 0.5 * Math.SQRT2, 20, 4]} />
          <meshStandardMaterial color={STEEL} metalness={0.75} roughness={0.3} />
        </mesh>
      </group>
      <Part
        p={[0, (hoodBottom + 26 + CEILING) / 2, -W / 2 + ductD / 2]}
        s={[ductW, CEILING - hoodBottom - 26, ductD]}
        c={STEEL}
        metal={0.75}
        rough={0.3}
      />
    </>
  );
}

function Fridge({ L, W }: { L: number; W: number }) {
  const front = W / 2 - 6;
  return (
    <>
      <Part p={[0, 3, -3]} s={[L - 4, 6, W - 8]} c={DARK} />
      <Part p={[0, 93, -3]} s={[L - 2, 174, W - 6]} c="#dfe3e6" metal={0.4} rough={0.35} />
      <Part p={[0, 150, front + 2]} s={[L - 2, 56, 4]} c="#e8ecef" metal={0.45} rough={0.3} />
      <Part p={[0, 63, front + 2]} s={[L - 2, 114, 4]} c="#e8ecef" metal={0.45} rough={0.3} />
      <Part p={[L / 2 - 8, 140, front + 5]} s={[2, 22, 2]} c={CHROME} metal={0.9} rough={0.15} />
      <Part p={[L / 2 - 8, 95, front + 5]} s={[2, 40, 2]} c={CHROME} metal={0.9} rough={0.15} />
    </>
  );
}

function Washer({ L, W }: { L: number; W: number }) {
  const front = W / 2 - 2;
  const doorR = Math.min(L, 85) * 0.3;
  return (
    <>
      <Part p={[0, 42.5, 0]} s={[L - 2, 85, W - 4]} c="#f2f4f5" rough={0.35} />
      <Part p={[0, 77, front + 0.5]} s={[L - 4, 10, 1]} c="#d5dadd" />
      <Cyl p={[L / 4, 77, front + 1.5]} r={3} h={2} c="#9aa3ab" rot={[Math.PI / 2, 0, 0]} metal={0.6} />
      <Part p={[-L / 4, 77, front + 1.1]} s={[12, 4, 0.4]} c="#24303a" />
      <Cyl
        p={[0, 40, front + 1.5]}
        r={doorR}
        h={3}
        c="#9aa3ab"
        rot={[Math.PI / 2, 0, 0]}
        metal={0.7}
        rough={0.25}
      />
      <Cyl
        p={[0, 40, front + 1.8]}
        r={doorR * 0.75}
        h={3.2}
        c="#36495b"
        rot={[Math.PI / 2, 0, 0]}
        rough={0.08}
        opacity={0.85}
      />
    </>
  );
}

function Toilet({ L, W }: { L: number; W: number }) {
  const tankD = Math.min(18, W * 0.3);
  const bowlD = W - tankD;
  const bowlZ = -W / 2 + tankD + bowlD / 2;
  return (
    <>
      <Part p={[0, 60, -W / 2 + tankD / 2]} s={[Math.min(L, 42), 40, tankD]} c={PORCELAIN} rough={0.2} />
      <Part p={[0, 81, -W / 2 + tankD / 2]} s={[Math.min(L, 42) + 2, 2, tankD + 2]} c={PORCELAIN} rough={0.2} />
      <Cyl p={[3, 82.5, -W / 2 + tankD / 2]} r={2.2} h={1.5} c={CHROME} metal={0.9} />
      <group position={[0, 0, bowlZ]} scale={[L * 0.85, 1, bowlD * 0.95]}>
        <mesh position={[0, 20, 0]} castShadow>
          <cylinderGeometry args={[0.5, 0.32, 40, 28]} />
          <meshStandardMaterial color={PORCELAIN} roughness={0.2} />
        </mesh>
        <mesh position={[0, 41.5, 0]} castShadow>
          <cylinderGeometry args={[0.5, 0.5, 3, 28]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </mesh>
      </group>
    </>
  );
}

function Basin({ L, W }: { L: number; W: number }) {
  return (
    <>
      <Cyl p={[0, 35, -W / 6]} r={8} rTop={6} h={70} c={PORCELAIN} rough={0.2} />
      <group position={[0, 0, 0]} scale={[L, 1, W]}>
        <mesh position={[0, 77.5, 0]} castShadow>
          <cylinderGeometry args={[0.5, 0.38, 15, 28]} />
          <meshStandardMaterial color={PORCELAIN} roughness={0.2} />
        </mesh>
        <mesh position={[0, 85.1, 0]}>
          <cylinderGeometry args={[0.42, 0.42, 0.4, 28]} />
          <meshStandardMaterial color="#cfd8dc" roughness={0.15} />
        </mesh>
      </group>
      <Part
        p={[0, 145, -W / 2 + 0.5]}
        s={[L * 0.9, 60, 1]}
        c="#a9c4d4"
        metal={0.9}
        rough={0.05}
      />
    </>
  );
}

function Shower({ L, W }: { L: number; W: number }) {
  const pipeX = -L / 2 + 8;
  const pipeZ = -W / 2 + 3;
  return (
    <>
      <Part p={[0, 3, 0]} s={[L, 6, W]} c={PORCELAIN} rough={0.25} />
      <Cyl p={[0, 6.2, 0]} r={3} h={0.4} c={DARK} />
      <Part p={[0, 101, W / 2 - 0.5]} s={[L, 190, 1]} c="#bfe3f0" rough={0.05} opacity={0.25} />
      <Part p={[L / 2 - 0.5, 101, 0]} s={[1, 190, W]} c="#bfe3f0" rough={0.05} opacity={0.25} />
      <Cyl p={[pipeX, 100, pipeZ]} r={1.2} h={190} c={CHROME} metal={0.9} rough={0.15} />
      <Cyl
        p={[pipeX, 195, pipeZ + 10]}
        r={1}
        h={20}
        c={CHROME}
        rot={[Math.PI / 2, 0, 0]}
        metal={0.9}
        rough={0.15}
      />
      <Cyl p={[pipeX, 193, pipeZ + 20]} r={10} h={2} c={CHROME} metal={0.9} rough={0.15} />
      <Cyl p={[pipeX, 110, pipeZ + 2]} r={3} h={3} c={CHROME} rot={[Math.PI / 2, 0, 0]} metal={0.9} />
    </>
  );
}

const WINDOW_SILL = 90;
const WINDOW_HEIGHT = 120;
const FRAME_WHITE = "#f3f4f2";
const GLASS = "#bfe3f0";

function WindowModel({ L, W }: { L: number; W: number }) {
  const depth = Math.max(6, W * 0.6);
  const bar = 6;
  const top = WINDOW_SILL + WINDOW_HEIGHT;
  const mid = WINDOW_SILL + WINDOW_HEIGHT / 2;
  const innerW = L - bar * 2;
  const innerH = WINDOW_HEIGHT - bar * 2;
  const transomY = top - bar - innerH * 0.25;
  return (
    <>
      <Part p={[0, WINDOW_SILL - 2, 2]} s={[L + 10, 4, W + 6]} c="#e6e1d8" rough={0.4} />
      <Part p={[0, WINDOW_SILL + bar / 2, 0]} s={[L, bar, depth]} c={FRAME_WHITE} rough={0.4} />
      <Part p={[0, top - bar / 2, 0]} s={[L, bar, depth]} c={FRAME_WHITE} rough={0.4} />
      <Part p={[-L / 2 + bar / 2, mid, 0]} s={[bar, WINDOW_HEIGHT, depth]} c={FRAME_WHITE} rough={0.4} />
      <Part p={[L / 2 - bar / 2, mid, 0]} s={[bar, WINDOW_HEIGHT, depth]} c={FRAME_WHITE} rough={0.4} />
      <Part p={[0, transomY, 0]} s={[innerW, 4, depth * 0.8]} c={FRAME_WHITE} rough={0.4} />
      {L >= 80 && (
        <Part
          p={[0, (WINDOW_SILL + bar + transomY) / 2, 0]}
          s={[4, transomY - WINDOW_SILL - bar, depth * 0.8]}
          c={FRAME_WHITE}
          rough={0.4}
        />
      )}
      <Part p={[0, mid, 0]} s={[innerW, innerH, 1]} c={GLASS} rough={0.05} metal={0.1} opacity={0.3} />
      {L >= 80 &&
        [-L / 4, L / 4].map((x) => (
          <Part
            key={x}
            p={[x + (x < 0 ? 6 : -6), WINDOW_SILL + 45, depth / 2 + 1]}
            s={[1.5, 10, 1.5]}
            c={CHROME}
            metal={0.9}
            rough={0.2}
          />
        ))}
    </>
  );
}

const DOOR_HEIGHT = 210;

type DoorStyle = { leaf: string; panel: string; frame: string; glass: boolean };

const DOOR_STYLES: Record<"door" | "balcony" | "washroom_door", DoorStyle> = {
  door: { leaf: "#8b5e3c", panel: "#7a5032", frame: "#6b4429", glass: false },
  washroom_door: { leaf: "#eceae5", panel: "#dedbd3", frame: "#cfcac0", glass: false },
  balcony: { leaf: "#9aa3ab", panel: "#9aa3ab", frame: "#7f888f", glass: true },
};

/** Hinge is the closed top-left corner; the leaf swings toward +z (into the room). */
export function HingedDoorModel({
  fixed,
  room,
  onToggle,
}: {
  fixed: FixedObject;
  room: Room;
  onToggle?: () => void;
}) {
  const style =
    DOOR_STYLES[fixed.kind as keyof typeof DOOR_STYLES] ?? DOOR_STYLES.door;
  const L = fixed.lengthCm;
  const W = Math.max(fixed.widthCm, 8);
  const H = DOOR_HEIGHT;
  const leafT = 4;
  const frameT = 5;
  const hingeX = fixed.xCm - room.lengthCm / 2;
  const hingeZ = fixed.yCm - room.widthCm / 2;
  const baseYaw = (-fixed.rotation * Math.PI) / 180;
  const openYaw = fixed.isOpen ? -Math.PI / 2 : 0;
  const leafW = L - 2;
  const panelW = leafW - 16;

  return (
    <group position={[hingeX, 0, hingeZ]} rotation={[0, baseYaw, 0]}>
      <Part p={[-frameT / 2, (H + frameT) / 2, W / 2]} s={[frameT, H + frameT, W]} c={style.frame} rough={0.5} />
      <Part p={[L + frameT / 2, (H + frameT) / 2, W / 2]} s={[frameT, H + frameT, W]} c={style.frame} rough={0.5} />
      <Part p={[L / 2, H + frameT / 2, W / 2]} s={[L + frameT * 2, frameT, W]} c={style.frame} rough={0.5} />
      <Part p={[L / 2, 0.5, W / 2]} s={[L, 1, W]} c="#b9b2a6" rough={0.6} />

      <group
        position={[0, 0, W / 2]}
        rotation={[0, openYaw, 0]}
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
        {style.glass ? (
          <>
            <Part p={[1 + 3, H / 2, 0]} s={[6, H - 1, leafT]} c={style.leaf} metal={0.6} rough={0.3} />
            <Part p={[leafW - 2, H / 2, 0]} s={[6, H - 1, leafT]} c={style.leaf} metal={0.6} rough={0.3} />
            <Part p={[leafW / 2 + 1, 4, 0]} s={[leafW, 8, leafT]} c={style.leaf} metal={0.6} rough={0.3} />
            <Part p={[leafW / 2 + 1, H - 4, 0]} s={[leafW, 8, leafT]} c={style.leaf} metal={0.6} rough={0.3} />
            <Part p={[leafW / 2 + 1, H / 2, 0]} s={[leafW - 12, H - 16, 1]} c={GLASS} rough={0.05} opacity={0.3} />
          </>
        ) : (
          <>
            <Part p={[leafW / 2 + 1, H / 2, 0]} s={[leafW, H - 1, leafT]} c={style.leaf} rough={0.45} />
            {[H * 0.72, H * 0.3].map((y, i) =>
              [-1, 1].map((side) => (
                <Part
                  key={`${i}-${side}`}
                  p={[leafW / 2 + 1, y, side * (leafT / 2 + 0.4)]}
                  s={[panelW, i === 0 ? H * 0.32 : H * 0.42, 0.8]}
                  c={style.panel}
                  rough={0.5}
                />
              )),
            )}
          </>
        )}
        {[-1, 1].map((side) => (
          <group key={side}>
            <Part p={[leafW - 6, 100, side * (leafT / 2 + 0.6)]} s={[4, 16, 1.2]} c={CHROME} metal={0.9} rough={0.2} />
            <Part p={[leafW - 11, 104, side * (leafT / 2 + 3)]} s={[12, 1.8, 1.8]} c={CHROME} metal={0.9} rough={0.15} />
          </group>
        ))}
        {[30, H - 30].map((y) => (
          <Cyl key={y} p={[0.5, y, 0]} r={1} h={10} c={CHROME} metal={0.9} rough={0.2} />
        ))}
      </group>
    </group>
  );
}

const WALL_THICKNESS = 8;
const BALCONY_DEPTH = 120;
const RAIL_HEIGHT = 100;

/** Deck in local space: runs along x, extends outward along +z from the wall face. */
function Deck({ A, D }: { A: number; D: number }) {
  const posts: number[] = [];
  const bays = Math.max(1, Math.ceil(A / 80));
  for (let i = 0; i <= bays; i++) posts.push(-A / 2 + 2 + ((A - 4) * i) / bays);
  return (
    <>
      <Part p={[0, -6, D / 2]} s={[A, 12, D]} c="#c9c2b6" rough={0.7} />
      <Part p={[0, 0.3, D / 2]} s={[A - 4, 0.6, D - 4]} c="#b98f6a" rough={0.6} />
      <Part p={[0, RAIL_HEIGHT / 2, D - 2]} s={[A, RAIL_HEIGHT - 6, 1.5]} c={GLASS} rough={0.05} opacity={0.3} />
      <Part p={[-A / 2 + 2, RAIL_HEIGHT / 2, D / 2]} s={[1.5, RAIL_HEIGHT - 6, D]} c={GLASS} rough={0.05} opacity={0.3} />
      <Part p={[A / 2 - 2, RAIL_HEIGHT / 2, D / 2]} s={[1.5, RAIL_HEIGHT - 6, D]} c={GLASS} rough={0.05} opacity={0.3} />
      <Part p={[0, RAIL_HEIGHT, D - 2]} s={[A, 4, 5]} c={STEEL} metal={0.8} rough={0.25} />
      <Part p={[-A / 2 + 2, RAIL_HEIGHT, D / 2]} s={[5, 4, D]} c={STEEL} metal={0.8} rough={0.25} />
      <Part p={[A / 2 - 2, RAIL_HEIGHT, D / 2]} s={[5, 4, D]} c={STEEL} metal={0.8} rough={0.25} />
      {posts.map((x) => (
        <Cyl key={x} p={[x, RAIL_HEIGHT / 2, D - 2]} r={2} h={RAIL_HEIGHT} c={STEEL} metal={0.8} rough={0.25} />
      ))}
      <Cyl p={[-A / 2 + 2, RAIL_HEIGHT / 2, D / 2]} r={2} h={RAIL_HEIGHT} c={STEEL} metal={0.8} rough={0.25} />
      <Cyl p={[A / 2 - 2, RAIL_HEIGHT / 2, D / 2]} r={2} h={RAIL_HEIGHT} c={STEEL} metal={0.8} rough={0.25} />
      <group position={[A / 2 - 28, 0, D - 28]}>
        <Cyl p={[0, 15, 0]} r={13} rTop={16} h={30} c="#b5643c" rough={0.8} />
        <Cyl p={[0, 29.5, 0]} r={15} h={1} c="#4a3426" />
        <mesh position={[0, 52, 0]} castShadow>
          <sphereGeometry args={[22, 16, 12]} />
          <meshStandardMaterial color="#5f9a5c" roughness={0.9} />
        </mesh>
      </group>
    </>
  );
}

/** Outdoor balcony attached outside whichever wall the balcony door is closest to. */
export function BalconyDeck({ fixed, room }: { fixed: FixedObject; room: Room }) {
  const box = closedFixedFootprint(fixed);
  const gaps = {
    top: box.y,
    bottom: room.widthCm - (box.y + box.h),
    left: box.x,
    right: room.lengthCm - (box.x + box.w),
  };
  const side = (Object.keys(gaps) as (keyof typeof gaps)[]).reduce((a, b) =>
    gaps[b] < gaps[a] ? b : a,
  );
  const cx = box.x + box.w / 2 - room.lengthCm / 2;
  const cz = box.y + box.h / 2 - room.widthCm / 2;
  const outX = room.lengthCm / 2 + WALL_THICKNESS;
  const outZ = room.widthCm / 2 + WALL_THICKNESS;
  const place: Record<typeof side, { p: Vec3; yaw: number }> = {
    top: { p: [cx, 0, -outZ], yaw: Math.PI },
    bottom: { p: [cx, 0, outZ], yaw: 0 },
    left: { p: [-outX, 0, cz], yaw: -Math.PI / 2 },
    right: { p: [outX, 0, cz], yaw: Math.PI / 2 },
  };
  const { p, yaw } = place[side];
  return (
    <group position={p} rotation={[0, yaw, 0]}>
      <Deck A={Math.max(fixed.lengthCm + 80, 180)} D={BALCONY_DEPTH} />
    </group>
  );
}

function KitchenFloor({ L, W }: { L: number; W: number }) {
  return <Part p={[0, 0.4, 0]} s={[L, 0.8, W]} c="#d9cfbf" rough={0.5} />;
}

function WashroomShell({ L, W }: { L: number; W: number }) {
  const height = 220;
  const t = 6;
  const wall = { c: "#a9bccb", opacity: 0.22 };
  return (
    <>
      <Part p={[0, 0.4, 0]} s={[L, 0.8, W]} c="#c5d3dd" rough={0.3} />
      <Part p={[0, height / 2, -W / 2 + t / 2]} s={[L, height, t]} {...wall} />
      <Part p={[-L / 2 + t / 2, height / 2, 0]} s={[t, height, W]} {...wall} />
      <Part p={[L / 2 - t / 2, height / 2, 0]} s={[t, height, W]} {...wall} />
      <Part p={[0, height / 2, W / 2 - t / 2]} s={[L, height, t]} {...wall} />
    </>
  );
}

function modelFor(kind: FixedKind, L: number, W: number) {
  switch (kind) {
    case "kitchen":
      return <KitchenFloor L={L} W={W} />;
    case "washroom":
      return <WashroomShell L={L} W={W} />;
    case "kitchen_slab":
    case "kitchen_counter":
      return <BaseCabinet L={L} W={W} />;
    case "washroom_slab":
      return <BaseCabinet L={L} W={W} top="#e8e2d8" height={85} backsplash={false} />;
    case "kitchen_sink":
      return <KitchenSink L={L} W={W} />;
    case "kitchen_tap":
      return <Tap base={COUNTER_TOP} />;
    case "washroom_tap":
      return <Tap base={85} />;
    case "kitchen_stove":
      return <Stove L={L} W={W} />;
    case "kitchen_chimney":
      return <Chimney L={L} W={W} />;
    case "kitchen_fridge":
      return <Fridge L={L} W={W} />;
    case "kitchen_washer":
    case "washroom_washer":
      return <Washer L={L} W={W} />;
    case "washroom_toilet":
      return <Toilet L={L} W={W} />;
    case "washroom_basin":
      return <Basin L={L} W={W} />;
    case "washroom_shower":
      return <Shower L={L} W={W} />;
    case "window":
      return <WindowModel L={L} W={W} />;
    case "wardrobe":
      return <Almirah B={L} D={W} />;
    default:
      return null;
  }
}

export function hasFixtureModel(kind: FixedKind) {
  return modelFor(kind, 1, 1) !== null;
}

export function FixtureModel({
  fixed,
  room,
}: {
  fixed: FixedObject;
  room: Room;
}) {
  const box = fixedFootprint(fixed);
  const cx = box.x + box.w / 2 - room.lengthCm / 2;
  const cz = box.y + box.h / 2 - room.widthCm / 2;
  const yaw = (-fixed.rotation * Math.PI) / 180;
  return (
    <group position={[cx, 0, cz]} rotation={[0, yaw, 0]}>
      {modelFor(fixed.kind, fixed.lengthCm, fixed.widthCm)}
    </group>
  );
}
