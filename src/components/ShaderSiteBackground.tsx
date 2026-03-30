import { Suspense } from "react";
import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react";

const ShaderSiteBackground = () => (
  <div
    aria-hidden
    className="pointer-events-none fixed inset-0 z-0"
    style={{ width: "100vw", height: "100vh", opacity: 0.35 }}
  >
    <ShaderGradientCanvas
      fov={45}
      lazyLoad={false}
      pixelDensity={1.7}
      pointerEvents="none"
      style={{ width: "100%", height: "100%" }}
    >
      <Suspense fallback={null}>
        <ShaderGradient
          animate="on"
          brightness={0.9}
          cAzimuthAngle={200}
          cDistance={4.2}
          cPolarAngle={80}
          cameraZoom={1}
          color1="#030712"     // deep slate to match body bg
          color2="#00f0ff"     // neon cyan accent
          color3="#ff3cff"     // neon magenta accent
          envPreset="dawn"
          grain="on"
          lightType="3d"
          loop="on"
          loopDuration={45}
          positionX={-0.8}
          positionY={-0.2}
          positionZ={0}
          range="enabled"
          rangeEnd={4.3}
          rangeStart={0.3}
          reflection={0.2}
          rotationX={-5}
          rotationY={18}
          rotationZ={35}
          shader="defaults"
          toggleAxis={false}
          type="plane"
          uAmplitude={0.7}
          uDensity={0.75}
          uFrequency={4.8}
          uSpeed={0.35}
          uStrength={0.9}
          uTime={0}
          wireframe={false}
          zoomOut={false}
        />
      </Suspense>
    </ShaderGradientCanvas>
  </div>
);

export default ShaderSiteBackground;
