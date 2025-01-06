import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Shield, Info } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SystemCheckProgress from './system/SystemCheckProgress';
import SystemCheckResults from './system/SystemCheckResults';

interface SystemCheck {
  check_type: string;
  status: string;
  details: any;
}

interface MemberNumberCheck {
  issue_type: string;
  description: string;
  affected_table: string;
  member_number: string;
  details: any;
}

type CheckFunction = 'audit_security_settings' | 'check_member_numbers' | 'validate_user_roles';

const CHECKS: Array<{ name: string; fn: CheckFunction }> = [
  { name: 'Security Audit', fn: 'audit_security_settings' },
  { name: 'Member Number Verification', fn: 'check_member_numbers' },
  { name: 'Role Validation', fn: 'validate_user_roles' }
];

const SystemToolsView = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isRunningChecks, setIsRunningChecks] = useState(false);
  const [systemChecks, setSystemChecks] = useState<SystemCheck[]>([]);
  const [currentCheck, setCurrentCheck] = useState('');
  const [completedChecks, setCompletedChecks] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) {
          console.error('Auth error:', error);
          toast({
            title: "Authentication Error",
            description: "Please sign in again",
            variant: "destructive",
          });
          navigate('/login');
          return;
        }
        queryClient.invalidateQueries({ queryKey: ['security_audit'] });
        queryClient.invalidateQueries({ queryKey: ['member_number_check'] });
      } catch (error) {
        console.error('Session check error:', error);
        toast({
          title: "Session Error",
          description: "Please sign in again",
          variant: "destructive",
        });
        navigate('/login');
      }
    };
    checkAuth();
  }, [queryClient, toast, navigate]);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const runSystemChecks = async () => {
    console.log('Starting system checks...');
    setIsRunningChecks(true);
    setSystemChecks([]);
    setCompletedChecks(0);
    
    try {
      let allChecks: SystemCheck[] = [];
      
      for (const check of CHECKS) {
        setCurrentCheck(check.name);
        console.log(`Running ${check.name}...`);
        
        const { data, error } = await supabase.rpc(check.fn);
        if (error) throw error;

        if (check.fn === 'check_member_numbers') {
          const memberChecks = (data as MemberNumberCheck[]).map(check => ({
            check_type: check.issue_type,
            status: 'Warning',
            details: {
              description: check.description,
              affected_table: check.affected_table,
              member_number: check.member_number,
              ...check.details
            }
          }));
          allChecks = [...allChecks, ...memberChecks];
        } else {
          allChecks = [...allChecks, ...(data as SystemCheck[])];
        }
        
        setCompletedChecks(prev => prev + 1);
        await delay(800);
      }

      setSystemChecks(allChecks);
      toast({
        title: "System Checks Complete",
        description: `Found ${allChecks.length} items to review`,
      });
    } catch (error) {
      console.error('Error running system checks:', error);
      toast({
        title: "Error Running Checks",
        description: "An error occurred while running system checks",
        variant: "destructive",
      });
    } finally {
      setIsRunningChecks(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-medium mb-2 text-white">System Tools</h1>
        <p className="text-dashboard-muted">Manage and monitor system health</p>
      </header>

      <Card className="bg-dashboard-card border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-dashboard-accent1" />
              <CardTitle className="text-xl text-white">System Health Check</CardTitle>
            </div>
            <Button 
              onClick={runSystemChecks}
              disabled={isRunningChecks}
              className="bg-dashboard-accent1 hover:bg-dashboard-accent1/80"
            >
              Run System Checks
            </Button>
          </div>
          <CardDescription className="text-dashboard-muted">
            Comprehensive system analysis and security audit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] w-full rounded-md">
            {isRunningChecks ? (
              <SystemCheckProgress
                currentCheck={currentCheck}
                progress={(completedChecks / CHECKS.length) * 100}
                totalChecks={CHECKS.length}
                completedChecks={completedChecks}
              />
            ) : null}
            
            {systemChecks.length > 0 ? (
              <SystemCheckResults checks={systemChecks} />
            ) : !isRunningChecks ? (
              <Card className="border-dashboard-accent1/20 bg-dashboard-card/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-dashboard-accent1" />
                    <CardTitle>No Issues Found</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-dashboard-text">
                    All system checks passed successfully.
                  </p>
                </CardContent>
              </Card>
            ) : null}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemToolsView;