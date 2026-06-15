import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type HelloWorldProps = {
  title: string;
  subtitle: string;
};

// A minimal animated title card. Use this as a starting point:
// - useCurrentFrame() gives the current frame, so every value can be driven by time.
// - interpolate() maps a frame range to a value range (with easing/clamping).
// - spring() produces natural, physics-based motion.
export const HelloWorld: React.FC<HelloWorldProps> = ({ title, subtitle }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Title springs up and fades in over the first ~30 frames.
  const titleProgress = spring({ frame, fps, config: { damping: 200 } });
  const titleY = interpolate(titleProgress, [0, 1], [40, 0]);
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Subtitle follows a few frames later.
  const subtitleOpacity = interpolate(frame, [18, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Gentle fade-out at the end.
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 20, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #0b1f3a 0%, #123a5e 60%, #f2a900 100%)",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        opacity: fadeOut,
      }}
    >
      <div style={{ textAlign: "center", transform: `translateY(${titleY}px)` }}>
        <h1
          style={{
            fontSize: 150,
            fontWeight: 800,
            color: "white",
            margin: 0,
            opacity: titleOpacity,
            letterSpacing: -2,
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: 64,
            fontWeight: 500,
            color: "rgba(255,255,255,0.85)",
            marginTop: 16,
            opacity: subtitleOpacity,
          }}
        >
          {subtitle}
        </p>
      </div>
    </AbsoluteFill>
  );
};
