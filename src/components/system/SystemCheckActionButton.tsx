import { Button } from "@/components/ui/button";
import { UserCheck, Key, Shield, Database } from "lucide-react";

interface SystemCheckActionButtonProps {
  checkType: string;
  details: any;
  onFix: (checkType: string, details: any) => Promise<void>;
}

export const SystemCheckActionButton = ({ checkType, details, onFix }: SystemCheckActionButtonProps) => {
  switch (checkType) {
    case 'Multiple Roles Assigned':
      return (
        <Button 
          onClick={() => onFix(checkType, details)}
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
          onClick={() => onFix(checkType, details)}
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
          onClick={() => onFix(checkType, details)}
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
          onClick={() => onFix(checkType, details)}
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