import { AlertTriangle, Users } from 'lucide-react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface RoleIssueProps {
  issue: {
    user_id: string;
    member_number: string;
    full_name: string;
    issue_type: string;
    details: any;
  };
  onRoleChange: (userId: string, newRole: AppRole) => Promise<void>;
}

const RoleIssueAlert = ({ issue, onRoleChange }: RoleIssueProps) => {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{issue.issue_type}</AlertTitle>
      <AlertDescription>
        <div className="mt-2">
          <p><strong>Member:</strong> {issue.full_name}</p>
          <p><strong>Member Number:</strong> {issue.member_number}</p>
          <p>{issue.details}</p>
          {issue.user_id && (
            <div className="mt-4">
              <Select onValueChange={(value: AppRole) => onRoleChange(issue.user_id, value)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Change Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="collector">Collector</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default RoleIssueAlert;