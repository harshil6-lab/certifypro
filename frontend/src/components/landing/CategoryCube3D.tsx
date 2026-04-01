import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Edges, Html, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

type CategoryCube3DProps = {
  categories: string[];
};

type BrickBody = {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  size: THREE.Vector3;
  color: THREE.Color;
  accent: THREE.Color;
  anchor: THREE.Vector3;
  travel: THREE.Vector3;
  phase: number;
  speed: number;
  hoveredSpeed: number;
};

const WALL_BOUNDS = new THREE.Vector3(3.75, 2.3, 2.45);
const CUBE_SIZE: [number, number, number] = [8.0, 5.0, 5.4];
const SLOT_ANCHORS = [
  new THREE.Vector3(-2.2, 1.05, 0.7),
  new THREE.Vector3(0, 1.15, 0.35),
  new THREE.Vector3(2.2, 1.02, 0.65),
  new THREE.Vector3(-2.35, -0.05, -0.1),
  new THREE.Vector3(0, -0.15, 0.45),
  new THREE.Vector3(2.35, -0.08, -0.15),
  new THREE.Vector3(0, -1.25, 0.15),
  new THREE.Vector3(-2.1, -1.15, 0.55),
  new THREE.Vector3(2.1, -1.22, 0.55),
];

function createBrickBodies(categories: string[]) {
  const palette = [
    ["#295c86", "#8fc8ff"],
    ["#4d668b", "#d4dcff"],
    ["#8d6b2d", "#f2d98b"],
    ["#2f7667", "#97e3cb"],
    ["#456aa2", "#b8cbff"],
    ["#7d5c93", "#e1c1ff"],
    ["#8b5a46", "#ffc6a7"],
    ["#245b73", "#95daff"],
    ["#5f658e", "#dbdeff"],
  ];

  return categories.map((_, index) => {
    const size = new THREE.Vector3(1.58 + (index % 3) * 0.1, 0.82 + (index % 2) * 0.04, 0.5);
    const anchor = SLOT_ANCHORS[index % SLOT_ANCHORS.length].clone();
    const travel = new THREE.Vector3(0.34 + (index % 2) * 0.08, 0.16 + (index % 3) * 0.02, 0.12 + (index % 2) * 0.03);
    const [base, accent] = palette[index % palette.length];
    const position = anchor.clone();

    return {
      position,
      velocity: new THREE.Vector3(),
      size,
      color: new THREE.Color(base),
      accent: new THREE.Color(accent),
      anchor,
      travel,
      phase: index * 0.8,
      speed: 0.42 + (index % 3) * 0.06,
      hoveredSpeed: 0.18,
    } as BrickBody;
  });
}

function resolveWallBounce(body: BrickBody) {
  const halfX = body.size.x * 0.5;
  const halfY = body.size.y * 0.5;
  const halfZ = body.size.z * 0.5;

  if (body.position.x + halfX > WALL_BOUNDS.x) {
    body.position.x = WALL_BOUNDS.x - halfX;
    body.velocity.x *= -0.96;
  } else if (body.position.x - halfX < -WALL_BOUNDS.x) {
    body.position.x = -WALL_BOUNDS.x + halfX;
    body.velocity.x *= -0.96;
  }

  if (body.position.y + halfY > WALL_BOUNDS.y) {
    body.position.y = WALL_BOUNDS.y - halfY;
    body.velocity.y *= -0.96;
  } else if (body.position.y - halfY < -WALL_BOUNDS.y) {
    body.position.y = -WALL_BOUNDS.y + halfY;
    body.velocity.y *= -0.96;
  }

  if (body.position.z + halfZ > WALL_BOUNDS.z) {
    body.position.z = WALL_BOUNDS.z - halfZ;
    body.velocity.z *= -0.96;
  } else if (body.position.z - halfZ < -WALL_BOUNDS.z) {
    body.position.z = -WALL_BOUNDS.z + halfZ;
    body.velocity.z *= -0.96;
  }
}

