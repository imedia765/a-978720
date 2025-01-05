import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, FileText } from 'lucide-react';
import { useState } from 'react';
import RoleIssueAlert from './RoleIssueAlert';
import type { Database } from '@/integrations/supabase/types';
import { useToast } from "@/hooks/use-toast";

type AppRole = Database['public']['Enums']['app_role'];

interface DiagnosticResult {
  timestamp: string;
  category: string;
  findings: any[];
  status: 'success' | 'warning' | 'error';
}

const DiagnosticReport = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const { data: diagnosticResults, refetch: runDiagnostics } = useQuery({
    queryKey: ['system-diagnostics'],
    queryFn: async () => {
      console.log('Running system diagnostics...');
      
      // Run all diagnostic checks in parallel
      const [roleIssues, memberChecks, securityAudit] = await Promise.all([
        supabase.rpc('check_role_inconsistencies'),
        supabase.rpc('check_member_numbers'),
        supabase.rpc('check_security_settings')
      ]);

      const results: DiagnosticResult[] = [
        {
          timestamp: new Date().toISOString(),
          category: 'Role Management',
          findings: roleIssues.data || [],
          status: roleIssues.data?.length ? 'warning' : 'success'
        },
        {
          timestamp: new Date().toISOString(),
          category: 'Member Verification',
          findings: memberChecks.data || [],
          status: memberChecks.data?.length ? 'warning' : 'success'
        },
        {
          timestamp: new Date().toISOString(),
          category: 'Security Audit',
          findings: securityAudit.data || [],
          status: securityAudit.data?.length ? 'warning' : 'success'
        }
      ];

      return results;
    },
    enabled: false
  });

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    try {
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole });

      if (insertError) throw insertError;

      toast({
        title: "Role Updated",
        description: "User role has been successfully updated.",
      });

      runDiagnostics();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role.",
        variant: "destructive",
      });
    }
  };

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      await runDiagnostics();
      toast({
        title: "Report Generated",
        description: "System diagnostic report has been generated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate diagnostic report.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = () => {
    if (!diagnosticResults) return;

    const reportContent = diagnosticResults.map(result => `
# ${result.category}
Status: ${result.status}
Timestamp: ${new Date(result.timestamp).toLocaleString()}

Findings:
${JSON.stringify(result.findings, null, 2)}
`).join('\n\n');

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-diagnostic-report-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            System Diagnostic Report
          </h2>
          <p className="text-dashboard-text mt-1">
            Run comprehensive system checks and generate diagnostic reports
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={generateReport}
            disabled={isGenerating}
          >
            Generate Report
          </Button>
          {diagnosticResults && (
            <Button
              onClick={downloadReport}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
          )}
        </div>
      </div>

      {diagnosticResults && (
        <div className="space-y-8">
          {diagnosticResults.map((result, index) => (
            <section key={index} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">
                  {result.category}
                </h3>
                <div className={`px-2 py-1 rounded text-sm ${
                  result.status === 'success' ? 'bg-green-500/10 text-green-500' :
                  result.status === 'warning' ? 'bg-yellow-500/10 text-yellow-500' :
                  'bg-red-500/10 text-red-500'
                }`}>
                  {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
                </div>
              </div>
              
              {result.findings.length > 0 ? (
                <div className="space-y-4">
                  {result.findings.map((issue: any, i: number) => (
                    <RoleIssueAlert
                      key={i}
                      issue={issue}
                      onRoleChange={handleRoleChange}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-dashboard-text">No issues found.</p>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default DiagnosticReport;