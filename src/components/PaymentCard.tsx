import { Card } from "@/components/ui/card";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { format } from 'date-fns';
import { AlertCircle, AlertOctagon, Check, Clock } from "lucide-react";

interface PaymentCardProps {
  annualPaymentStatus?: 'completed' | 'pending' | 'due' | 'overdue';
  emergencyCollectionStatus?: 'completed' | 'pending' | 'due' | 'overdue';
  emergencyCollectionAmount?: number;
  annualPaymentDueDate?: string;
  emergencyCollectionDueDate?: string;
  lastAnnualPaymentDate?: string;
  lastEmergencyPaymentDate?: string;
  lastAnnualPaymentAmount?: number;
  lastEmergencyPaymentAmount?: number;
}

const PaymentCard = ({ 
  annualPaymentStatus = 'pending',
  emergencyCollectionStatus = 'pending',
  emergencyCollectionAmount = 0,
  annualPaymentDueDate,
  emergencyCollectionDueDate,
  lastAnnualPaymentDate,
  lastEmergencyPaymentDate,
  lastAnnualPaymentAmount,
  lastEmergencyPaymentAmount
}: PaymentCardProps) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    try {
      return format(new Date(dateString), 'MMM do, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-gradient-to-r from-emerald-500/20 to-emerald-400/20 text-emerald-400 border border-emerald-500/30';
      case 'due':
        return 'bg-gradient-to-r from-amber-500/20 to-amber-400/20 text-amber-400 border border-amber-500/30';
      case 'overdue':
        return 'bg-gradient-to-r from-rose-500/20 to-rose-400/20 text-rose-400 border border-rose-500/30';
      case 'pending':
        return 'bg-gradient-to-r from-blue-500/20 to-blue-400/20 text-blue-400 border border-blue-500/30';
      default:
        return 'bg-gradient-to-r from-blue-500/20 to-blue-400/20 text-blue-400 border border-blue-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check className="h-6 w-6" />;
      case 'due':
        return <Clock className="h-6 w-6" />;
      case 'overdue':
        return <AlertOctagon className="h-6 w-6" />;
      case 'pending':
        return <AlertCircle className="h-6 w-6" />;
      default:
        return <AlertCircle className="h-6 w-6" />;
    }
  };

  return (
    <Card className="dashboard-card bg-gradient-to-br from-dashboard-dark/90 to-dashboard-dark/70">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Annual Payment Section */}
        <div className="p-6 glass-card rounded-lg border border-white/10 hover:border-white/20 transition-colors bg-gradient-to-br from-dashboard-accent1/10 to-dashboard-accent2/5 backdrop-blur-xl">
          <h3 className="text-lg font-medium mb-4 bg-clip-text text-transparent bg-gradient-to-r from-dashboard-accent1 via-dashboard-accent2 to-dashboard-accent1">Annual Payment</h3>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white">£40</p>
              <p className="text-sm font-bold" style={{ color: getStatusColor(annualPaymentStatus).split(' ')[1].replace('text-', '') }}>
                Due: {formatDate(annualPaymentDueDate)}
              </p>
              {lastAnnualPaymentDate && (
                <div className="mt-2">
                  <p className="text-xs text-dashboard-muted/80">
                    Last payment: {formatDate(lastAnnualPaymentDate)}
                  </p>
                  {lastAnnualPaymentAmount && (
                    <p className="text-xs text-emerald-400/90">
                      Amount: £{lastAnnualPaymentAmount}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-lg backdrop-blur-sm ${getStatusColor(annualPaymentStatus)} bg-opacity-15`}>
                {annualPaymentStatus}
              </span>
              <div className="w-12 h-12" style={{ color: getStatusColor(annualPaymentStatus).split(' ')[1].replace('text-', '') }}>
                {getStatusIcon(annualPaymentStatus)}
              </div>
            </div>
          </div>
          <div className="text-sm text-dashboard-text/90">
            {annualPaymentStatus === 'completed' 
              ? 'Payment completed' 
              : (
                <div className="space-y-1">
                  <p>Payment {annualPaymentStatus}</p>
                  <p className="text-dashboard-muted/80">
                    {annualPaymentStatus === 'overdue' 
                      ? 'Please complete your overdue payment immediately'
                      : 'Please complete your payment before the due date'}
                  </p>
                </div>
              )}
          </div>
        </div>

        {/* Emergency Collection Section */}
        <div className="p-6 glass-card rounded-lg border border-white/10 hover:border-white/20 transition-colors bg-gradient-to-br from-dashboard-accent2/10 to-dashboard-accent3/5 backdrop-blur-xl">
          <h3 className="text-lg font-medium mb-4 bg-clip-text text-transparent bg-gradient-to-r from-dashboard-accent2 via-dashboard-accent3 to-dashboard-accent2">Emergency Collection</h3>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white">
                £{emergencyCollectionAmount}
              </p>
              <p className="text-sm font-bold" style={{ color: getStatusColor(emergencyCollectionStatus).split(' ')[1].replace('text-', '') }}>
                Due: {formatDate(emergencyCollectionDueDate)}
              </p>
              {lastEmergencyPaymentDate && (
                <div className="mt-2">
                  <p className="text-xs text-dashboard-muted/80">
                    Last payment: {formatDate(lastEmergencyPaymentDate)}
                  </p>
                  {lastEmergencyPaymentAmount && (
                    <p className="text-xs text-emerald-400/90">
                      Amount: £{lastEmergencyPaymentAmount}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-lg backdrop-blur-sm ${getStatusColor(emergencyCollectionStatus)} bg-opacity-15`}>
                {emergencyCollectionStatus}
              </span>
              <div className="w-12 h-12" style={{ color: getStatusColor(emergencyCollectionStatus).split(' ')[1].replace('text-', '') }}>
                {getStatusIcon(emergencyCollectionStatus)}
              </div>
            </div>
          </div>
          <div className="text-sm text-dashboard-text/90">
            {emergencyCollectionStatus === 'completed' 
              ? 'Payment completed' 
              : (
                <div className="space-y-1">
                  <p>Payment {emergencyCollectionStatus}</p>
                  <p className="text-dashboard-muted/80">
                    {emergencyCollectionStatus === 'overdue'
                      ? 'Emergency collection payment is overdue'
                      : 'One-time emergency collection payment required'}
                  </p>
                </div>
              )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PaymentCard;
