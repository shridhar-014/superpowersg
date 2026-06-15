import { geoMercator, geoPath, geoGraticule10 } from "d3-geo";
import { feature } from "topojson-client";
import worldData from "world-atlas/countries-110m.json";

// Real country boundaries (TopoJSON) projected to the canvas. Everything below
// is computed once at module load — it's static for the whole video.
const WIDTH = 1920;
const HEIGHT = 1080;

// The slice of the world we want framed: India across to Hong Kong.
// Use corner POINTS (a MultiPoint) rather than a Polygon — a spherical
// polygon's ring winding can make d3-geo fit the whole globe by mistake.
const REGION = {
  type: "MultiPoint" as const,
  coordinates: [
    [68, 6],
    [120, 6],
    [120, 38],
    [68, 38],
  ],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const topo = worldData as any;
const countries = feature(topo, topo.objects.countries) as unknown as {
  features: unknown[];
};

// Fit the chosen region into the frame, leaving margins for the title/counter.
export const projection = geoMercator().fitExtent(
  [
    [80, 150],
    [WIDTH - 80, HEIGHT - 130],
  ],
  REGION,
);

const pathGen = geoPath(projection);

export const countryPaths: string[] = countries.features
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .map((f) => pathGen(f as any))
  .filter((d): d is string => Boolean(d));

export const graticulePath = pathGen(geoGraticule10()) ?? "";

export const project = (lon: number, lat: number): { x: number; y: number } => {
  const p = projection([lon, lat]);
  return { x: p ? p[0] : 0, y: p ? p[1] : 0 };
};
