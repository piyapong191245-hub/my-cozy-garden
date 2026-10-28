// app/page.js
'use client';

import dynamic from 'next/dynamic';

const CozyGarden = dynamic(() => import('../components/CozyGarden'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-slate-950 text-emerald-400 font-mono">
      🌱 กำลังโหลดฟาร์ม 3D...
    </div>
  ),
});

export default function Home() {
  return (
    <main className="w-full h-screen overflow-hidden">
      <CozyGarden />
    </main>
  );
}