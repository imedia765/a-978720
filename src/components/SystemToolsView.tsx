import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import DiagnosticReport from './system/diagnostics/DiagnosticReport';

const SystemToolsView = () => {
  const { toast } = useToast();

  return (
    <>
      <header className="mb-8">
        <h1 className="text-3xl font-medium mb-2 text-white">System Tools</h1>
        <p className="text-dashboard-text">Manage and audit system settings</p>
      </header>

      <div className="space-y-8">
        <DiagnosticReport />
      </div>
    </>
  );
};

export default SystemToolsView;