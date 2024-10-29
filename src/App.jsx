/* eslint-disable */
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useControls, folder } from "leva";

// Array of different material configurations for testing
const materialConfigs = [
  {
    name: "Standard",
    props: { color: "blue", metalness: 0.5, roughness: 0.5 },
    material: "meshStandardMaterial",
  },
  {
    name: "Physical",
    props: { color: "green", metalness: 0.8, roughness: 0.2, clearcoat: 1 },
    material: "meshPhysicalMaterial",
  },
  {
    name: "Phong",
    props: { color: "yellow", shininess: 100 },
    material: "meshPhongMaterial",
  },
  {
    name: "Lambert",
    props: { color: "purple" },
    material: "meshLambertMaterial",
  },
  // { name: "Toon", props: { color: "cyan" }, material: "meshToonMaterial" },

  { name: "Normal", props: {}, material: "meshNormalMaterial" },
  { name: "Matcap", props: {}, material: "meshMatcapMaterial" },
  // { name: "Depth", props: {}, material: "meshDepthMaterial" },
];

export function StarShape({
  position,
  materialConfig,
  branches = 8, // number of star points (8 = 16-point star)
  outerRadius = 1, // larger radius
  innerRadius = 0.5, // smaller radius
  thickness = 0.2, // extrusion depth
  wonkiness = 0, // random variation (0-1)
  offset = 0, // y-axis scaling (-0.5 to 0.5)
}) {
  const meshRef = useRef();

  // Rotate the star
  useFrame((state, delta) => {
    meshRef.current.rotation.x += delta * 0.2;
    meshRef.current.rotation.y += delta * 0.1;
  });

  // Create the star shape
  const shape = new THREE.Shape();
  const points = branches * 2; // Double the points for outer/inner alternation

  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const radius =
      i % 2 === 0
        ? outerRadius + wonkiness * (Math.random() - 0.5) * innerRadius
        : innerRadius;

    // Apply offset to y coordinates for ellipsoid effect
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius * (1 + offset);

    if (i === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }
  shape.closePath();

  // Extrusion settings
  const extrudeSettings = {
    steps: 1,
    depth: thickness,
    bevelEnabled: false,
  };

  const MaterialComponent = materialConfig.material;

  return (
    <mesh ref={meshRef} position={position}>
      <extrudeGeometry args={[shape, extrudeSettings]} />
      <MaterialComponent {...materialConfig.props} />
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

function App() {
  const {
    material,
    branches,
    outerRadius,
    innerRadius,
    thickness,
    wonkiness,
    offset,
  } = useControls({
    material: {
      options: materialConfigs.reduce((acc, mat) => {
        acc[mat.name] = mat.name;
        return acc;
      }, {}),
    },
    shape: folder({
      branches: { value: 8, min: 7, max: 16, step: 1 },
      outerRadius: { value: 2, min: 0.5, max: 3, step: 0.01 },
      innerRadius: { value: 1, min: 0.2, max: 2, step: 0.01 },
      thickness: { value: 0.4, min: 0.1, max: 2, step: 0.01 },
      wonkiness: { value: 0.6, min: 0, max: 1, step: 0.01 },
      offset: { value: 0, min: -0.5, max: 0.5, step: 0.01 },
    }),
  });

  const selectedMaterial = materialConfigs.find((m) => m.name === material);

  return (
    <>
      <div className="App">
        <Canvas camera={{ position: [0, 2, 8], fov: 45 }}>
          <OrbitControls enableZoom={false} />

          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />

          {/* Environment map */}
          <Environment preset="sunset" background />

          {/* Single large star */}
          <StarShape
            position={[0, 0, 0]}
            materialConfig={selectedMaterial}
            branches={branches}
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            thickness={thickness}
            wonkiness={wonkiness}
            offset={offset}
          />
        </Canvas>
      </div>
    </>
  );
}

export default App;
