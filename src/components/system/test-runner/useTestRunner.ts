import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TestResult {
  check_type: string;
  metric_name: string | null;
  current_value: number | null;
  threshold: number | null;
  status: string;
  details: Record<string, any>;
  test_category: string;
}

export const useTestRunner = () => {
  const [testLogs, setTestLogs] = useState<string[]>(['Test runner initialized and ready']);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTest, setCurrentTest] = useState('');
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  const runAllTests = async () => {
    setIsRunning(true);
    setTestLogs(prev => [...prev, '🚀 Starting combined system checks...']);
    setProgress(0);
    
    try {
      console.log('Initiating system checks...');
      
      const { data, error } = await supabase
        .rpc('run_combined_system_checks');

      if (error) {
        console.error('Test run error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        const errorMessage = error.message || 'Unknown error occurred';
        const errorDetails = error.details || '';
        setTestLogs(prev => [
          ...prev,
          `❌ Error running checks: ${errorMessage}`,
          `📝 Error details: ${errorDetails}`
        ]);
        throw new Error(`${errorMessage}\n${errorDetails}`);
      }

      if (!data || !Array.isArray(data)) {
        const message = 'Invalid response format from system checks';
        setTestLogs(prev => [...prev, `❌ ${message}`]);
        throw new Error(message);
      }

      console.log('Combined system checks results:', data);

      const processedResults = data.map((result: TestResult) => ({
        check_type: result.check_type || 'Unknown Check',
        metric_name: result.metric_name,
        current_value: result.current_value,
        threshold: result.threshold,
        status: result.status || 'Unknown',
        details: result.details || {},
        test_category: result.test_category || 'system'
      }));

      setTestResults(processedResults);
      setProgress(100);
      setCurrentTest('All checks complete');
      setTestLogs(prev => [
        ...prev, 
        '✅ System checks completed successfully',
        `📊 Found ${processedResults.length} test results`
      ]);
      toast.success(`System checks completed: ${processedResults.length} results`);
      
      return processedResults;
    } catch (error: any) {
      console.error('System checks error:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      setTestLogs(prev => [
        ...prev, 
        `❌ Error running checks: ${errorMessage}`,
        '⚠️ Check console for detailed error information'
      ]);
      toast.error(`System checks failed: ${errorMessage}`);
      throw error;
    } finally {
      setIsRunning(false);
    }
  };

  const runTestsMutation = useMutation({
    mutationFn: runAllTests,
    onError: (error: Error) => {
      console.error('Mutation error:', error);
      setTestLogs(prev => [
        ...prev, 
        `❌ Error: ${error.message}`,
        '⚠️ Check console for detailed error information'
      ]);
      setProgress(0);
      setCurrentTest('Test run failed');
      toast.error(`Failed to run system checks: ${error.message}`);
    }
  });

  useQuery({
    queryKey: ['test-logs'],
    queryFn: async () => {
      const channel = supabase
        .channel('test-logs')
        .on('broadcast', { event: 'test-log' }, ({ payload }) => {
          if (payload?.message) {
            setTestLogs(prev => [...prev, `📝 ${payload.message}`]);
          }
          if (payload?.progress) {
            setProgress(payload.progress);
          }
          if (payload?.currentTest) {
            setCurrentTest(payload.currentTest);
          }
        })
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    },
    enabled: isRunning
  });

  return {
    testLogs,
    isRunning,
    progress,
    currentTest,
    testResults,
    runTestsMutation
  };
};