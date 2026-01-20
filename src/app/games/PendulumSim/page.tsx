'use client';

import Link from 'next/link';
import ControlsPanel from './ui/ControlsPanel';
import SimulationCanvas from './ui/SimulationCanvas';
import { useEffect, useState } from 'react';
import { usePendulumSimController } from './function/usePendulumSimController';

export default function PendulumSimPage() {
  const [isMobile, setIsMobile] = useState(true);
  const [ui, actions] = usePendulumSimController();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-2 px-3 flex flex-col">
      <div className="w-full max-w-screen-xl mx-auto">
        <div className="flex justify-between items-center mb-3 py-2">
          <Link
            href="/"
            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white shadow-sm border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-300 hover:shadow transition-all text-sm font-medium"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            首页
          </Link>

          <h1 className={`font-bold text-gray-800 ${isMobile ? 'text-xl' : 'text-2xl'}`}>混沌摆模拟</h1>

          <Link
            href="/games"
            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white shadow-sm border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-300 hover:shadow transition-all text-sm font-medium"
          >
            更多
            <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-6">
          <div className="lg:flex-1 bg-white rounded-xl shadow-md overflow-hidden mb-3 lg:mb-0 p-3">
            <SimulationCanvas
              simRef={actions.simRef}
              params={ui.params}
              paused={ui.paused}
              showTrail={ui.showTrail}
              trailLength={ui.trailLength}
              showEnergy={ui.showEnergy}
              resetToken={ui.resetToken}
            />
          </div>

          {!isMobile ? (
            <div className="lg:w-80 xl:w-96 bg-white rounded-xl shadow-md overflow-hidden">
              <ControlsPanel ui={ui} actions={actions} />
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <ControlsPanel ui={ui} actions={actions} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