function resolveBrickCollision(a: BrickBody, b: BrickBody) {
  const overlapX = a.size.x * 0.5 + b.size.x * 0.5 - Math.abs(a.position.x - b.position.x);
  const overlapY = a.size.y * 0.5 + b.size.y * 0.5 - Math.abs(a.position.y - b.position.y);
  const overlapZ = a.size.z * 0.5 + b.size.z * 0.5 - Math.abs(a.position.z - b.position.z);

  if (overlapX <= 0 || overlapY <= 0 || overlapZ <= 0) {
    return;
  }

  if (overlapX < overlapY && overlapX < overlapZ) {
    const direction = a.position.x < b.position.x ? -1 : 1;
    const push = overlapX * 0.5;
    a.position.x += direction * push;
    b.position.x -= direction * push;
    const oldA = a.velocity.x;
    a.velocity.x = THREE.MathUtils.lerp(a.velocity.x, b.velocity.x, 0.58) * 0.94;
    b.velocity.x = THREE.MathUtils.lerp(b.velocity.x, oldA, 0.58) * 0.94;
  } else if (overlapY < overlapZ) {
    const direction = a.position.y < b.position.y ? -1 : 1;
    const push = overlapY * 0.5;
    a.position.y += direction * push;
    b.position.y -= direction * push;
    const oldA = a.velocity.y;
    a.velocity.y = THREE.MathUtils.lerp(a.velocity.y, b.velocity.y, 0.58) * 0.94;
    b.velocity.y = THREE.MathUtils.lerp(b.velocity.y, oldA, 0.58) * 0.94;
  } else {
    const direction = a.position.z < b.position.z ? -1 : 1;
    const push = overlapZ * 0.5;
    a.position.z += direction * push;
    b.position.z -= direction * push;
    const oldA = a.velocity.z;
    a.velocity.z = THREE.MathUtils.lerp(a.velocity.z, b.velocity.z, 0.58) * 0.94;
    b.velocity.z = THREE.MathUtils.lerp(b.velocity.z, oldA, 0.58) * 0.94;
  }
}

