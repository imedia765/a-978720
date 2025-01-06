import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";

interface SystemCheck {
  check_type: string;
  status: string;
  details: any;
}

interface SystemCheckResultsProps {
  checks: SystemCheck[];
}

const SystemCheckResults = ({ checks }: SystemCheckResultsProps) => {
  // Query to fetch member names
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
    // Handle collector role issues
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

    // Handle multiple roles
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

    // Default formatting for other types of details
    if (typeof details === 'string') return details;
    return Object.entries(details).map(([key, value]) => (
      <div key={key} className="mb-1">
        <span className="font-medium text-dashboard-accent1">{key}:</span>{' '}
        <span className="text-dashboard-text">{JSON.stringify(value, null, 2)}</span>
      </div>
    ));
  };

  // Group checks by check_type
  const groupedChecks = checks.reduce((acc: { [key: string]: SystemCheck[] }, check) => {
    if (!acc[check.check_type]) {
      acc[check.check_type] = [];
    }
    acc[check.check_type].push(check);
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Object.entries(groupedChecks).map(([checkType, checksOfType], index) => (
        <Card 
          key={index}
          className={`border ${getStatusColor(checksOfType[0].status)} bg-dashboard-card/50`}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              {getStatusIcon(checksOfType[0].status)}
              <CardTitle className="text-lg">
                {checkType}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${getStatusColor(checksOfType[0].status)}`}>
                  {checksOfType[0].status}
                </span>
              </CardTitle>
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
