export async function fetchWallet() {
  const { data: wallet, error } = await supabase
    .from('wallets')
    .select('id, user_id, real_balance, bonus_balance, currency, created_at, updated_at')
    .eq('user_id', supabase.auth.user()?.id)
    .single();

  if (error) throw error;
  return wallet;
}

export async function fetchTransactions() {
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', supabase.auth.user()?.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return transactions;
}