function BrickField({ categories, scrollRotation }: { categories: string[]; scrollRotation: number }) {
  const cubeRef = useRef<THREE.Group>(null);
  const brickRefs = useRef<Array<THREE.Mesh | null>>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const hoveredRef = useRef<number | null>(null);
  const draggedRef = useRef<number | null>(null);
  const bodies = useMemo(() => createBrickBodies(categories), [categories]);

  useEffect(() => {
    hoveredRef.current = hoveredIndex;
  }, [hoveredIndex]);

  useEffect(() => {
    draggedRef.current = draggedIndex;
  }, [draggedIndex]);

  useFrame((state, dt) => {
    const delta = Math.min(dt, 0.033);
    const camera = state.camera;

    for (let i = 0; i < bodies.length; i += 1) {
      const body = bodies[i];
      const isHovered = hoveredRef.current === i;
      const isDragged = draggedRef.current === i;
      const currentSpeed = isHovered ? body.hoveredSpeed : body.speed;

      if (!isDragged) {
        body.phase += delta * currentSpeed;
        body.position.set(
          body.anchor.x + Math.sin(body.phase * 1.25) * body.travel.x,
          body.anchor.y + Math.cos(body.phase * 1.05 + i * 0.4) * body.travel.y,
          body.anchor.z + Math.sin(body.phase * 0.95 + i * 0.6) * body.travel.z
        );
      }

      resolveWallBounce(body);
    }

    for (let i = 0; i < bodies.length; i += 1) {
      const mesh = brickRefs.current[i];
      if (!mesh) {
        continue;
      }

      const body = bodies[i];
      const t = state.clock.elapsedTime;
      const hoverBoost = hoveredRef.current === i ? 1 : 0;

      mesh.position.copy(body.position);
      mesh.rotation.x = Math.sin(t * 0.22 + i * 0.4) * 0.03;
      mesh.rotation.y = Math.cos(t * 0.2 + i * 0.5) * 0.08;
      mesh.rotation.z = Math.sin(t * 0.18 + i * 0.6) * 0.015;

      const targetScale = hoverBoost ? 1.09 : 1;
      mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.14);
    }

    if (cubeRef.current) {
      cubeRef.current.position.y = THREE.MathUtils.lerp(
        cubeRef.current.position.y,
        Math.sin(state.clock.elapsedTime * 0.42) * 0.08,
        0.06
      );
      cubeRef.current.position.x = THREE.MathUtils.lerp(
        cubeRef.current.position.x,
        Math.cos(state.clock.elapsedTime * 0.27) * 0.04,
        0.05
      );
      cubeRef.current.rotation.x = THREE.MathUtils.lerp(
        cubeRef.current.rotation.x,
        0.1 + scrollRotation * 0.14 + Math.sin(state.clock.elapsedTime * 0.25) * 0.025,
        0.08
      );
      cubeRef.current.rotation.y = THREE.MathUtils.lerp(
        cubeRef.current.rotation.y,
        -0.18 + scrollRotation * 0.14 + Math.cos(state.clock.elapsedTime * 0.2) * 0.025,
        0.08
      );
      cubeRef.current.rotation.z = THREE.MathUtils.lerp(
        cubeRef.current.rotation.z,
        Math.sin(state.clock.elapsedTime * 0.3) * 0.025,
        0.07
      );
    }
  });

  return (
    <group ref={cubeRef}>
      <ambientLight intensity={0.74} color="#d7e5ff" />
      <pointLight position={[6, 4, 6]} intensity={1.25} color="#9cc6ff" />
      <pointLight position={[-6, -2, -4]} intensity={1} color="#cfd7ea" />
      <pointLight position={[0, 2, 2]} intensity={0.95} color="#f0d89c" />

      <mesh>
        <boxGeometry args={CUBE_SIZE} />
        <meshPhysicalMaterial
          transparent
          opacity={0.08}
          roughness={0.18}
          metalness={0.08}
          transmission={0.5}
          thickness={0.65}
          ior={1.25}
          color="#d9e4f6"
          envMapIntensity={1}
          clearcoat={1}
          clearcoatRoughness={0.12}
          side={THREE.DoubleSide}
        />
        <Edges color="#9bb0cf" linewidth={1.2} />
      </mesh>

      {bodies.map((body, index) => {
        const isHovered = hoveredIndex === index;
        return (
          <group key={categories[index]}>
            <RoundedBox
              ref={(el) => {
                brickRefs.current[index] = el as THREE.Mesh;
              }}
              args={[body.size.x, body.size.y, body.size.z]}
              radius={0.12}
              smoothness={8}
              onPointerDown={(event) => {
                event.stopPropagation();
                setDraggedIndex(index);
                if (event.pointerId !== undefined) {
                  (event.target as unknown as { setPointerCapture: (pointerId: number) => void }).setPointerCapture(
                    event.pointerId
                  );
                }
              }}
              onPointerMove={(event) => {
                if (draggedRef.current !== index) {
                  return;
                }

                event.stopPropagation();
                body.anchor.x = THREE.MathUtils.clamp(event.point.x, -2.55, 2.55);
                body.anchor.y = THREE.MathUtils.clamp(event.point.y, -1.45, 1.45);
              }}
              onPointerUp={(event) => {
                event.stopPropagation();
                if (event.pointerId !== undefined) {
                  (
                    event.target as unknown as {
                      releasePointerCapture: (pointerId: number) => void;
                    }
                  ).releasePointerCapture(event.pointerId);
                }
                setDraggedIndex(null);
              }}
              onPointerLeave={(event) => {
                if (draggedRef.current !== index) {
                  return;
                }

                if (event.pointerId !== undefined) {
                  (
                    event.target as unknown as {
                      releasePointerCapture: (pointerId: number) => void;
                    }
                  ).releasePointerCapture(event.pointerId);
                }
                setDraggedIndex(null);
              }}
              onPointerOver={() => setHoveredIndex(index)}
              onPointerOut={() => setHoveredIndex(null)}
            >
              <meshPhysicalMaterial
                color={body.color}
                emissive={body.accent.clone().multiplyScalar(0.44)}
                emissiveIntensity={isHovered ? 0.92 : 0.52}
                transparent
                opacity={1}
                roughness={0.1}
                metalness={0.38}
                clearcoat={1}
                clearcoatRoughness={0.04}
                transmission={0.02}
              />
              <Edges color="#f8fbff" linewidth={1.8} />

              <mesh position={[0, body.size.y * 0.18, body.size.z * 0.52]}>
                <planeGeometry args={[body.size.x * 0.88, body.size.y * 0.18]} />
                <meshBasicMaterial color={body.accent} transparent opacity={0.92} />
              </mesh>

              <mesh position={[-body.size.x * 0.35, body.size.y * 0.03, body.size.z * 0.53]}>
                <circleGeometry args={[0.072, 28]} />
                <meshBasicMaterial color="#f8fbff" transparent opacity={0.84} />
              </mesh>

              <mesh position={[body.size.x * 0.16, -body.size.y * 0.2, body.size.z * 0.53]}>
                <planeGeometry args={[body.size.x * 0.44, body.size.y * 0.08]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
              </mesh>

              <Html transform position={[0, -0.02, body.size.z * 0.56]} distanceFactor={7.6} occlude={false}>
                <div
                  className="flex min-w-[128px] items-center gap-2 rounded-xl border border-white/60 bg-[linear-gradient(135deg,rgba(8,15,28,0.88),rgba(15,32,56,0.92))] px-3 py-2 text-left shadow-[0_18px_30px_-18px_rgba(15,23,42,0.88)] backdrop-blur-md"
                  style={{
                    width: `${Math.max(138, body.size.x * 86)}px`,
                    boxShadow: `0 16px 28px -18px ${body.accent.clone().multiplyScalar(1.08).getStyle()}, inset 0 1px 0 rgba(255,255,255,0.24)`,
                  }}
                >
                  <div
                    className="h-9 w-1.5 rounded-full"
                    style={{ background: `linear-gradient(180deg, ${body.accent.getStyle()}, rgba(255,255,255,0.82))` }}
                  />
                  <div className="min-w-0 flex-1">
                    <div
                      className="mb-1 h-[4px] rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${body.accent.getStyle()}, rgba(255,255,255,0.88))`,
                      }}
                    />
                    <div className="truncate text-[14px] font-extrabold tracking-[0.01em] text-white sm:text-[15px]">
                      {categories[index]}
                    </div>
                  </div>
                </div>
              </Html>
            </RoundedBox>
          </group>
        );
      })}
    </group>
  );
}

