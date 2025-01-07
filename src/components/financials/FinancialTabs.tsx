import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PaymentStatistics from './PaymentStatistics';
import CollectorsSummary from './CollectorsSummary';
import AllPaymentsTable from './AllPaymentsTable';
import CollectorsList from '../CollectorsList';
import { Card } from "@/components/ui/card";

interface FinancialTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
}

const FinancialTabs = ({ activeTab, onTabChange }: FinancialTabsProps) => {
  return (
    <Card className="bg-dashboard-card border-white/10">
      <Tabs defaultValue="overview" value={activeTab} onValueChange={onTabChange}>
        <TabsList className="flex flex-col sm:flex-row w-full gap-1 sm:gap-2 bg-white/5 p-1">
          <TabsTrigger 
            className="w-full sm:w-auto text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2" 
            value="overview"
          >
            Payment Overview
          </TabsTrigger>
          <TabsTrigger 
            className="w-full sm:w-auto text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2" 
            value="collectors"
          >
            Collectors Overview
          </TabsTrigger>
          <TabsTrigger 
            className="w-full sm:w-auto text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2" 
            value="payments"
          >
            All Payments
          </TabsTrigger>
        </TabsList>

        <div className="p-2 sm:p-3 md:p-4">
          <TabsContent value="overview" className="mt-2 sm:mt-3 md:mt-4">
            <PaymentStatistics />
          </TabsContent>

          <TabsContent value="collectors" className="mt-2 sm:mt-3 md:mt-4">
            <div className="space-y-3 sm:space-y-4 md:space-y-6">
              <CollectorsList />
              <CollectorsSummary />
            </div>
          </TabsContent>

          <TabsContent value="payments" className="mt-2 sm:mt-3 md:mt-4">
            <AllPaymentsTable showHistory={true} />
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  );
};

export default FinancialTabs;