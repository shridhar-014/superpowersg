import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { countryPaths, graticulePath, project } from "./map";

// ----- Route data -------------------------------------------------------
// Delhi (DEL) -> Hong Kong (HKG). Great-circle distance ~3,760 km, ~5h30m.
// City screen positions come from the SAME projection as the map, so the
// pins and arc sit exactly on real geography.
const DEL = project(77.1, 28.56);
const HKG = project(113.91, 22.31);
const ORIGIN = {
  code: "DEL",
  city: "New Delhi",
  coord: "28.6°N 77.1°E",
  x: DEL.x,
  y: DEL.y,
};
const DEST = {
  code: "HKG",
  city: "Hong Kong",
  coord: "22.3°N 113.9°E",
  x: HKG.x,
  y: HKG.y,
};
// Control point lifted above the cities -> the arc bows north like a real
// great-circle route.
const CONTROL = {
  x: (DEL.x + HKG.x) / 2,
  y: Math.min(DEL.y, HKG.y) - 150,
};
const TOTAL_KM = 3760;

// ----- Quadratic bezier helpers -----------------------------------------
type Pt = { x: number; y: number };
const quadPoint = (p0: Pt, c: Pt, p2: Pt, t: number): Pt => {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * c.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * c.y + t * t * p2.y,
  };
};
const quadAngleDeg = (p0: Pt, c: Pt, p2: Pt, t: number): number => {
  const dx = 2 * (1 - t) * (c.x - p0.x) + 2 * t * (p2.x - c.x);
  const dy = 2 * (1 - t) * (c.y - p0.y) + 2 * t * (p2.y - c.y);
  return (Math.atan2(dy, dx) * 180) / Math.PI;
};

// Approximate arc length by sampling, for the draw-on dash animation.
const PATH_D = `M ${ORIGIN.x} ${ORIGIN.y} Q ${CONTROL.x} ${CONTROL.y} ${DEST.x} ${DEST.y}`;
const PATH_LENGTH = (() => {
  let len = 0;
  let prev = quadPoint(ORIGIN, CONTROL, DEST, 0);
  for (let i = 1; i <= 120; i++) {
    const p = quadPoint(ORIGIN, CONTROL, DEST, i / 120);
    len += Math.hypot(p.x - prev.x, p.y - prev.y);
    prev = p;
  }
  return len;
})();

// Pre-computed star field (deterministic via Remotion's random()).
const STARS = new Array(90).fill(0).map((_, i) => ({
  x: random(`x${i}`) * 1920,
  y: random(`y${i}`) * 1080,
  r: random(`r${i}`) * 1.8 + 0.4,
  tw: random(`t${i}`) * 60,
}));

const CityPin: React.FC<{
  city: typeof ORIGIN;
  pop: number;
  align: "left" | "right";
}> = ({ city, pop, align }) => (
  <g transform={`translate(${city.x} ${city.y})`} opacity={pop}>
    <circle r={26 * pop} fill="#f2a900" opacity={0.18} />
    <circle r={9} fill="#f2a900" stroke="white" strokeWidth={3} />
    <g
      transform={`translate(${align === "left" ? -18 : 18} -16)`}
      textAnchor={align === "left" ? "end" : "start"}
      fontFamily="system-ui, Segoe UI, Roboto, sans-serif"
    >
      <text fill="white" fontSize={42} fontWeight={800}>
        {city.code}
      </text>
      <text fill="rgba(255,255,255,0.85)" fontSize={24} fontWeight={500} y={32}>
        {city.city}
      </text>
      <text fill="rgba(255,255,255,0.5)" fontSize={18} y={58}>
        {city.coord}
      </text>
    </g>
  </g>
);

export const FlightPath: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Pins pop in with spring; destination is delayed.
  const originPop = spring({ frame: frame - 10, fps, config: { damping: 12 } });
  const destPop = spring({ frame: frame - 22, fps, config: { damping: 12 } });

  // Flight progress drives the drawn arc + plane position (ease in/out).
  const progress = interpolate(frame, [28, 212], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  const plane = quadPoint(ORIGIN, CONTROL, DEST, progress);
  const planeAngle = quadAngleDeg(ORIGIN, CONTROL, DEST, progress);
  // Plane appears just after takeoff, lands (shrinks) just before arrival.
  const planeScale =
    interpolate(progress, [0, 0.04], [0, 1], { extrapolateRight: "clamp" }) *
    interpolate(progress, [0.96, 1], [1, 0], { extrapolateLeft: "clamp" });

  const km = Math.round(progress * TOTAL_KM);
  const headerOpacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 18, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(1200px 700px at 50% 30%, #15375e 0%, #0b1f3a 55%, #06101f 100%)",
        opacity: fadeOut,
        fontFamily: "system-ui, Segoe UI, Roboto, sans-serif",
      }}
    >
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        {/* faint geographic graticule (real lon/lat lines) */}
        <path
          d={graticulePath}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={1}
        />

        {/* real country boundaries */}
        <g>
          {countryPaths.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="rgba(58,110,165,0.28)"
              stroke="rgba(255,255,255,0.22)"
              strokeWidth={1}
            />
          ))}
        </g>

        {/* a few stars over the ocean/sky */}
        {STARS.map((s, i) => (
          <circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.r * 0.8}
            fill="white"
            opacity={0.15 + 0.25 * Math.abs(Math.sin((frame + s.tw) / 18))}
          />
        ))}

        {/* planned route (dotted, faint) */}
        <path
          d={PATH_D}
          fill="none"
          stroke="rgba(242,169,0,0.35)"
          strokeWidth={3}
          strokeDasharray="2 12"
          strokeLinecap="round"
        />

        {/* drawn (flown) portion of the route */}
        <path
          d={PATH_D}
          fill="none"
          stroke="#f2a900"
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={PATH_LENGTH}
          strokeDashoffset={PATH_LENGTH * (1 - progress)}
          style={{ filter: "drop-shadow(0 0 8px rgba(242,169,0,0.8))" }}
        />

        <CityPin city={ORIGIN} pop={originPop} align="left" />
        <CityPin city={DEST} pop={destPop} align="right" />

        {/* the plane (Material "flight" icon: 24x24, points up; rotate to heading) */}
        <g
          transform={`translate(${plane.x} ${plane.y}) rotate(${planeAngle + 90}) scale(${planeScale * 3}) translate(-12 -12)`}
          style={{ filter: "drop-shadow(0 0 10px rgba(255,255,255,0.9))" }}
        >
          <path
            d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
            fill="white"
          />
        </g>
      </svg>

      {/* header */}
      <div
        style={{
          position: "absolute",
          top: 70,
          width: "100%",
          textAlign: "center",
          opacity: headerOpacity,
        }}
      >
        <div
          style={{
            color: "rgba(255,255,255,0.6)",
            letterSpacing: 8,
            fontSize: 22,
            fontWeight: 600,
          }}
        >
          FLIGHT PATH
        </div>
        <div style={{ color: "white", fontSize: 60, fontWeight: 800, marginTop: 6 }}>
          {ORIGIN.code} <span style={{ color: "#f2a900" }}>→</span> {DEST.code}
        </div>
      </div>

      {/* live distance counter */}
      <div
        style={{
          position: "absolute",
          bottom: 70,
          width: "100%",
          textAlign: "center",
          opacity: headerOpacity,
        }}
      >
        <span
          style={{
            color: "white",
            fontSize: 56,
            fontWeight: 800,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {km.toLocaleString()}
        </span>
        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 30, marginLeft: 10 }}>
          / {TOTAL_KM.toLocaleString()} km
        </span>
      </div>
    </AbsoluteFill>
  );
};
