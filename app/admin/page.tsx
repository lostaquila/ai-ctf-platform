import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import AdminDashboardClient from './AdminDashboardClient';

export default async function AdminPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    if (!user.email || !adminEmails.includes(user.email)) {
        redirect('/');
    }

    return <AdminDashboardClient />;
}
