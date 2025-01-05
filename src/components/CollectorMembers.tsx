import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Member } from "@/types/member";
import { Loader2 } from "lucide-react";
import { useAuthSession } from "@/hooks/useAuthSession";

const CollectorMembers = ({ collectorName }: { collectorName: string }) => {
  const { session } = useAuthSession();

  // Log authentication and role information for debugging
  useEffect(() => {
    const checkAuth = async () => {
      console.log('Checking authentication and roles...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('Current auth user:', user);
      
      if (authError) {
        console.error('Auth error:', authError);
        return;
      }
      
      if (user) {
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);
          
        if (rolesError) {
          console.error('Error fetching roles:', rolesError);
          return;
        }
        
        console.log('User roles:', roles);
      }
    };
    
    checkAuth();
  }, []);

  const { data: members, isLoading, error } = useQuery({
    queryKey: ['collectorMembers', collectorName],
    queryFn: async () => {
      console.log('Starting member fetch for collector:', collectorName);
      
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('collector', collectorName);

      if (error) {
        console.error('Error fetching members:', error);
        throw error;
      }

      console.log('Members data fetched:', data);
      return data as Member[];
    },
    enabled: !!collectorName && !!session,
  });

  if (!session) {
    console.log('No active session, skipping member fetch');
    return null;
  }

  if (isLoading) {
    console.log('Component in loading state');
    return (
      <div className="flex justify-center items-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-dashboard-accent1" />
      </div>
    );
  }

  if (error) {
    console.error('Component in error state:', error);
    return (
      <div className="p-4 text-red-500">
        Error loading members: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  if (!members || members.length === 0) {
    console.log('No members found for collector:', collectorName);
    return (
      <div className="p-4 text-dashboard-muted">
        No members found for collector: {collectorName}
      </div>
    );
  }

  console.log('Rendering member list with count:', members.length);
  
  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {members.map((member) => (
          <li 
            key={member.id}
            className="bg-dashboard-card hover:bg-dashboard-card/80 p-4 rounded-lg border border-white/10 transition-colors duration-200"
          >
            <div>
              <p className="font-medium text-white">{member.full_name}</p>
              <p className="text-sm text-dashboard-text">
                Member #: {member.member_number}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CollectorMembers;
