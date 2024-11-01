/* eslint-disable */
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  OrbitControls,
  MeshTransmissionMaterial,
  Lightformer,
} from "@react-three/drei";
import { useRef, useMemo, useState } from "react";
import * as THREE from "three";
import { useControls } from "leva";
import React from "react";
import {
  EffectComposer,
  Bloom,
  HueSaturation,
  ToneMapping,
} from "@react-three/postprocessing";
import { Geometry, Base, Addition, Subtraction } from "@react-three/csg";

// Create a shared material component
function CloudMaterial({ materialRef }) {
  return (
    <meshStandardMaterial
      ref={materialRef}
      color="#ffffff"
      side={THREE.DoubleSide}
      roughness={1}
    />
  );
}

export function CloudVolume({ position, cloudConfig }) {
  const material = useRef();
  return (
    <mesh position={position}>
      <Geometry useGroups>
        <Base>
          <sphereGeometry args={[1.2, 32, 32]} />
          <meshPhongMaterial
            ref={material}
            color="#ffffff"
            side={THREE.DoubleSide}
            shininess={100}
            specular="#ffffff"
          />
        </Base>
        <Addition position={[-1.2, 0.4, 0]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshPhongMaterial
            ref={material}
            color="#ffffff"
            side={THREE.DoubleSide}
            shininess={100}
            specular="#ffffff"
          />
        </Addition>
        <Addition position={[1.2, 0.2, 0]}>
          <sphereGeometry args={[1, 32, 32]} />
        </Addition>
        <Addition position={[0, 0.8, 0]}>
          <sphereGeometry args={[1.1, 32, 32]} />
        </Addition>
        <Addition position={[0.5, -0.5, 0]}>
          <sphereGeometry args={[0.9, 32, 32]} />
        </Addition>
      </Geometry>
    </mesh>
  );
}

function computeCurve(points) {
  let shape = new THREE.Shape();
  for (let i = 0; i < points.length; i++) {
    if (i === 0) {
      shape.moveTo(points[i].x, points[i].y);
    } else {
      shape.lineTo(points[i].x, points[i].y);
    }
  }
  shape.closePath();
  return shape;
}

function computeShape(shape, config) {
  let _points = [];

  if (shape === "star") {
    const {
      branches,
      outerRadius,
      innerRadius,
      wonkiness,
      offset,
      randomIndices,
    } = config;
    // console.log(config);
    const points = branches * 2;
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const radius =
        i % 2 === 0
          ? outerRadius + wonkiness * (randomIndices[i] - 0.5) * innerRadius
          : innerRadius;

      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius * (1 + offset);

      _points.push({ x, y });
    }
  }

  if (shape === "cloud") {
    const { randomIndices } = config;

    const computeCurves = (points) => {
      const wrap = (i, arr) => {
        return (i + arr.length) % arr.length;
      };
      return points.map((actual, id, arr) => {
        const prev =
          id !== 0 ? points[wrap(id - 1, arr)] : points[arr.length - 1];
        return {
          a: { x: prev.x + prev.xr, y: prev.y + prev.yr },
          b: {
            x: prev.x + Math.cos(prev.a) * prev.infl,
            y: prev.y + Math.sin(prev.a) * prev.infl,
          },
          c: {
            x: actual.x + Math.cos(actual.a) * actual.infl,
            y: actual.y + Math.sin(actual.a) * actual.infl,
          },
          d: { x: actual.x + actual.xr, y: actual.y + actual.yr },
        };
      });
    };

    const computeBeziersSamples = (curves, steps = 32) => {
      if (steps === 0) {
        return [];
      }
      const num = Math.floor(steps);
      return curves.map((curve) => {
        return new Array(num).fill(0).map((_, i) => {
          const { a, b, c, d } = curve;
          const t = Math.max(0, Math.min(1, (1 / num) * i));
          return {
            x:
              Math.pow(1 - t, 3) * a.x +
              3 * Math.pow(1 - t, 2) * t * b.x +
              3 * (1 - t) * Math.pow(t, 2) * c.x +
              Math.pow(t, 3) * d.x,
            y:
              Math.pow(1 - t, 3) * a.y +
              3 * Math.pow(1 - t, 2) * t * b.y +
              3 * (1 - t) * Math.pow(t, 2) * c.y +
              Math.pow(t, 3) * d.y,
          };
        });
      });
    };
    const makePoints = (w = 2, h = 3, revert = false) => {
      const points = [];
      const numPoints = 6 + Math.floor(Math.random() * 4);
      const cloudAng = (2 * Math.PI) / numPoints;

      for (let n = 0; n < numPoints; n++) {
        if (!revert) {
          points.push({
            a: n * cloudAng,
            x: Math.cos(n * cloudAng) * w * 0.5,
            xr: Math.random() * 1 * 0.25,
            y: (Math.sin(n * cloudAng) * h) / 1.5,
            yr: Math.random() * 1 * 0.25,
            infl: 0.5 + Math.random() * 1,
          });
        } else {
          points.push({
            a: n * cloudAng,
            x: Math.cos(n * cloudAng) * w * 0.5,
            xr: Math.random() * 1 * 0.0,
            y: (Math.sin(n * cloudAng) * h) / 1.5,
            yr: Math.random() * 1 * 0.0,
            infl: (0.5 + Math.random() * 2) * -1,
          });
        }
      }
      return points;
    };
    _points = computeBeziersSamples(computeCurves(makePoints())).flat();
  }

  return _points;
}

