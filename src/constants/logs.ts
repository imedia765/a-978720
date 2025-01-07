export const LOGS_TABS = {
  AUDIT: 'audit',
  MONITORING: 'monitoring',
} as const;

export type LogsTabsType = typeof LOGS_TABS[keyof typeof LOGS_TABS];