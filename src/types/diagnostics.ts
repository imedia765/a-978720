import { Json } from '@/integrations/supabase/types';

export interface RoleIssue {
  user_id: string;
  member_number: string;
  full_name: string;
  issue_type: string;
  details: any;
}

export interface MemberIssue {
  issue_type: string;
  description: string;
  affected_table: string;
  member_number: string;
  details: Json;
}

export interface SecurityIssue {
  check_type: string;
  status: string;
  details: Json;
}

export interface DiagnosticResult {
  timestamp: string;
  category: string;
  findings: RoleIssue[] | MemberIssue[] | SecurityIssue[];
  status: 'success' | 'warning' | 'error';
}