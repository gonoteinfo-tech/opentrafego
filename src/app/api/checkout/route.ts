import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 1. Create Transaction (creates pending transaction and generates fake Pix payment details)
export async function POST(request: Request) {
  try {
    const { user_id, amount, credits_added } = await request.json();

    if (!user_id || !amount || !credits_added) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Insert pending transaction
    const { data: transaction, error } = await supabase
      .from('mt_transactions')
      .insert({
        user_id,
        amount,
        credits_added,
        status: 'pending',
        payment_method: 'pix'
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Generate simulated Pix Copia e Cola and dynamic details
    const pixKey = 'pix@opentrafego.com.br';
    const txId = transaction.id;
    // Simulated BRCode payload standard for testing
    const qrCodePayload = `00020101021226810014br.gov.bcb.pix2559pix.opentrafego.com.br/qr/${txId}5204000053039865405${amount.toFixed(2)}5802BR5911OPENTRAFEGO6009SAO PAULO62070503***6304`;

    return NextResponse.json({
      success: true,
      transaction,
      pix_key: pixKey,
      copia_e_cola: qrCodePayload
    });

  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

// 2. Confirm Payment (simulates webhooks/instant bank notifications)
export async function PUT(request: Request) {
  try {
    const { transaction_id } = await request.json();

    if (!transaction_id) {
      return NextResponse.json({ error: 'Missing transaction_id' }, { status: 400 });
    }

    // Get current transaction status
    const { data: tx, error: txErr } = await supabase
      .from('mt_transactions')
      .select('*')
      .eq('id', transaction_id)
      .single();

    if (txErr || !tx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (tx.status === 'approved') {
      return NextResponse.json({ success: true, message: 'Payment already approved.' });
    }

    // Update transaction to approved
    const { error: updateTxErr } = await supabase
      .from('mt_transactions')
      .update({ status: 'approved' })
      .eq('id', transaction_id);

    if (updateTxErr) {
      return NextResponse.json({ error: updateTxErr.message }, { status: 500 });
    }

    // Fetch user profile credits to update
    const { data: profile, error: profileErr } = await supabase
      .from('mt_profiles')
      .select('credits')
      .eq('id', tx.user_id)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Update credits in mt_profiles
    const newCredits = profile.credits + tx.credits_added;
    const { error: updateProfileErr } = await supabase
      .from('mt_profiles')
      .update({ credits: newCredits })
      .eq('id', tx.user_id);

    if (updateProfileErr) {
      return NextResponse.json({ error: updateProfileErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Payment approved. Credits added.',
      credits_added: tx.credits_added,
      total_credits: newCredits
    });

  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}


