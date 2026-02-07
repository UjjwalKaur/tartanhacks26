'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

function MosaicTile({ position, color }: { position: [number, number, number]; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      meshRef.current.rotation.z = Math.sin(time * 0.3) * 0.1;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh ref={meshRef} position={position}>
        <boxGeometry args={[1, 1, 0.1]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.4}
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>
    </Float>
  );
}

function Scene() {
  const tiles = useMemo(() => {
    const colors = ['#D2A046', '#8C78C8', '#50A06E'];
    const positions: Array<[number, number, number]> = [
      [-2, 1, 0],
      [0, 1.5, -0.5],
      [2, 0.5, 0],
      [-1, -1, 0.5],
      [1, -1.5, -0.5],
    ];
    
    return positions.map((pos, i) => ({
      position: pos,
      color: colors[i % colors.length],
    }));
  }, []);

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
      
      {tiles.map((tile, i) => (
        <MosaicTile key={i} position={tile.position} color={tile.color} />
      ))}
    </>
  );
}

export const HeroMosaic3D = () => {
  return (
    <div className="w-full h-64 -mt-8 -mb-8">
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        <Scene />
      </Canvas>
    </div>
  );
};