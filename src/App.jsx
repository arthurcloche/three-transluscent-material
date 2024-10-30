/* eslint-disable */
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  OrbitControls,
  MeshTransmissionMaterial,
  Lightformer,
} from "@react-three/drei";
import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useControls } from "leva";
import React from "react";
import {
  EffectComposer,
  Bloom,
  HueSaturation,
  ToneMapping,
} from "@react-three/postprocessing";

export function StarShape({ position, starConfig }) {
  const meshRef = useRef();

  const {
    branches = 8,
    outerRadius = 2,
    innerRadius = 1,
    thickness = 0.4,
    wonkiness = 0.6,
    offset = 0,
    bevelEnabled = true,
    bevelSegments = 1,
    bevelSize = 0.1,
    bevelThickness = 0.1,
  } = starConfig || {};
  const randomIndices = useMemo(
    () => Array.from({ length: 32 }, () => Math.random()),
    []
  );

  useFrame(() => {
    meshRef.current.rotation.y += 0.01;
    meshRef.current.rotation.x += 0.01;
  });

  // Create the star shape
  const shape = new THREE.Shape();
  const points = branches * 2; // Double the points for outer/inner alternation

  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const radius =
      i % 2 === 0
        ? outerRadius + wonkiness * (randomIndices[i] - 0.5) * innerRadius
        : innerRadius;

    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius * (1 + offset);

    if (i === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }
  shape.closePath();

  const extrudeSettings = {
    steps: 1,
    depth: thickness,
    bevelEnabled: bevelEnabled,
    bevelSegments: bevelSegments,
    bevelSize: bevelSize,
    bevelThickness: bevelThickness,
  };
  return (
    <mesh ref={meshRef} position={position}>
      <extrudeGeometry args={[shape, extrudeSettings]} />
      <MeshTransmissionMaterial
        backside
        samples={10}
        resolution={2048}
        transmission={0.8}
        roughness={0.25}
        thickness={0.125}
        ior={1.5}
        chromaticAberration={0.25}
        clearcoat={0.25}
        color="#DDFF9E"
        bg="#fff"
      />
    </mesh>
  );
}

function getRandomParams() {
  return {
    branches: Math.floor(Math.random() * 7) + 8, // 4 to 10 branches
    outerRadius: 0.8 + Math.random() * 0.4, // 0.8 to 1.2
    innerRadius: 0.3 + Math.random() * 0.4, // 0.3 to 0.7
    thickness: 0.2 + Math.random() * 0.8, // 0.2 to 1.0
    wonkiness: Math.random() * 0.4, // 0 to 0.4
    offset: Math.random() * 1 - 0.5, // -0.5 to 0.5
  };
}

// Add this new component above the App component
function BackgroundShapes() {
  return (
    <>
      <mesh position={[-4, -2, -5]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhongMaterial color="#EEFAB3" />
      </mesh>

      <mesh position={[4, 2, -3]}>
        <sphereGeometry args={[0.7]} />
        <meshPhongMaterial color="#BCDF7B" />
      </mesh>

      <mesh position={[-3, 3, -4]}>
        <dodecahedronGeometry args={[0.8]} />
        <meshPhongMaterial color="#054A49" />
      </mesh>

      <mesh position={[3, -2, -6]}>
        <torusGeometry args={[0.6, 0.2, 16, 32]} />
        <meshPhongMaterial color="#D4F9E0" />
      </mesh>

      <mesh position={[-2, -1, -3]}>
        <icosahedronGeometry args={[0.7]} />
        <meshPhongMaterial color="#3525C1" />
      </mesh>

      <mesh position={[2, 1, -5]}>
        <octahedronGeometry args={[0.8]} />
        <meshPhongMaterial color="#CEC9F8" />
      </mesh>
    </>
  );
}

function App() {
  const startConfig = useControls({
    branches: { value: 8, min: 7, max: 16, step: 1 },
    outerRadius: { value: 2, min: 0.5, max: 3, step: 0.01 },
    innerRadius: { value: 1, min: 0.2, max: 2, step: 0.01 },
    thickness: { value: 0.4, min: 0.1, max: 2, step: 0.01 },
    wonkiness: { value: 0.6, min: 0, max: 2, step: 0.01 },
    offset: { value: 0, min: -0.5, max: 0.5, step: 0.01 },
    bevelEnabled: { value: true, min: 0, max: 1, step: 0.01 },
    bevelSegments: { value: 10, min: 0, max: 20, step: 1 },
    bevelSize: { value: 0.1, min: 0, max: 1, step: 0.01 },
    bevelThickness: { value: 0.1, min: 0, max: 1, step: 0.01 },
  });

  const handleScreenshot = () => {
    const canvas = document.querySelector("canvas");
    const link = document.createElement("a");
    link.setAttribute("download", "star-shape.png");
    link.setAttribute("href", canvas.toDataURL("image/png"));
    link.click();
  };

  return (
    <>
      <button
        onClick={handleScreenshot}
        style={{
          position: "fixed",
          bottom: "20px",
          left: "20px",
          padding: "10px 20px",
          backgroundColor: "#333",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          zIndex: 1000,
        }}
      >
        Save PNG
      </button>
      <div className="App">
        <Canvas
          gl={{ preserveDrawingBuffer: true }}
          camera={{ position: [0, 2, 12], fov: 45 }}
        >
          <color attach="background" args={["#1D1E1E"]} />
          <OrbitControls enableZoom={false} />
          <ambientLight intensity={0.25} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <Environment
            preset="warehouse"
            backgroundBlurriness={1}
            backgroundIntensity={1}
          >
            <Lightformer
              intensity={4}
              position={[10, 5, 0]}
              scale={[10, 50, 1]}
              // onUpdate={(self) => self.lookAt(0, 0, 0)}
            />
          </Environment>
          <group rotation={[0, 0, Math.PI / 4]}>
            <StarShape position={[0, 0, 0]} starConfig={startConfig} />
          </group>
          <EffectComposer>
            <HueSaturation saturation={0.5} />
            <Bloom
              luminanceThreshold={1}
              intensity={0.35}
              levels={9}
              mipmapBlur
            />
            <ToneMapping
              exposure={1.5}
              whitePoint={1.0}
              toneMappingType={THREE.ACESFilmicToneMapping}
            />
          </EffectComposer>
        </Canvas>
      </div>
    </>
  );
}

export default App;
