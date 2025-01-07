import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';

export type UserRole = 'member' | 'collector' | 'admin' | null;

const ROLE_STALE_TIME = 1000 * 60; // 1 minute

export const useRoleAccess = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: userRole, isLoading: roleLoading, error: roleError } = useQuery({
    queryKey: ['userRole'],
    queryFn: async () => {
      try {
        console.log('Fetching user role...');
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.log('No authenticated user found');
          return null;
        }

        console.log('Session user in central role check:', user.id);
        console.log('User metadata:', user.user_metadata);

        // First check user_roles table for the highest priority role
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .order('role', { ascending: false });

        if (roleError) {
          console.error('Error fetching roles:', roleError);
          throw roleError;
        }

        if (roleData && roleData.length > 0) {
          console.log('Found roles in user_roles table:', roleData);
          // Return highest priority role (admin > collector > member)
          if (roleData.some(r => r.role === 'admin')) return 'admin';
          if (roleData.some(r => r.role === 'collector')) return 'collector';
          if (roleData.some(r => r.role === 'member')) return 'member';
        }

        // Fallback to checking collector status
        if (user.user_metadata.member_number) {
          const { data: collectorData } = await supabase
            .from('members_collectors')
            .select('name')
            .eq('member_number', user.user_metadata.member_number)
            .maybeSingle();

          if (collectorData) {
            console.log('User is a collector');
            return 'collector';
          }
        }

        // Final fallback - check if user exists in members table
        const { data: memberData } = await supabase
          .from('members')
          .select('id')
          .eq('auth_user_id', user.id)
          .maybeSingle();

        if (memberData?.id) {
          console.log('User is a regular member');
          return 'member';
        }

        console.log('No specific role found, defaulting to member');
        return 'member';
      } catch (error) {
        console.error('Error in role check:', error);
        throw error;
      }
    },
    staleTime: ROLE_STALE_TIME,
    retry: 1,
  });

  const canAccessTab = (tab: string): boolean => {
    console.log('Checking access for tab:', tab, 'User role:', userRole);
    
    if (!userRole) return false;

    switch (userRole) {
      case 'admin':
        return ['dashboard', 'users', 'collectors', 'audit', 'system', 'financials'].includes(tab);
      case 'collector':
        return ['dashboard', 'users'].includes(tab);
      case 'member':
        return tab === 'dashboard';
      default:
        return false;
    }
  };

  return {
    userRole,
    roleLoading,
    error: roleError,
    canAccessTab,
  };
};