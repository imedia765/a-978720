import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import TotalCount from "@/components/TotalCount";
import { Users, Wallet, Receipt, PoundSterling, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const PaymentStatistics = () => {
  const { data: stats } = useQuery({
    queryKey: ['payment-statistics'],
    queryFn: async () => {
      const { data: members, error } = await supabase
        .from('members')
        .select('yearly_payment_status, emergency_collection_status, emergency_collection_amount, yearly_payment_amount');

      if (error) throw error;

      const totalMembers = members?.length || 0;
      const yearlyPaid = members?.filter(m => m.yearly_payment_status === 'completed').length || 0;
      const yearlyUnpaid = totalMembers - yearlyPaid;
      const emergencyPaid = members?.filter(m => m.emergency_collection_status === 'completed').length || 0;
      const emergencyUnpaid = totalMembers - emergencyPaid;
      
      const totalYearlyAmount = totalMembers * 40; // £40 per member
      const collectedYearlyAmount = yearlyPaid * 40;
      const remainingYearlyAmount = yearlyUnpaid * 40;
      
      const totalEmergencyAmount = members?.reduce((sum, m) => sum + (m.emergency_collection_amount || 0), 0) || 0;
      const collectedEmergencyAmount = members
        ?.filter(m => m.emergency_collection_status === 'completed')
        .reduce((sum, m) => sum + (m.emergency_collection_amount || 0), 0) || 0;
      const remainingEmergencyAmount = totalEmergencyAmount - collectedEmergencyAmount;

      return {
        yearlyStats: {
          totalAmount: totalYearlyAmount,
          collectedAmount: collectedYearlyAmount,
          remainingAmount: remainingYearlyAmount,
          paidMembers: yearlyPaid,
          unpaidMembers: yearlyUnpaid,
          completionRate: ((yearlyPaid / totalMembers) * 100).toFixed(1)
        },
        emergencyStats: {
          totalAmount: totalEmergencyAmount,
          collectedAmount: collectedEmergencyAmount,
          remainingAmount: remainingEmergencyAmount,
          paidMembers: emergencyPaid,
          unpaidMembers: emergencyUnpaid,
          completionRate: ((emergencyPaid / totalMembers) * 100).toFixed(1)
        }
      };
    }
  });

  if (!stats) return null;

  return (
    <Card className="bg-dashboard-card p-6 mt-8 border border-white/10">
      <h3 className="text-xl font-medium text-white mb-6 flex items-center gap-2">
        <Receipt className="w-5 h-5 text-dashboard-accent1" />
        Collection Statistics
      </h3>
      
      <div className="space-y-8">
        {/* Yearly Collections Section */}
        <div className="bg-white/5 rounded-lg p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-lg font-medium text-dashboard-accent1 mb-1">Yearly Collections</h4>
              <p className="text-dashboard-muted text-sm">Annual membership fees</p>
            </div>
            <div className="w-20 h-20">
              <CircularProgressbar
                value={Number(stats.yearlyStats.completionRate)}
                text={`${stats.yearlyStats.completionRate}%`}
                styles={buildStyles({
                  pathColor: '#7EBF8E',
                  textColor: '#7EBF8E',
                  trailColor: 'rgba(255,255,255,0.1)',
                })}
              />
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <p className="text-dashboard-muted text-sm mb-1">Total Expected</p>
              <p className="text-2xl font-semibold text-white">£{stats.yearlyStats.totalAmount}</p>
            </div>
            <div className="bg-dashboard-accent3/10 p-4 rounded-lg border border-dashboard-accent3/20">
              <p className="text-dashboard-accent3 text-sm mb-1">Collected</p>
              <p className="text-2xl font-semibold text-dashboard-accent3">£{stats.yearlyStats.collectedAmount}</p>
            </div>
            <div className="bg-dashboard-warning/10 p-4 rounded-lg border border-dashboard-warning/20">
              <p className="text-dashboard-warning text-sm mb-1">Remaining</p>
              <p className="text-2xl font-semibold text-dashboard-warning">£{stats.yearlyStats.remainingAmount}</p>
            </div>
          </div>
        </div>

        {/* Emergency Collections Section */}
        <div className="bg-white/5 rounded-lg p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-lg font-medium text-dashboard-accent2 mb-1">Emergency Collections</h4>
              <p className="text-dashboard-muted text-sm">Special purpose collections</p>
            </div>
            <div className="w-20 h-20">
              <CircularProgressbar
                value={Number(stats.emergencyStats.completionRate)}
                text={`${stats.emergencyStats.completionRate}%`}
                styles={buildStyles({
                  pathColor: '#61AAF2',
                  textColor: '#61AAF2',
                  trailColor: 'rgba(255,255,255,0.1)',
                })}
              />
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <p className="text-dashboard-muted text-sm mb-1">Total Expected</p>
              <p className="text-2xl font-semibold text-white">£{stats.emergencyStats.totalAmount}</p>
            </div>
            <div className="bg-dashboard-accent2/10 p-4 rounded-lg border border-dashboard-accent2/20">
              <p className="text-dashboard-accent2 text-sm mb-1">Collected</p>
              <p className="text-2xl font-semibold text-dashboard-accent2">£{stats.emergencyStats.collectedAmount}</p>
            </div>
            <div className="bg-dashboard-warning/10 p-4 rounded-lg border border-dashboard-warning/20">
              <p className="text-dashboard-warning text-sm mb-1">Remaining</p>
              <p className="text-2xl font-semibold text-dashboard-warning">£{stats.emergencyStats.remainingAmount}</p>
            </div>
          </div>
        </div>

        {/* Member Statistics */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-white/5 p-4 rounded-lg border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-dashboard-accent1" />
              <h4 className="text-dashboard-accent1 font-medium">Yearly Payment Members</h4>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-dashboard-muted mb-1">Paid Members</p>
                <p className="text-xl font-semibold text-dashboard-accent3">{stats.yearlyStats.paidMembers}</p>
              </div>
              <div>
                <p className="text-sm text-dashboard-muted mb-1">Unpaid Members</p>
                <p className="text-xl font-semibold text-dashboard-warning">{stats.yearlyStats.unpaidMembers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 p-4 rounded-lg border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-dashboard-accent2" />
              <h4 className="text-dashboard-accent2 font-medium">Emergency Collection Members</h4>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-dashboard-muted mb-1">Paid Members</p>
                <p className="text-xl font-semibold text-dashboard-accent3">{stats.emergencyStats.paidMembers}</p>
              </div>
              <div>
                <p className="text-sm text-dashboard-muted mb-1">Unpaid Members</p>
                <p className="text-xl font-semibold text-dashboard-warning">{stats.emergencyStats.unpaidMembers}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PaymentStatistics;