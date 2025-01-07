export type SeverityLevel = 'info' | 'warning' | 'error' | 'critical';
export type AuditOperation = 'create' | 'update' | 'delete';

export interface AuditLog {
  id: string;
  timestamp: string;
  user_id: string | null;
  operation: AuditOperation;
  table_name: string;
  record_id?: string | null;
  old_values?: Record<string, any> | null;
  new_values?: Record<string, any> | null;
  severity: SeverityLevel;
  compressed: boolean | null;
}