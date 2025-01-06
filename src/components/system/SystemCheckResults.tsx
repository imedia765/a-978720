import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, CheckCircle2, Info, XCircle, UserCheck, Shield, Key, Database } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface SystemCheck {
  check_type: string;
  status: string;
  details: any;
}

interface SystemCheckResultsProps {
  checks: SystemCheck[];
}

const SystemCheckResults = ({ checks }: SystemCheckResultsProps) => {
  const { toast } = useToast();
  
  const { data: memberNames } = useQuery({
    queryKey: ['member-names'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('auth_user_id, full_name');
      if (error) throw error;
      return data.reduce((acc: { [key: string]: string }, member) => {
        if (member.auth_user_id) {
          acc[member.auth_user_id] = member.full_name;
        }
        return acc;
      }, {});
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'critical':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'warning':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'success':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      default:
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  const formatDetails = (checkType: string, details: any) => {
    if (checkType === 'Collectors Without Role' && Array.isArray(details)) {
      return (
        <Table className="border-collapse">
          <TableHeader className="bg-dashboard-card/50">
            <TableRow className="border-b border-white/10">
              <TableHead className="py-2">Collector Name</TableHead>
              <TableHead className="py-2">Member Number</TableHead>
              <TableHead className="py-2">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {details.map((item: any, index: number) => (
              <TableRow key={index} className="border-b border-white/5 hover:bg-dashboard-card/80">
                <TableCell className="py-1.5">{item.collector_name}</TableCell>
                <TableCell className="py-1.5">{item.member_number || 'Not Assigned'}</TableCell>
                <TableCell className="py-1.5">
                  <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-500/10 text-yellow-500">
                    Warning
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    if (checkType === 'Multiple Roles Assigned') {
      return (
        <Table className="border-collapse">
          <TableHeader className="bg-dashboard-card/50">
            <TableRow className="border-b border-white/10">
              <TableHead className="py-2">Member Name</TableHead>
              <TableHead className="py-2">User ID</TableHead>
              <TableHead className="py-2">Roles</TableHead>
              <TableHead className="py-2">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.isArray(details) ? details.map((item: any, index: number) => (
              <TableRow key={index} className="border-b border-white/5 hover:bg-dashboard-card/80">
                <TableCell className="py-1.5 text-dashboard-accent1 font-medium">
                  {memberNames?.[item.user_id] || 'Unknown Member'}
                </TableCell>
                <TableCell className="py-1.5 text-xs">{item.user_id}</TableCell>
                <TableCell className="py-1.5">{Array.isArray(item.roles) ? item.roles.join(', ') : item.roles}</TableCell>
                <TableCell className="py-1.5 text-xs">
                  {Array.isArray(item.created_at) 
                    ? item.created_at.map((date: string) => 
                        new Date(date).toLocaleDateString()
                      ).join(', ')
                    : new Date(item.created_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            )) : (
              <TableRow className="border-b border-white/5">
                <TableCell className="py-1.5 text-dashboard-accent1 font-medium">
                  {memberNames?.[details.user_id] || 'Unknown Member'}
                </TableCell>
                <TableCell className="py-1.5 text-xs">{details.user_id}</TableCell>
                <TableCell className="py-1.5">{Array.isArray(details.roles) ? details.roles.join(', ') : details.roles}</TableCell>
                <TableCell className="py-1.5 text-xs">
                  {Array.isArray(details.created_at) 
                    ? details.created_at.map((date: string) => 
                        new Date(date).toLocaleDateString()
                      ).join(', ')
                    : new Date(details.created_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      );
    }

    if (typeof details === 'string') return details;
    return Object.entries(details).map(([key, value]) => (
      <div key={key} className="mb-1">
        <span className="font-medium text-dashboard-accent1">{key}:</span>{' '}
        <span className="text-dashboard-text">{JSON.stringify(value, null, 2)}</span>
      </div>
    ));
  };

  const groupedChecks = checks.reduce((acc: { [key: string]: SystemCheck[] }, check) => {
    if (!acc[check.check_type]) {
      acc[check.check_type] = [];
    }
    acc[check.check_type].push(check);
    return acc;
  }, {});

  const handleFix = async (checkType: string, details: any) => {
    try {
      let functionName = '';
      
      switch (checkType) {
        case 'Multiple Roles Assigned':
          functionName = 'fix_multiple_roles';
          break;
        case 'Collectors Without Role':
          functionName = 'assign_collector_role';
          break;
        case 'Security Settings':
          functionName = 'fix_security_settings';
          break;
        default:
          toast({
            title: "Action Not Available",
            description: "No automatic fix is available for this issue.",
            variant: "destructive",
          });
          return;
      }

      const { data, error } = await supabase.rpc(functionName, { issue_details: details });
      
      if (error) throw error;
      
      toast({
        title: "Fix Applied",
        description: `Successfully resolved ${checkType} issue`,
      });
    } catch (error) {
      console.error('Fix error:', error);
      toast({
        title: "Error",
        description: "Failed to apply fix. Please try again or contact support.",
        variant: "destructive",
      });
    }
  };

  const getActionButton = (checkType: string, details: any) => {
    switch (checkType) {
      case 'Multiple Roles Assigned':
        return (
          <Button 
            onClick={() => handleFix(checkType, details)}
            size="sm"
            className="bg-blue-500 hover:bg-blue-600"
          >
            <UserCheck className="w-4 h-4 mr-2" />
            Fix Roles
          </Button>
        );
      case 'Collectors Without Role':
        return (
          <Button 
            onClick={() => handleFix(checkType, details)}
            size="sm"
            className="bg-green-500 hover:bg-green-600"
          >
            <Key className="w-4 h-4 mr-2" />
            Assign Role
          </Button>
        );
      case 'Security Settings':
        return (
          <Button 
            onClick={() => handleFix(checkType, details)}
            size="sm"
            className="bg-purple-500 hover:bg-purple-600"
          >
            <Shield className="w-4 h-4 mr-2" />
            Fix Security
          </Button>
        );
      case 'Member Number Issues':
        return (
          <Button 
            onClick={() => handleFix(checkType, details)}
            size="sm"
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Database className="w-4 h-4 mr-2" />
            Fix Numbers
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Object.entries(groupedChecks).map(([checkType, checksOfType], index) => (
        <Card 
          key={index}
          className={`border ${getStatusColor(checksOfType[0].status)} bg-dashboard-card/50`}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(checksOfType[0].status)}
                <CardTitle className="text-lg">
                  {checkType}
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${getStatusColor(checksOfType[0].status)}`}>
                    {checksOfType[0].status}
                  </span>
                </CardTitle>
              </div>
              {getActionButton(checkType, checksOfType[0].details)}
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-sm">
              {formatDetails(checkType, checksOfType.length === 1 ? checksOfType[0].details : checksOfType.map(c => c.details))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SystemCheckResults;
