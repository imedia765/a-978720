import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getStatusColor, getStatusIcon } from "./utils/systemCheckUtils";
import { SystemCheckDetailsTable } from "./SystemCheckDetailsTable";
import { SystemCheckActionButton } from "./SystemCheckActionButton";

interface SystemCheck {
  check_type: string;
  status: string;
  details: any;
}

interface SystemCheckResultsProps {
  checks: SystemCheck[];
}

type FixFunction = 
  | "fix_multiple_roles"
  | "assign_collector_role"
  | "fix_security_settings";

const getFixFunction = (checkType: string): FixFunction | null => {
  switch (checkType) {
    case 'Multiple Roles Assigned':
      return "fix_multiple_roles";
    case 'Collectors Without Role':
      return "assign_collector_role";
    case 'Security Settings':
      return "fix_security_settings";
    default:
      return null;
  }
};

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

  const handleFix = async (checkType: string, details: any) => {
    const functionName = getFixFunction(checkType);
    
    if (!functionName) {
      toast({
        title: "Action Not Available",
        description: "No automatic fix is available for this issue.",
        variant: "destructive",
      });
      return;
    }

    try {
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

  const groupedChecks = checks.reduce((acc: { [key: string]: SystemCheck[] }, check) => {
    if (!acc[check.check_type]) {
      acc[check.check_type] = [];
    }
    acc[check.check_type].push(check);
    return acc;
  }, {});

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'XCircle':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'AlertTriangle':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'CheckCircle2':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
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
                {getIconComponent(getStatusIcon(checksOfType[0].status))}
                <CardTitle className="text-lg">
                  {checkType}
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${getStatusColor(checksOfType[0].status)}`}>
                    {checksOfType[0].status}
                  </span>
                </CardTitle>
              </div>
              <SystemCheckActionButton 
                checkType={checkType}
                details={checksOfType[0].details}
                onFix={handleFix}
              />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-sm">
              <SystemCheckDetailsTable 
                checkType={checkType}
                details={checksOfType.length === 1 ? checksOfType[0].details : checksOfType.map(c => c.details)}
                memberNames={memberNames}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SystemCheckResults;