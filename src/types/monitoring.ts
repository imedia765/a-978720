import { SeverityLevel } from './audit';

export type MonitoringEventType = 
  | 'system_performance'
  | 'api_latency'
  | 'error_rate'
  | 'user_activity'
  | 'resource_usage';

export interface MonitoringLog {
  id: string;
  timestamp: string | null;
  event_type: MonitoringEventType;
  metric_name: string;
  metric_value: number;
  details?: Record<string, any> | null;
  severity: SeverityLevel | null;
}