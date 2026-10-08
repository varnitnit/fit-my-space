"use client";

import type { EvaluatedPlacement, Room, Thing } from "@/lib/types";

type Vec3 = [number, number, number];

function Part({
  p,
  s,
  c,
  rough = 0.6,
  opacity,
}: {
  p: Vec3;
  s: Vec3;
  c: string;
  rough?: number;
  opacity?: number;
}) {
  return (
    <mesh position={p} castShadow receiveShadow>
      <boxGeometry args={s} />
      <meshStandardMaterial
        color={c}
        roughness={rough}
        transparent={opacity !== undefined}
        opacity={opacity ?? 1}
      />
    </mesh>
  );
}

const WOOD = "#7a5638";
const HEADBOARD = "#8a6f5a";
const MATTRESS = "#f4f1ea";
const DUVET = "#7d9bc1";
const PILLOW = "#fbfaf7";

export function isBed(thing: Thing) {
  return /\bbed\b|\bcot\b|\bbunk\b/i.test(thing.name);
}

/** Bed with width B along x and length D along z; headboard at -z. */
function Bed({ B, D }: { B: number; D: number }) {
  const pillows = B >= 140 ? 2 : 1;
  const pillowW = Math.min(65, (B - 16) / pillows - 6);
  const legInset = 6;
  return (
    <>
      {[
        [-B / 2 + legInset, -D / 2 + legInset],
        [B / 2 - legInset, -D / 2 + legInset],
        [-B / 2 + legInset, D / 2 - legInset],
        [B / 2 - legInset, D / 2 - legInset],
      ].map(([x, z]) => (
        <Part key={`${x}-${z}`} p={[x, 5, z]} s={[6, 10, 6]} c={WOOD} />
      ))}
      <Part p={[0, 22, 0]} s={[B, 24, D]} c={WOOD} rough={0.5} />
      <Part p={[0, 44, 2]} s={[B - 4, 20, D - 8]} c={MATTRESS} rough={0.8} />
      <Part
        p={[0, 55, D / 2 - D * 0.3 - 2]}
        s={[B, 4, D * 0.6]}
        c={DUVET}
        rough={0.9}
      />
      <Part
        p={[0, 46, D / 2 - 1]}
        s={[B, 20, 2]}
        c={DUVET}
        rough={0.9}
      />
      {Array.from({ length: pillows }, (_, i) => {
        const x = pillows === 1 ? 0 : (i === 0 ? -1 : 1) * (pillowW / 2 + 4);
        return (
          <Part
            key={i}
            p={[x, 59, -D / 2 + 26]}
            s={[pillowW, 10, 34]}
            c={PILLOW}
            rough={0.9}
          />
        );
      })}
      <Part p={[0, 55, -D / 2 + 3]} s={[B + 4, 110, 6]} c={HEADBOARD} rough={0.85} />
      <Part p={[0, 111, -D / 2 + 3]} s={[B + 6, 4, 8]} c={WOOD} rough={0.5} />
    </>
  );
}

const SOFA_FRAME = "#5f6f7e";
const SOFA_CUSHION = "#7d90a1";
const SOFA_PILLOW = "#d9b46a";
const LEG = "#3a2c22";

export function isSofa(thing: Thing) {
  return /sofa|couch|settee/i.test(thing.name);
}

/** Sofa with seat length B along x and depth D along z; backrest at -z. */
function Sofa({ B, D }: { B: number; D: number }) {
  const arm = Math.min(18, B * 0.1);
  const seatW = B - arm * 2;
  const seats = Math.max(1, Math.round(seatW / 65));
  const cushionW = seatW / seats;
  const backD = Math.min(20, D * 0.25);
  const seatD = D - backD;
  const seatZ = -D / 2 + backD + seatD / 2;
  return (
    <>
      {[
        [-B / 2 + 6, -D / 2 + 6],
        [B / 2 - 6, -D / 2 + 6],
        [-B / 2 + 6, D / 2 - 6],
        [B / 2 - 6, D / 2 - 6],
      ].map(([x, z]) => (
        <Part key={`${x}-${z}`} p={[x, 4, z]} s={[5, 8, 5]} c={LEG} />
      ))}
      <Part p={[0, 17, 0]} s={[B, 18, D]} c={SOFA_FRAME} rough={0.9} />
      <Part p={[0, 50, -D / 2 + backD / 2]} s={[B, 48, backD]} c={SOFA_FRAME} rough={0.9} />
      {[-1, 1].map((side) => (
        <Part
          key={side}
          p={[side * (B / 2 - arm / 2), 38, 0]}
          s={[arm, 24, D]}
          c={SOFA_FRAME}
          rough={0.9}
        />
      ))}
      {Array.from({ length: seats }, (_, i) => {
        const x = -seatW / 2 + cushionW * (i + 0.5);
        return (
          <group key={i}>
            <Part p={[x, 33, seatZ + 1]} s={[cushionW - 2, 14, seatD - 2]} c={SOFA_CUSHION} rough={0.95} />
            <Part p={[x, 56, -D / 2 + backD + 6]} s={[cushionW - 3, 34, 12]} c={SOFA_CUSHION} rough={0.95} />
          </group>
        );
      })}
      {seats >= 2 &&
        [-1, 1].map((side) => (
          <Part
            key={side}
            p={[side * (seatW / 2 - 18), 52, -D / 2 + backD + 16]}
            s={[30, 28, 8]}
            c={SOFA_PILLOW}
            rough={0.95}
          />
        ))}
    </>
  );
}

