import { cache } from 'react';
import { createClient } from '@/utils/supabase/server';

export const getUserProfile = cache(async () => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*, teams(*)')
        .eq('id', user.id)
        .maybeSingle();

    if (error) {
        console.error('Full Error fetching profile:', JSON.stringify(error, null, 2));
        if (error.code) console.error('Error Code:', error.code);
        if (error.message) console.error('Error Message:', error.message);
        return null;
    }

    // Zombie Session Detection
    // User is authenticated (auth.users) but has no profile (public.profiles)
    // This happens after a DB reset.
    if (!profile) {
        console.warn(`Zombie session detected for user ${user.id}. Signing out.`);
        await supabase.auth.signOut();
        return null;
    }

    return profile;
});
