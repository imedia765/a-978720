import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import FinancialTotalsCards from './financials/FinancialTotalsCards';
import FinancialTabs from './financials/FinancialTabs';

const CollectorFinancialsView = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: totals, isLoading } = useQuery({
    queryKey: ['financial-totals'],
    queryFn: async () => {
      console.log('Fetching financial totals');
      
      // Get total counts first
      const { count: paymentsCount } = await supabase
        .from('payment_requests')
        .select('*', { count: 'exact', head: true });

      const { count: collectorsCount } = await supabase
        .from('members_collectors')
        .select('*', { count: 'exact', head: true });

      const { count: membersCount } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true });

      console.log('Total counts:', { paymentsCount, collectorsCount, membersCount });

      // Fetch all payments with proper pagination
      let allPayments = [];
      let page = 0;
      const pageSize = 1000;
      const totalPages = Math.ceil((paymentsCount || 0) / pageSize);
      
      for (let page = 0; page < totalPages; page++) {
        const { data: payments, error: paymentsError } = await supabase
          .from('payment_requests')
          .select('amount, status, payment_type')
          .range(page * pageSize, (page + 1) * pageSize - 1);
        
        if (paymentsError) {
          console.error('Error fetching payments:', paymentsError);
          throw paymentsError;
        }

        if (!payments) break;
        allPayments = [...allPayments, ...payments];
      }

      // Fetch all collectors with proper pagination
      let allCollectors = [];
      const totalCollectorPages = Math.ceil((collectorsCount || 0) / pageSize);
      
      for (let page = 0; page < totalCollectorPages; page++) {
        const { data: collectors, error: collectorsError } = await supabase
          .from('members_collectors')
          .select('*')
          .range(page * pageSize, (page + 1) * pageSize - 1);
        
        if (collectorsError) {
          console.error('Error fetching collectors:', collectorsError);
          throw collectorsError;
        }

        if (!collectors) break;
        allCollectors = [...allCollectors, ...collectors];
      }

      // Fetch all members with proper pagination
      let allMembers = [];
      const totalMemberPages = Math.ceil((membersCount || 0) / pageSize);
      
      for (let page = 0; page < totalMemberPages; page++) {
        const { data: members, error: membersError } = await supabase
          .from('members')
          .select('yearly_payment_amount, emergency_collection_amount, yearly_payment_status, emergency_collection_status')
          .range(page * pageSize, (page + 1) * pageSize - 1);
        
        if (membersError) {
          console.error('Error fetching members:', membersError);
          throw membersError;
        }

        if (!members) break;
        allMembers = [...allMembers, ...members];
      }

      console.log('Total items fetched:', {
        payments: allPayments.length,
        collectors: allCollectors.length,
        members: allMembers.length
      });

      const totalAmount = allPayments.reduce((sum, payment) => 
        payment.status === 'approved' ? sum + Number(payment.amount) : sum, 0
      ) || 0;

      const pendingAmount = allPayments.reduce((sum, payment) => 
        payment.status === 'pending' ? sum + Number(payment.amount) : sum, 0
      ) || 0;

      const totalYearlyDue = allMembers.reduce((sum, member) => 
        sum + (member.yearly_payment_amount || 40), 0
      ) || 0;

      const totalEmergencyDue = allMembers.reduce((sum, member) => 
        sum + (member.emergency_collection_amount || 0), 0
      ) || 0;

      const totalCollectionDue = totalYearlyDue + totalEmergencyDue;
      const remainingCollection = totalCollectionDue - totalAmount;

      return {
        totalCollected: totalAmount,
        pendingAmount: pendingAmount,
        remainingAmount: remainingCollection,
        totalCollectors: allCollectors.length || 0,
        totalTransactions: allPayments.length || 0
      };
    }
  });

  if (isLoading) {
    return <div className="p-4 text-white">Loading financial data...</div>;
  }

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6 p-2 sm:p-3 md:p-4">
      <header className="mb-3 sm:mb-4 md:mb-6">
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-medium mb-1 sm:mb-2 text-white">
          Financial & Collector Management
        </h1>
        <p className="text-xs sm:text-sm text-white/80">
          Manage payments and collector assignments
        </p>
      </header>

      {totals && <FinancialTotalsCards totals={totals} />}
      
      <FinancialTabs 
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
};

export default CollectorFinancialsView;