export function Shape({ kind, config = {} }) {
  const meshRef = useRef();
  const randomIndices = useMemo(
    () => Array.from({ length: 32 }, () => Math.random()),
    []
  );

  const [hovered, setHover] = useState(false);

  useFrame(() => {
    meshRef.current.rotation.y += 0.01;
    meshRef.current.rotation.x += 0.01;
  });
  const { thickness, bevelEnabled, bevelSegments, bevelSize, bevelThickness } =
    config;
  // Create the star shape
  const curve = useMemo(
    () =>
      computeCurve(
        computeShape(kind, {
          ...config,
          randomIndices,
        })
      ),
    [kind, config]
  );

  const extrudeSettings = {
    steps: 1,
    depth: thickness,
    bevelEnabled: bevelEnabled,
    bevelSegments: bevelSegments,
    bevelSize: bevelSize,
    bevelThickness: bevelThickness,
  };

  return (
    <mesh
      ref={meshRef}
      position={[0, 0, -thickness]}
      onPointerOver={(event) => setHover(true)}
      onPointerOut={(event) => setHover(false)}
    >
      <extrudeGeometry args={[curve, extrudeSettings]} />
      <MeshTransmissionMaterial
        backside
        samples={8}
        resolution={2048}
        transmission={0.8}
        roughness={0.25}
        thickness={0.125}
        ior={1.5}
        chromaticAberration={5}
        clearcoat={0.25}
        color={hovered ? "hotpink" : "#DDFF9E"}
        bg="blue"
      />
    </mesh>
  );
}

const USE_STAR_SHAPE = false;
function App() {
  let config;
  if (USE_STAR_SHAPE) {
    config = useControls({
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
      usePost: { value: false },
    });
  } else {
    config = useControls({
      thickness: { value: 0.4, min: 0.1, max: 2, step: 0.01 },
      bevelEnabled: { value: false, min: 0, max: 1, step: 0.01 },
      bevelSegments: { value: 10, min: 0, max: 20, step: 1 },
      bevelSize: { value: 0.1, min: 0, max: 1, step: 0.01 },
      bevelThickness: { value: 0.1, min: 0, max: 1, step: 0.01 },
      usePost: { value: false },
    });
  }

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
          <ambientLight intensity={Math.PI / 2} />
          <spotLight
            position={[10, 10, 10]}
            angle={0.15}
            penumbra={1}
            decay={0}
            intensity={Math.PI}
          />
          <pointLight
            position={[-10, -10, -10]}
            decay={0}
            intensity={Math.PI}
          />

          <Environment
            preset="studio"
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
          {USE_STAR_SHAPE && (
            <group rotation={[0, 0, Math.PI / 4]}>
              <Shape kind="star" config={config} />
            </group>
          )}
          {!USE_STAR_SHAPE && (
            <group rotation={[0, 0, Math.PI / 2]}>
              <Shape kind="cloud" config={config} />
            </group>
          )}
          {config.usePost && (
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
          )}
        </Canvas>
      </div>
    </>
  );
}

export default App;

/*
import { createRoot } from 'react-dom/client'
import React, { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import './styles.css'

function Box(props) {
// This reference will give us direct access to the mesh
const meshRef = useRef()
// Set up state for the hovered and active state
const [hovered, setHover] = useState(false)
const [active, setActive] = useState(false)
// Subscribe this component to the render-loop, rotate the mesh every frame
useFrame((state, delta) => (meshRef.current.rotation.x += delta))
// Return view, these are regular three.js elements expressed in JSX
return (
  <mesh
    {...props}
    ref={meshRef}
    scale={active ? 1.5 : 1}
    onClick={(event) => setActive(!active)}
    onPointerOver={(event) => setHover(true)}
    onPointerOut={(event) => setHover(false)}>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color={hovered ? 'hotpink' : 'orange'} />
  </mesh>
)
}

createRoot(document.getElementById('root')).render(
<Canvas>
  <ambientLight intensity={Math.PI / 2} />
  <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
  <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
  <Box position={[-1.2, 0, 0]} />
  <Box position={[1.2, 0, 0]} />
</Canvas>,
)
*/
