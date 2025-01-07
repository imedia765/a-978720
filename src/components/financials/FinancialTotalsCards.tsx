import { Wallet, Users, Receipt, PoundSterling } from "lucide-react";
import { Card } from "@/components/ui/card";
import TotalCount from '../TotalCount';

interface FinancialTotalsProps {
  totals: {
    totalCollected: number;
    pendingAmount: number;
    remainingAmount: number;
    totalCollectors: number;
  };
}

const FinancialTotalsCards = ({ totals }: FinancialTotalsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
      <Card className="bg-emerald-500/10 border-emerald-500/20 p-2 sm:p-3 md:p-4 hover:bg-emerald-500/15 transition-colors">
        <TotalCount
          items={[{
            count: `£${totals.totalCollected.toLocaleString()}`,
            label: "Total Amount Collected",
            icon: <Wallet className="h-3.5 sm:h-4 md:h-5 w-3.5 sm:w-4 md:w-5 text-emerald-400" />
          }]}
        />
      </Card>
      
      <Card className="bg-amber-500/10 border-amber-500/20 p-2 sm:p-3 md:p-4 hover:bg-amber-500/15 transition-colors">
        <TotalCount
          items={[{
            count: `£${totals.pendingAmount.toLocaleString()}`,
            label: "Pending Amount",
            icon: <Receipt className="h-3.5 sm:h-4 md:h-5 w-3.5 sm:w-4 md:w-5 text-amber-400" />
          }]}
        />
      </Card>
      
      <Card className="bg-rose-500/10 border-rose-500/20 p-2 sm:p-3 md:p-4 hover:bg-rose-500/15 transition-colors">
        <TotalCount
          items={[{
            count: `£${totals.remainingAmount.toLocaleString()}`,
            label: "Remaining to Collect",
            icon: <PoundSterling className="h-3.5 sm:h-4 md:h-5 w-3.5 sm:w-4 md:w-5 text-rose-400" />
          }]}
        />
      </Card>
      
      <Card className="bg-indigo-500/10 border-indigo-500/20 p-2 sm:p-3 md:p-4 hover:bg-indigo-500/15 transition-colors">
        <TotalCount
          items={[{
            count: totals.totalCollectors,
            label: "Active Collectors",
            icon: <Users className="h-3.5 sm:h-4 md:h-5 w-3.5 sm:w-4 md:w-5 text-indigo-400" />
          }]}
        />
      </Card>
    </div>
  );
};

export default FinancialTotalsCards;