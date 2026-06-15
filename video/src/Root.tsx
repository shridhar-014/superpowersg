import { Composition } from "remotion";
import { HelloWorld } from "./HelloWorld";
import { FlightPath } from "./FlightPath";

// Every composition you want to render or preview must be registered here.
// https://www.remotion.dev/docs/the-fundamentals
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="FlightPath"
        component={FlightPath}
        durationInFrames={240} // 8 seconds at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={150} // 5 seconds at 30fps
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: "National Games",
          subtitle: "Goa 2023",
        }}
      />
    </>
  );
};
