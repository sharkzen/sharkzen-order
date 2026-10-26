const SIZE = 29;

/** ตำแหน่งตัวหมุดมุมของ QR (finder pattern) เป็นพิกัดมุมบนซ้ายของบล็อก 7x7 */
const FINDERS = [
  [0, 0],
  [SIZE - 7, 0],
  [0, SIZE - 7],
] as const;

function inFinder(x: number, y: number) {
  return FINDERS.some(
    ([fx, fy]) => x >= fx - 1 && x <= fx + 7 && y >= fy - 1 && y <= fy + 7,
  );
}

/** สุ่มแบบกำหนดผลลัพธ์ตายตัว เพื่อให้ SSR กับ client ได้ลวดลายเดียวกัน */
function filled(x: number, y: number) {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n) > 0.52;
}

const CELLS = Array.from({ length: SIZE * SIZE }, (_, i) => ({
  x: i % SIZE,
  y: Math.floor(i / SIZE),
})).filter(({ x, y }) => !inFinder(x, y) && filled(x, y));

/** ภาพ QR Code เชิงประกอบ (ไม่ใช่ QR ที่สแกนได้จริง) ใช้เป็นองค์ประกอบตกแต่ง */
export function QrArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className={className}
      shapeRendering="crispEdges"
      aria-hidden
    >
      {FINDERS.map(([fx, fy]) => (
        <g key={`${fx}-${fy}`}>
          <rect x={fx} y={fy} width={7} height={7} fill="currentColor" />
          <rect
            x={fx + 1}
            y={fy + 1}
            width={5}
            height={5}
            fill="var(--qr-bg, #fff)"
          />
          <rect
            x={fx + 2}
            y={fy + 2}
            width={3}
            height={3}
            fill="currentColor"
          />
        </g>
      ))}
      {CELLS.map(({ x, y }) => (
        <rect
          key={`${x}-${y}`}
          x={x}
          y={y}
          width={1}
          height={1}
          fill="currentColor"
        />
      ))}
    </svg>
  );
}
