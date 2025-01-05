import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, Users } from 'lucide-react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface RoleIssue {
  user_id: string;
  member_number: string;
  full_name: string;
  issue_type: string;
  details: any;
}

const RoleManagement = () => {
  const [isChecking, setIsChecking] = useState(false);

  const { data: roleIssues, refetch: refetchRoleIssues } = useQuery({
    queryKey: ['role_issues'],
    queryFn: async () => {
      console.log('Checking role inconsistencies...');
      
      // Get all members with their auth_user_id
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

      const issues: RoleIssue[] = [];

      // Check for members without auth_user_id
      members.forEach(member => {
        if (!member.auth_user_id) {
          issues.push({
            user_id: '',
            member_number: member.member_number,
            full_name: member.full_name,
            issue_type: 'Missing Auth User',
            details: 'Member has no associated auth user'
          });
        }
      });

      // Check for role inconsistencies
      members
        .filter(m => m.auth_user_id)
        .forEach(member => {
          const memberRoles = userRoles.filter(r => r.user_id === member.auth_user_id);
          const isCollector = collectors.some(c => c.member_number === member.member_number);

          // Collector without collector role
          if (isCollector && !memberRoles.some(r => r.role === 'collector')) {
            issues.push({
              user_id: member.auth_user_id!,
              member_number: member.member_number,
              full_name: member.full_name,
              issue_type: 'Missing Collector Role',
              details: 'User is in collectors table but missing collector role'
            });
          }

          // Has collector role but not in collectors table
          if (!isCollector && memberRoles.some(r => r.role === 'collector')) {
            issues.push({
              user_id: member.auth_user_id!,
              member_number: member.member_number,
              full_name: member.full_name,
              issue_type: 'Invalid Collector Role',
              details: 'User has collector role but not in collectors table'
            });
          }

          // No member role
          if (!memberRoles.some(r => r.role === 'member')) {
            issues.push({
              user_id: member.auth_user_id!,
              member_number: member.member_number,
              full_name: member.full_name,
              issue_type: 'Missing Member Role',
              details: 'All users should have at least member role'
            });
          }
        });

      return issues;
    },
    enabled: false
  });

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    try {
      // First delete existing role
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Then insert new role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: newRole
        });

      if (insertError) throw insertError;

      // Refresh the issues list
      await refetchRoleIssues();
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const handleCheck = async () => {
    setIsChecking(true);
    try {
      await refetchRoleIssues();
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium text-white flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Role Management
        </h2>
        <Button 
          onClick={handleCheck} 
          disabled={isChecking}
        >
          Check Roles
        </Button>
      </div>

      {roleIssues && roleIssues.length > 0 ? (
        <div className="space-y-4">
          {roleIssues.map((issue, index) => (
            <Alert 
              key={index}
              variant="destructive"
            >
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{issue.issue_type}</AlertTitle>
              <AlertDescription>
                <div className="mt-2">
                  <p><strong>Member:</strong> {issue.full_name}</p>
                  <p><strong>Member Number:</strong> {issue.member_number}</p>
                  <p>{issue.details}</p>
                  {issue.user_id && (
                    <div className="mt-4">
                      <Select onValueChange={(value: AppRole) => handleRoleChange(issue.user_id, value)}>
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
          ))}
        </div>
      ) : roleIssues?.length === 0 ? (
        <Alert>
          <Users className="h-4 w-4" />
          <AlertTitle>All Clear</AlertTitle>
          <AlertDescription>
            No role inconsistencies were found.
          </AlertDescription>
        </Alert>
      ) : null}
    </section>
  );
};

export default RoleManagement;