export function isAlmirah(thing: Thing) {
  return /almirah|wardrobe|cupboard|closet/i.test(thing.name);
}

function isSteel(name: string) {
  return /steel|metal|godrej/i.test(name);
}

const ALMIRAH_HEIGHT = 200;

/** Almirah with width B along x and depth D along z; doors face +z. */
export function Almirah({
  B,
  D,
  steel = false,
}: {
  B: number;
  D: number;
  steel?: boolean;
}) {
  const body = steel ? "#8e9a96" : "#8b5e3c";
  const door = steel ? "#9aa7a2" : "#9a6a45";
  const doors = Math.max(2, Math.round(B / 50));
  const doorW = B / doors;
  const bodyH = ALMIRAH_HEIGHT - 10;
  const front = D / 2;
  const half = doors / 2;
  return (
    <>
      <Part p={[0, 3, 0]} s={[B - 4, 6, D - 4]} c={LEG} />
      <Part p={[0, 6 + bodyH / 2, 0]} s={[B, bodyH, D]} c={body} rough={steel ? 0.4 : 0.6} />
      <Part p={[0, ALMIRAH_HEIGHT - 2, 0]} s={[B + 4, 4, D + 3]} c={body} rough={0.5} />
      {Array.from({ length: doors }, (_, i) => {
        const x = -B / 2 + doorW * (i + 0.5);
        const handleX = i < half ? x + doorW / 2 - 5 : x - doorW / 2 + 5;
        return (
          <group key={i}>
            <Part
              p={[x, 6 + bodyH / 2, front + 0.6]}
              s={[doorW - 1, bodyH - 8, 1.2]}
              c={door}
              rough={steel ? 0.35 : 0.55}
            />
            {!steel && (
              <Part
                p={[x, 6 + bodyH * 0.62, front + 1.4]}
                s={[doorW - 14, bodyH * 0.55, 0.6]}
                c={body}
                rough={0.6}
              />
            )}
            <Part
              p={[handleX, 6 + bodyH * 0.5, front + 2]}
              s={[1.6, 22, 1.6]}
              c="#d9dee2"
              rough={0.2}
            />
          </group>
        );
      })}
      <Part p={[0, 6 + bodyH * 0.5 - 16, front + 1.5]} s={[1.6, 3, 0.6]} c="#2b2f33" />
    </>
  );
}

export function FurnitureModel({
  item,
  thing,
  room,
}: {
  item: EvaluatedPlacement;
  thing: Thing;
  room: Room;
}) {
  const box = item.footprint;
  const cx = box.x + box.w / 2 - room.lengthCm / 2;
  const cz = box.y + box.h / 2 - room.widthCm / 2;
  const yaw = (-item.rotation * Math.PI) / 180;
  const L = thing.lengthCm;
  const W = thing.widthCm;
  const statusColor = item.status === "PASS" ? "#4fb37a" : "#e05a5a";

  if (isBed(thing)) {
    const longAlongX = L >= W;
    return (
      <group position={[cx, 0, cz]} rotation={[0, yaw, 0]}>
        <Part p={[0, 0.5, 0]} s={[L + 6, 1, W + 6]} c={statusColor} opacity={0.75} />
        <group rotation={[0, longAlongX ? Math.PI / 2 : 0, 0]}>
          <Bed B={Math.min(L, W)} D={Math.max(L, W)} />
        </group>
      </group>
    );
  }

  if (isAlmirah(thing)) {
    const longAlongX = L >= W;
    return (
      <group position={[cx, 0, cz]} rotation={[0, yaw, 0]}>
        <Part p={[0, 0.5, 0]} s={[L + 6, 1, W + 6]} c={statusColor} opacity={0.75} />
        <group rotation={[0, longAlongX ? 0 : Math.PI / 2, 0]}>
          <Almirah
            B={Math.max(L, W)}
            D={Math.min(L, W)}
            steel={isSteel(thing.name)}
          />
        </group>
      </group>
    );
  }

  if (isSofa(thing)) {
    const longAlongX = L >= W;
    return (
      <group position={[cx, 0, cz]} rotation={[0, yaw, 0]}>
        <Part p={[0, 0.5, 0]} s={[L + 6, 1, W + 6]} c={statusColor} opacity={0.75} />
        <group rotation={[0, longAlongX ? 0 : Math.PI / 2, 0]}>
          <Sofa B={Math.max(L, W)} D={Math.min(L, W)} />
        </group>
      </group>
    );
  }

  return (
    <group position={[cx, 0, cz]} rotation={[0, yaw, 0]}>
      <Part
        p={[0, 40, 0]}
        s={[L, 80, W]}
        c={item.status === "PASS" ? "#6fbf8e" : "#e07a7a"}
      />
    </group>
  );
}
