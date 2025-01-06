import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface SystemCheckDetailsTableProps {
  checkType: string;
  details: any;
  memberNames?: { [key: string]: string };
}

export const SystemCheckDetailsTable = ({ checkType, details, memberNames }: SystemCheckDetailsTableProps) => {
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
              <TableCell colSpan={4} className="py-1.5 text-center">No data available</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    );
  }

  if (typeof details === 'string') return <div>{details}</div>;
  
  return (
    <div>
      {Object.entries(details).map(([key, value]) => (
        <div key={key} className="mb-1">
          <span className="font-medium text-dashboard-accent1">{key}:</span>{' '}
          <span className="text-dashboard-text">{JSON.stringify(value, null, 2)}</span>
        </div>
      ))}
    </div>
  );
};