'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  Sun,
  Moon,
  CloudRain,
  Sprout,
  Coins,
  ShoppingBag,
  Volume2,
  VolumeX,
  Code2,
  Info,
} from 'lucide-react';

// ==========================================
// 1. SOUND SYNTHESIZER (Web Audio API)
// ==========================================
class FarmSoundEffects {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTill() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {}
  }

  playWater() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.25;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, now);
      filter.Q.setValueAtTime(3, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(now);
      noise.stop(now + 0.25);
    } catch (e) {}
  }

  playPlant() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {}
  }

  playHarvest() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      osc.frequency.setValueAtTime(783.99, now + 0.16);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {}
  }

  playCoin() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.setValueAtTime(1318.51, now + 0.08);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {}
  }
}

const soundFx = new FarmSoundEffects();

// ==========================================
// 2. CROPS CONFIGURATION
// ==========================================
const CROP_TYPES = {
  wheat: {
    id: 'wheat',
    name: 'ข้าวสาลี',
    seedCost: 5,
    sellPrice: 15,
    growTime: 6,
    exp: 8,
    color: '#eab308',
    icon: '🌾',
  },
  carrot: {
    id: 'carrot',
    name: 'แคร์รอต',
    seedCost: 12,
    sellPrice: 32,
    growTime: 12,
    exp: 15,
    color: '#f97316',
    icon: '🥕',
  },
  tomato: {
    id: 'tomato',
    name: 'มะเขือเทศ',
    seedCost: 25,
    sellPrice: 70,
    growTime: 20,
    exp: 30,
    color: '#ef4444',
    icon: '🍅',
  },
  sunflower: {
    id: 'sunflower',
    name: 'ทานตะวัน',
    seedCost: 50,
    sellPrice: 150,
    growTime: 35,
    exp: 60,
    color: '#facc15',
    icon: '🌻',
  },
};

