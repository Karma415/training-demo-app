import { supabase } from '../../services/supabase';

export const expireIssuesForTestTenant = async () => {
  try {
    const targetEmails = ['test_tenant@example.com', 'test_tenant2@example.com'];

    const { data: profileData, error: profileError } = await supabase
      .from('tenants')
      .select('id')
      .in('email', targetEmails);

    if (profileError || !profileData || profileData.length === 0) {
      console.error('Could not find test tenant IDs:', profileError);
      return;
    }

    const testTenantIds = profileData.map(p => p.id);
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();

    const { error: updateError } = await supabase
      .from('issues')
      .update({ created_at: tenDaysAgo })
      .in('tenant_id', testTenantIds);

    if (updateError) {
      console.error('Error expiring issues:', updateError);
    } else {
      console.log('Test issues successfully expired for both users');
    }
  } catch (err) {
    console.error('Exception in expireIssuesForTestTenant:', err);
  }
};
