import React from 'react';
import UpgradePlanComponent from '@/components/spec/UpgradePlan';

export default function UpgradePlanPage() {
  return (
    <div className="min-h-screen bg-plm-grid p-4 md:p-8">
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-4xl font-serif-display font-black italic mb-4">Upgrade Plan</h1>
        <p className="text-lg opacity-70">Implementation details and specification.</p>
      </div>
      <UpgradePlanComponent />
    </div>
  );
}