// ==========================================
// 3. MAIN APP COMPONENT
// ==========================================
export default function App() {
  const [coins, setCoins] = useState(100);
  const [exp, setExp] = useState(0);
  const [level, setLevel] = useState(1);
  const [inventory, setInventory] = useState({
    wheat: 3,
    carrot: 1,
    tomato: 0,
    sunflower: 0,
  });

  const [activeTool, setActiveTool] = useState('hoe');
  const [selectedSeed, setSelectedSeed] = useState('wheat');
  const [fertilizerCount, setFertilizerCount] = useState(2);

  const [timeOfDay, setTimeOfDay] = useState(8);
  const [isRaining, setIsRaining] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const [chickens, setChickens] = useState(0);
  const [cows, setCows] = useState(0);
  const [eggs, setEggs] = useState(0);
  const [milk, setMilk] = useState(0);

  const [showShopModal, setShowShopModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('cozy_farm_3d_save');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setCoins(data.coins ?? 100);
        setExp(data.exp ?? 0);
        setLevel(data.level ?? 1);
        setInventory(data.inventory ?? { wheat: 3, carrot: 1, tomato: 0, sunflower: 0 });
        setChickens(data.chickens ?? 0);
        setCows(data.cows ?? 0);
      } catch (e) {}
    }
  }, []);

  const addEXP = (amount) => {
    const nextExp = exp + amount;
    const expNeeded = level * 100;
    if (nextExp >= expNeeded) {
      setLevel((prev) => prev + 1);
      setExp(nextExp - expNeeded);
      soundFx.playCoin();
    } else {
      setExp(nextExp);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeOfDay((prev) => (prev + 0.1) % 24);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (chickens > 0) setEggs((prev) => prev + chickens);
      if (cows > 0) setMilk((prev) => prev + cows);
    }, 15000);
    return () => clearInterval(interval);
  }, [chickens, cows]);

  const toggleSound = () => {
    soundFx.muted = !soundFx.muted;
    setIsMuted(soundFx.muted);
  };

  return (
    <div className="relative w-full h-screen bg-slate-950 text-white font-sans overflow-hidden select-none">
      <FarmCanvas
        activeTool={activeTool}
        selectedSeed={selectedSeed}
        inventory={inventory}
        setInventory={setInventory}
        coins={coins}
        setCoins={setCoins}
        addEXP={addEXP}
        fertilizerCount={fertilizerCount}
        setFertilizerCount={setFertilizerCount}
        timeOfDay={timeOfDay}
        isRaining={isRaining}
        soundFx={soundFx}
      />

      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-6 z-10">
        <header className="flex flex-wrap justify-between items-center w-full max-w-6xl mx-auto gap-3">
          <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-emerald-500/30 shadow-lg pointer-events-auto">
            <div className="p-2 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-xl shadow-md">
              <Sprout className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400">
                ชาวสวน 3D (Cozy Garden)
              </h1>
              <div className="flex items-center gap-2 text-[11px] text-emerald-300/80 font-mono">
                <span className="flex items-center gap-1">
                  {timeOfDay >= 6 && timeOfDay < 18 ? (
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Moon className="w-3.5 h-3.5 text-indigo-300" />
                  )}
                  {Math.floor(timeOfDay).toString().padStart(2, '0')}:00 น.
                </span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold">เลเวล {level}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pointer-events-auto">
            <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-amber-500/30 shadow-md">
              <div className="p-1.5 bg-amber-500/20 rounded-lg text-amber-400">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] text-amber-300/70 font-mono uppercase">เหรียญ (Coins)</div>
                <div className="text-base font-black font-mono text-amber-300">{coins}</div>
              </div>
            </div>

            <div className="hidden sm:flex flex-col justify-center bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-cyan-500/30 w-36 shadow-md">
              <div className="flex justify-between items-center text-[10px] font-mono text-cyan-300 mb-1">
                <span>EXP</span>
                <span>{exp}/{level * 100}</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (exp / (level * 100)) * 100)}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => { soundFx.init(); setShowShopModal(true); }}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold rounded-2xl text-xs hover:scale-105 active:scale-95 transition"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>ร้านค้า (Shop)</span>
            </button>

            <button
              onClick={() => { soundFx.init(); setIsRaining(!isRaining); }}
              className={`p-2.5 rounded-2xl border transition ${isRaining ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-900/80 border-slate-700 text-slate-300'}`}
              title="สลับฝนตก"
            >
              <CloudRain className="w-5 h-5" />
            </button>

            <button
              onClick={() => { soundFx.init(); toggleSound(); }}
              className="p-2.5 bg-slate-900/80 border border-slate-700 text-slate-300 rounded-2xl"
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
            </button>

            <button
              onClick={() => setShowCodeModal(true)}
              className="p-2.5 bg-slate-900/80 border border-slate-700 text-cyan-400 rounded-2xl"
            >
              <Code2 className="w-5 h-5" />
            </button>
          </div>
        </header>

        {(eggs > 0 || milk > 0) && (
          <div className="self-center pointer-events-auto bg-slate-900/90 border border-amber-500/40 px-5 py-2.5 rounded-full shadow-lg flex items-center gap-4 animate-bounce mt-2">
            <div className="text-xs font-bold text-amber-300 flex items-center gap-3">
              {eggs > 0 && <span>🥚 ไข่ไก่สด: {eggs} ฟอง</span>}
              {milk > 0 && <span>🥛 นมสด: {milk} ขวด</span>}
            </div>
            <button
              onClick={() => {
                setCoins((prev) => prev + eggs * 10 + milk * 25);
                addEXP(eggs * 5 + milk * 10);
                soundFx.playCoin();
                setEggs(0); setMilk(0);
              }}
              className="px-3 py-1 bg-amber-500 text-slate-950 font-black rounded-full text-xs hover:bg-amber-400"
            >
              เก็บผลผลิตทั้งหมด (+เหรียญ)
            </button>
          </div>
        )}

        <footer className="w-full max-w-4xl mx-auto pointer-events-auto">
          <div className="bg-slate-900/90 backdrop-blur-xl p-3 sm:p-4 rounded-3xl border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto justify-center">
              <ToolButton active={activeTool === 'hoe'} onClick={() => setActiveTool('hoe')} icon="⛏️" label="จอบ (Till)" sub="พรวนดิน" />
              <ToolButton active={activeTool === 'water'} onClick={() => setActiveTool('water')} icon="💧" label="บัวรดน้ำ" sub="รดน้ำต้นไม้" />
              <ToolButton active={activeTool === 'seed'} onClick={() => setActiveTool('seed')} icon="🌱" label="ปลูกพืช" sub="เลือกเมล็ดพันธุ์" />
              <ToolButton active={activeTool === 'harvest'} onClick={() => setActiveTool('harvest')} icon="🌾" label="เก็บเกี่ยว" sub="ตัดผลผลิต" />
              <ToolButton active={activeTool === 'fertilizer'} onClick={() => setActiveTool('fertilizer')} icon="⚡" label="ใส่ปุ๋ย" sub={`เหลือ ${fertilizerCount}`} />
            </div>

            {activeTool === 'seed' && (
              <div className="flex items-center gap-2 bg-slate-950/70 p-2 rounded-2xl border border-emerald-500/20 w-full sm:w-auto justify-center">
                {Object.values(CROP_TYPES).map((crop) => (
                  <button
                    key={crop.id}
                    onClick={() => setSelectedSeed(crop.id)}
                    className={`p-2 rounded-xl border flex flex-col items-center min-w-[60px] transition ${selectedSeed === crop.id ? 'bg-emerald-500/20 border-emerald-400 text-white' : 'bg-slate-900/60 border-slate-800 text-slate-400'}`}
                  >
                    <span className="text-xl">{crop.icon}</span>
                    <span className="text-[10px] font-bold mt-1">{crop.name}</span>
                    <span className="text-[9px] font-mono text-emerald-300">มี: {inventory[crop.id] || 0}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </footer>
      </div>

      {showShopModal && (
        <FarmShopModal
          onClose={() => setShowShopModal(false)}
          coins={coins} setCoins={setCoins}
          inventory={inventory} setInventory={setInventory}
          chickens={chickens} setChickens={setChickens}
          cows={cows} setCows={setCows}
          fertilizerCount={fertilizerCount} setFertilizerCount={setFertilizerCount}
          addEXP={addEXP} soundFx={soundFx}
        />
      )}

      {showCodeModal && (
        <CodeExplanationModal onClose={() => setShowCodeModal(false)} />
      )}
    </div>
  );
}

// ==========================================
// 4. TOOL BUTTON HELPER
// ==========================================
function ToolButton({ active, onClick, icon, label, sub }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border transition ${
        active
          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 border-emerald-300 text-slate-950 font-black scale-105'
          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
      }`}
    >
      <span className="text-xl">{icon}</span>
      <div className="text-left">
        <div className="text-xs font-extrabold leading-tight">{label}</div>
        <div className={`text-[9px] font-mono ${active ? 'text-slate-900' : 'text-slate-400'}`}>{sub}</div>
      </div>
    </button>
  );
}

// ==========================================
// 5. THREE.JS 3D CANVAS COMPONENT
// ==========================================
function FarmCanvas({
  activeTool,
  selectedSeed,
  inventory,
  setInventory,
  coins,
  setCoins,
  addEXP,
  fertilizerCount,
  setFertilizerCount,
  timeOfDay,
  isRaining,
  soundFx,
}) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.FogExp2(0x0f172a, 0.015);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(12, 16, 16);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff5ea, 1.8);
    sunLight.position.set(20, 30, 15);
    sunLight.castShadow = true;
    scene.add(sunLight);

    const islandGeo = new THREE.BoxGeometry(18, 1.5, 18);
    const islandMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 });
    const island = new THREE.Mesh(islandGeo, islandMat);
    island.position.y = -0.75;
    island.receiveShadow = true;
    scene.add(island);

    const waterGeo = new THREE.PlaneGeometry(100, 100);
    const waterMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.8 });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -1.6;
    scene.add(water);

    const houseGroup = new THREE.Group();
    const houseBaseGeo = new THREE.BoxGeometry(3, 2.5, 3);
    const houseBaseMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7 });
    const houseBase = new THREE.Mesh(houseBaseGeo, houseBaseMat);
    houseBase.castShadow = true;
    houseGroup.add(houseBase);

    const roofGeo = new THREE.ConeGeometry(2.6, 1.8, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 2.15;
    roof.castShadow = true;
    houseGroup.add(roof);

    houseGroup.position.set(-6, 1.25, -6);
    scene.add(houseGroup);

    const createTree = (x, z) => {
      const tree = new THREE.Group();
      const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 1.2, 5);
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 0.6;
      tree.add(trunk);

      const leavesGeo = new THREE.DodecahedronGeometry(1.1);
      const leavesMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.8 });
      const leaves = new THREE.Mesh(leavesGeo, leavesMat);
      leaves.position.y = 1.8;
      tree.add(leaves);

      tree.position.set(x, 0, z);
      scene.add(tree);
    };

    createTree(6.5, -6.5);
    createTree(7, -3);
    createTree(-7, 6);

    const gridSize = 6;
    const tileSize = 1.6;
    const gridOffset = ((gridSize - 1) * tileSize) / 2;

    const tilesData = [];
    const tileGroup = new THREE.Group();
    const soilGeo = new THREE.BoxGeometry(tileSize - 0.1, 0.2, tileSize - 0.1);

    const emptySoilMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });
    const tilledSoilMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
    const wateredSoilMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.4 });

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const x = c * tileSize - gridOffset;
        const z = r * tileSize - gridOffset;

        const mesh = new THREE.Mesh(soilGeo, emptySoilMat.clone());
        mesh.position.set(x, 0.1, z);
        mesh.receiveShadow = true;
        mesh.castShadow = true;

        mesh.userData = {
          row: r, col: c, state: 'empty', isWatered: false,
          cropType: null, plantMesh: null, growthStage: 0, timer: 0,
        };

        tileGroup.add(mesh);
        tilesData.push(mesh);
      }
    }
    scene.add(tileGroup);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const hoverGeo = new THREE.BoxGeometry(tileSize, 0.25, tileSize);
    const hoverMat = new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.4 });
    const hoverBox = new THREE.Mesh(hoverGeo, hoverMat);
    hoverBox.visible = false;
    scene.add(hoverBox);

    let hoveredTile = null;

    const onPointerMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(tilesData);

      if (intersects.length > 0) {
        hoveredTile = intersects[0].object;
        hoverBox.position.copy(hoveredTile.position);
        hoverBox.position.y = 0.15;
        hoverBox.visible = true;
      } else {
        hoveredTile = null;
        hoverBox.visible = false;
      }
    };

    const createPlantMesh = (cropId, stage) => {
      const plantGroup = new THREE.Group();
      const crop = CROP_TYPES[cropId];
      const color = new THREE.Color(crop ? crop.color : 0x22c55e);

      if (stage === 0) {
        const seedGeo = new THREE.SphereGeometry(0.08, 6, 6);
        const seedMat = new THREE.MeshStandardMaterial({ color: 0xd97706 });
        const seed = new THREE.Mesh(seedGeo, seedMat);
        seed.position.y = 0.15;
        plantGroup.add(seed);
      } else if (stage === 1) {
        const stemGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.4, 6);
        const stemMat = new THREE.MeshStandardMaterial({ color: 0x4ade80 });
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.y = 0.2;
        plantGroup.add(stem);

        const leafGeo = new THREE.SphereGeometry(0.15, 6, 6);
        leafGeo.scale(1.5, 0.5, 0.8);
        const leaf = new THREE.Mesh(leafGeo, stemMat);
        leaf.position.y = 0.4;
        plantGroup.add(leaf);
      } else {
        const mainGeo = new THREE.DodecahedronGeometry(0.4);
        const mainMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });
        const main = new THREE.Mesh(mainGeo, mainMat);
        main.position.y = 0.5;
        plantGroup.add(main);

        const stemGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 6);
        const stemMat = new THREE.MeshStandardMaterial({ color: 0x16a34a });
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.y = 0.25;
        plantGroup.add(stem);
      }

      return plantGroup;
    };

    const onPointerDown = () => {
      if (!hoveredTile) return;
      const data = hoveredTile.userData;
      const tool = activeToolRef.current;

      if (tool === 'hoe') {
        if (data.state === 'empty') {
          data.state = 'tilled';
          hoveredTile.material = tilledSoilMat.clone();
          soundFx.playTill();
        }
      } else if (tool === 'water') {
        if (data.state !== 'empty' && !data.isWatered) {
          data.isWatered = true;
          hoveredTile.material = wateredSoilMat.clone();
          soundFx.playWater();
        }
      } else if (tool === 'seed') {
        const seedId = selectedSeedRef.current;
        const invCount = inventoryRef.current[seedId] || 0;

        if (data.state === 'tilled' && invCount > 0) {
          data.state = 'seeded';
          data.cropType = seedId;
          data.growthStage = 0;
          data.timer = 0;

          setInventoryRef.current((prev) => ({
            ...prev,
            [seedId]: prev[seedId] - 1,
          }));

          const plant = createPlantMesh(seedId, 0);
          plant.position.copy(hoveredTile.position);
          scene.add(plant);
          data.plantMesh = plant;

          soundFx.playPlant();
        }
      } else if (tool === 'harvest') {
        if (data.state === 'seeded' && data.growthStage === 2) {
          const crop = CROP_TYPES[data.cropType];
          if (crop) {
            setCoinsRef.current((prev) => prev + crop.sellPrice);
            addEXPRef.current(crop.exp);
            soundFx.playHarvest();
          }

          if (data.plantMesh) scene.remove(data.plantMesh);
          data.state = 'empty';
          data.isWatered = false;
          data.cropType = null;
          data.plantMesh = null;
          data.growthStage = 0;
          data.timer = 0;
          hoveredTile.material = emptySoilMat.clone();
        }
      } else if (tool === 'fertilizer') {
        if (data.state === 'seeded' && data.growthStage < 2 && fertilizerCountRef.current > 0) {
          setFertilizerCountRef.current((prev) => prev - 1);

          data.growthStage = 2;
          if (data.plantMesh) scene.remove(data.plantMesh);

          const maturePlant = createPlantMesh(data.cropType, 2);
          maturePlant.position.copy(hoveredTile.position);
          scene.add(maturePlant);
          data.plantMesh = maturePlant;

          soundFx.playCoin();
        }
      }
    };

    container.addEventListener('mousemove', onPointerMove);
    container.addEventListener('click', onPointerDown);

    const rainCount = 400;
    const rainGeo = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount * 3; i += 3) {
      rainPositions[i] = (Math.random() - 0.5) * 20;
      rainPositions[i + 1] = Math.random() * 15;
      rainPositions[i + 2] = (Math.random() - 0.5) * 20;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    const rainMat = new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.1, transparent: true, opacity: 0.6 });
    const rainParticles = new THREE.Points(rainGeo, rainMat);
    rainParticles.visible = false;
    scene.add(rainParticles);

    let animId;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      const time = timeOfDayRef.current;
      const lightAngle = (time / 24) * Math.PI * 2;
      sunLight.position.x = Math.cos(lightAngle) * 25;
      sunLight.position.y = Math.sin(lightAngle) * 25;

      if (time >= 6 && time <= 18) {
        scene.background.setHex(0x0f172a);
        sunLight.intensity = 1.8;
      } else {
        scene.background.setHex(0x020617);
        sunLight.intensity = 0.3;
      }

      const raining = isRainingRef.current;
      rainParticles.visible = raining;
      if (raining) {
        const pos = rainParticles.geometry.attributes.position.array;
        for (let i = 1; i < rainCount * 3; i += 3) {
          pos[i] -= 0.4;
          if (pos[i] < 0) pos[i] = 15;
        }
        rainParticles.geometry.attributes.position.needsUpdate = true;
      }

      tilesData.forEach((tile) => {
        const d = tile.userData;

        if (raining && d.state !== 'empty' && !d.isWatered) {
          d.isWatered = true;
          tile.material = wateredSoilMat.clone();
        }

        if (d.state === 'seeded' && d.growthStage < 2) {
          const crop = CROP_TYPES[d.cropType];
          if (crop) {
            const speedMultiplier = d.isWatered ? 2 : 1;
            d.timer += delta * speedMultiplier;

            if (d.timer >= crop.growTime / 2 && d.growthStage === 0) {
              d.growthStage = 1;
              if (d.plantMesh) scene.remove(d.plantMesh);
              const sprout = createPlantMesh(d.cropType, 1);
              sprout.position.copy(tile.position);
              scene.add(sprout);
              d.plantMesh = sprout;
            } else if (d.timer >= crop.growTime && d.growthStage === 1) {
              d.growthStage = 2;
              if (d.plantMesh) scene.remove(d.plantMesh);
              const mature = createPlantMesh(d.cropType, 2);
              mature.position.copy(tile.position);
              scene.add(mature);
              d.plantMesh = mature;
            }
          }
        }

        if (d.state === 'seeded' && d.growthStage === 2 && d.plantMesh) {
          d.plantMesh.rotation.y += 0.01;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', onPointerMove);
      container.removeEventListener('click', onPointerDown);
      cancelAnimationFrame(animId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const activeToolRef = useRef(activeTool);
  activeToolRef.current = activeTool;

  const selectedSeedRef = useRef(selectedSeed);
  selectedSeedRef.current = selectedSeed;

  const inventoryRef = useRef(inventory);
  inventoryRef.current = inventory;

  const setInventoryRef = useRef(setInventory);
  setInventoryRef.current = setInventory;

  const setCoinsRef = useRef(setCoins);
  setCoinsRef.current = setCoins;

  const addEXPRef = useRef(addEXP);
  addEXPRef.current = addEXP;

  const fertilizerCountRef = useRef(fertilizerCount);
  fertilizerCountRef.current = fertilizerCount;

  const setFertilizerCountRef = useRef(setFertilizerCount);
  setFertilizerCountRef.current = setFertilizerCount;

  const timeOfDayRef = useRef(timeOfDay);
  timeOfDayRef.current = timeOfDay;

  const isRainingRef = useRef(isRaining);
  isRainingRef.current = isRaining;

  return <div ref={mountRef} className="absolute inset-0 w-full h-full bg-slate-950" />;
}

// ==========================================
// 6. FARM SHOP MODAL
// ==========================================
function FarmShopModal({
  onClose,
  coins,
  setCoins,
  inventory,
  setInventory,
  chickens,
  setChickens,
  cows,
  setCows,
  fertilizerCount,
  setFertilizerCount,
  addEXP,
  soundFx,
}) {
  const [shopTab, setShopTab] = useState('seeds');

  const buySeed = (cropId) => {
    const crop = CROP_TYPES[cropId];
    if (coins >= crop.seedCost) {
      setCoins((prev) => prev - crop.seedCost);
      setInventory((prev) => ({ ...prev, [cropId]: (prev[cropId] || 0) + 1 }));
      addEXP(2);
      soundFx.playCoin();
    }
  };

  const buyAnimal = (type) => {
    if (type === 'chicken' && coins >= 150) {
      setCoins((prev) => prev - 150);
      setChickens((prev) => prev + 1);
      soundFx.playCoin();
    } else if (type === 'cow' && coins >= 350) {
      setCoins((prev) => prev - 350);
      setCows((prev) => prev + 1);
      soundFx.playCoin();
    }
  };

  const buyFertilizer = () => {
    if (coins >= 30) {
      setCoins((prev) => prev - 30);
      setFertilizerCount((prev) => prev + 2);
      soundFx.playCoin();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md pointer-events-auto">
      <div className="bg-slate-900 border border-emerald-500/40 w-full max-w-2xl rounded-3xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/60">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <ShoppingBag className="w-5 h-5" />
            <span>ร้านค้าฟาร์มสุข (Farm Shop & Market)</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white px-3 py-1 rounded-xl text-sm bg-slate-800">✕</button>
        </div>

        <div className="flex border-b border-slate-800 bg-slate-950/30 px-6 pt-3 gap-3">
          <button onClick={() => setShopTab('seeds')} className={`px-4 py-2 text-xs font-bold rounded-t-xl ${shopTab === 'seeds' ? 'bg-emerald-500/20 text-emerald-300 border-t-2 border-emerald-400' : 'text-slate-400'}`}>🌱 เมล็ดพันธุ์</button>
          <button onClick={() => setShopTab('animals')} className={`px-4 py-2 text-xs font-bold rounded-t-xl ${shopTab === 'animals' ? 'bg-emerald-500/20 text-emerald-300 border-t-2 border-emerald-400' : 'text-slate-400'}`}>🐔 สัตว์เลี้ยง</button>
          <button onClick={() => setShopTab('supplies')} className={`px-4 py-2 text-xs font-bold rounded-t-xl ${shopTab === 'supplies' ? 'bg-emerald-500/20 text-emerald-300 border-t-2 border-emerald-400' : 'text-slate-400'}`}>⚡ ปุ๋ย & อุปกรณ์</button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {shopTab === 'seeds' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.values(CROP_TYPES).map((crop) => (
                <div key={crop.id} className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{crop.icon}</span>
                    <div>
                      <h4 className="font-bold text-sm text-white">{crop.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">โตใน: {crop.growTime} วิ • ราคาขาย: {crop.sellPrice}</p>
                      <span className="text-[10px] text-emerald-400">มีในกระเป๋า: {inventory[crop.id] || 0}</span>
                    </div>
                  </div>
                  <button onClick={() => buySeed(crop.id)} disabled={coins < crop.seedCost} className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1"><Coins className="w-3.5 h-3.5" /> {crop.seedCost}</button>
                </div>
              ))}
            </div>
          )}

          {shopTab === 'animals' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🐔</span>
                  <div>
                    <h4 className="font-bold text-sm text-white">แม่ไก่ไข่ดก</h4>
                    <p className="text-[10px] text-slate-400">ออกไข่ทุก 15 วินาที</p>
                    <span className="text-[10px] text-emerald-400">เลี้ยงไว้: {chickens} ตัว</span>
                  </div>
                </div>
                <button onClick={() => buyAnimal('chicken')} disabled={coins < 150} className="px-3 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1"><Coins className="w-3.5 h-3.5" /> 150</button>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🐄</span>
                  <div>
                    <h4 className="font-bold text-sm text-white">วัวนมพันธุ์ดี</h4>
                    <p className="text-[10px] text-slate-400">ผลิตนมทุก 15 วินาที</p>
                    <span className="text-[10px] text-emerald-400">เลี้ยงไว้: {cows} ตัว</span>
                  </div>
                </div>
                <button onClick={() => buyAnimal('cow')} disabled={coins < 350} className="px-3 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1"><Coins className="w-3.5 h-3.5" /> 350</button>
              </div>
            </div>
          )}

          {shopTab === 'supplies' && (
            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">⚡</span>
                <div>
                  <h4 className="font-bold text-sm text-white">ปุ๋ยเร่งโต (x2 ถุง)</h4>
                  <p className="text-[10px] text-slate-400">เร่งพืชให้โตทันที</p>
                  <span className="text-[10px] text-emerald-400">มีอยู่: {fertilizerCount} ถุง</span>
                </div>
              </div>
              <button onClick={buyFertilizer} disabled={coins < 30} className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1"><Coins className="w-3.5 h-3.5" /> 30</button>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-between items-center">
          <div className="text-xs text-amber-400 font-mono font-bold flex items-center gap-1"><Coins className="w-4 h-4" /> เหรียญ: {coins}</div>
          <button onClick={onClose} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl">ปิด</button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 7. CODE EXPLANATION MODAL
// ==========================================
function CodeExplanationModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md pointer-events-auto">
      <div className="bg-slate-900 border border-emerald-500/40 w-full max-w-2xl rounded-3xl p-6 text-slate-200">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
          <h3 className="font-bold text-emerald-400 flex items-center gap-2"><Code2 className="w-5 h-5" /> Next.js Architecture</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          โปรเจกต์นี้ทำงานโดยแยกส่วนการประมวลผล 3D Canvas ให้อยู่ภายใต้ Client Component โดยใช้ Three.js ในการสร้าง Render Loop และจัดการ Raycasting Intersections
        </p>
        <button onClick={onClose} className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs">ตกลง</button>
      </div>
    </div>
  );
}