export function CategoryCube3D({ categories }: CategoryCube3DProps) {
  const [scrollRotation, setScrollRotation] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const top = window.scrollY || window.pageYOffset;
      const normalized = Math.min(top / Math.max(window.innerHeight, 1), 1.2);
      setScrollRotation(normalized * 0.4);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-300/70 bg-[radial-gradient(circle_at_16%_18%,rgba(99,129,181,0.12),transparent_36%),radial-gradient(circle_at_84%_82%,rgba(181,156,114,0.1),transparent_40%),linear-gradient(135deg,#f8fafc_0%,#eef2f8_46%,#e8edf6_100%)] p-3 sm:p-4 shadow-[0_20px_50px_-26px_rgba(30,58,138,0.28)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.45)_0%,rgba(255,255,255,0.08)_38%,rgba(255,255,255,0.24)_60%,rgba(255,255,255,0.06)_100%)]" />
      <div className="pointer-events-none absolute inset-[1px] rounded-[22px] border border-white/40 opacity-80" />
      <div className="pointer-events-none absolute inset-y-0 left-[-18%] w-[30%] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.5),transparent)] opacity-70 blur-xl" style={{ transform: "skewX(-18deg) translateX(0%)", animation: "category-cube-shine 7s linear infinite" }} />

      <style>{`
        @keyframes category-cube-shine {
          0% { transform: skewX(-18deg) translateX(-20%); opacity: 0; }
          12% { opacity: 0.68; }
          50% { opacity: 0.42; }
          100% { transform: skewX(-18deg) translateX(430%); opacity: 0; }
        }
      `}</style>

      <div className="relative z-10 mb-3 inline-flex items-center rounded-xl border border-slate-300 bg-white/85 px-5 py-2.5 text-lg font-heading font-semibold tracking-tight text-slate-800 backdrop-blur-sm sm:text-2xl">
        Certificate library Coming Soon
      </div>

      <div className="relative h-[360px] w-full overflow-hidden rounded-2xl border border-slate-300/80 bg-[linear-gradient(180deg,rgba(242,246,252,0.78),rgba(229,236,246,0.82))] backdrop-blur-sm sm:h-[450px]">
        <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/45 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2),0_0_48px_-36px_rgba(148,163,184,0.75)]" />
        <Canvas
          dpr={[1, 1.6]}
          camera={{ position: [0, 0, 8.2], fov: 34 }}
          gl={{ antialias: true, alpha: true }}
        >
          <BrickField categories={categories} scrollRotation={scrollRotation} />
        </Canvas>
      </div>
    </div>
  );
}
