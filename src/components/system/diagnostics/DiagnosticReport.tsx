import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, FileText } from 'lucide-react';
import { useState } from 'react';
import RoleIssueAlert from './RoleIssueAlert';
import type { Database } from '@/integrations/supabase/types';
import { useToast } from "@/hooks/use-toast";
import type { DiagnosticResult, RoleIssue, MemberIssue, SecurityIssue } from '@/types/diagnostics';

type AppRole = Database['public']['Enums']['app_role'];

const DiagnosticReport = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const { data: diagnosticResults, refetch: runDiagnostics } = useQuery({
    queryKey: ['system-diagnostics'],
    queryFn: async () => {
      console.log('Running system diagnostics...');
      
      // Get all members with their auth_user_id for role checks
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('id, auth_user_id, member_number, full_name');
      
      if (membersError) throw membersError;

      // Get all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (rolesError) throw rolesError;

      // Get all collectors
      const { data: collectors, error: collectorsError } = await supabase
        .from('members_collectors')
        .select('member_number');
      
      if (collectorsError) throw collectorsError;

      // Process role issues
      const roleIssues: RoleIssue[] = [];
      members.forEach(member => {
        if (!member.auth_user_id) {
          roleIssues.push({
            user_id: '',
            member_number: member.member_number,
            full_name: member.full_name,
            issue_type: 'Missing Auth User',
            details: 'Member has no associated auth user'
          });
        } else {
          const memberRoles = userRoles.filter(r => r.user_id === member.auth_user_id);
          const isCollector = collectors.some(c => c.member_number === member.member_number);

          if (isCollector && !memberRoles.some(r => r.role === 'collector')) {
            roleIssues.push({
              user_id: member.auth_user_id,
              member_number: member.member_number,
              full_name: member.full_name,
              issue_type: 'Missing Collector Role',
              details: 'User is in collectors table but missing collector role'
            });
          }

          if (!isCollector && memberRoles.some(r => r.role === 'collector')) {
            roleIssues.push({
              user_id: member.auth_user_id,
              member_number: member.member_number,
              full_name: member.full_name,
              issue_type: 'Invalid Collector Role',
              details: 'User has collector role but not in collectors table'
            });
          }
        }
      });

      // Run member checks and security audit in parallel
      const [memberChecksResult, securityAuditResult] = await Promise.all([
        supabase.rpc('check_member_numbers'),
        supabase.rpc('audit_security_settings')
      ]);

      const memberChecks = memberChecksResult.data as MemberIssue[] || [];
      const securityAudit = securityAuditResult.data as SecurityIssue[] || [];

      const results: DiagnosticResult[] = [
        {
          timestamp: new Date().toISOString(),
          category: 'Role Management',
          findings: roleIssues,
          status: roleIssues.length ? 'warning' : 'success'
        },
        {
          timestamp: new Date().toISOString(),
          category: 'Member Verification',
          findings: memberChecks,
          status: memberChecks.length ? 'warning' : 'success'
        },
        {
          timestamp: new Date().toISOString(),
          category: 'Security Audit',
          findings: securityAudit,
          status: securityAudit.length ? 'warning' : 'success'
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