import React, { useState } from 'react'
import { Client, Wallet } from 'xrpl'
import { USDC_TESTNET, XRPL_NODE } from '../constants'

export default function SendTokenForm({ wallet, refreshBalance }) {
    const [recipient, setRecipient] = useState('')
    const [amount, setAmount] = useState('')
    const [sending, setSending] = useState(false)
    const [error, setError] = useState('')
    const [status, setStatus] = useState('')

    const handleSend = async (e) => {
        e.preventDefault()
        if (!recipient || !amount) {
            setError('Please fill in all fields.')
            return
        }

        if (isNaN(amount) || parseFloat(amount) <= 0) {
            setError('Please enter a valid amount.')
            return
        }

        if (parseFloat(amount) > parseFloat(wallet.usdcBalance)) {
            setError('Insufficient USDC balance.')
            return
        }

        try {
            setSending(true)
            setError('')
            setStatus('Connecting to XRPL...')

            const client = new Client(XRPL_NODE)
            await client.connect()

            setStatus('Preparing transaction...')
            const currentWallet = Wallet.fromSeed(wallet.seed)

            const paymentTx = {
                TransactionType: "Payment",
                Account: currentWallet.address,
                Destination: recipient.trim(),
                Amount: {
                    currency: USDC_TESTNET.currency,
                    issuer: USDC_TESTNET.issuer,
                    value: amount.toString()
                }
            }

            const prepared = await client.autofill(paymentTx)
            const signed = currentWallet.sign(prepared)

            setStatus('Sending USDC...')
            const result = await client.submitAndWait(signed.tx_blob)

            if (result.result.meta.TransactionResult === 'tesSUCCESS') {
                setStatus('USDC Sent successfully!')
                setRecipient('')
                setAmount('')
                // Refresh balance after success
                await refreshBalance()
            } else {
                throw new Error(result.result.meta.TransactionResult)
            }

            await client.disconnect()
        } catch (err) {
            console.error(err)
            setError(err.message || 'Failed to send USDC. Ensure recipient has a trust line.')
            setStatus('')
        } finally {
            setSending(false)
        }
    }

    return (
        <div className="glass" style={{ padding: '1.5rem', marginTop: '1rem', border: '1px solid var(--glass-border)' }}>
            <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', color: 'var(--text)' }}>Send USDC</h3>

            <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Recipient Address</label>
                    <input
                        type="text"
                        placeholder="r..."
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        disabled={sending}
                        className="glass"
                        style={{
                            padding: '0.75rem',
                            color: 'white',
                            background: 'rgba(0,0,0,0.2)',
                            border: '1px solid var(--glass-border)',
                            outline: 'none'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Amount (USDC)</label>
                    <input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        disabled={sending}
                        className="glass"
                        style={{
                            padding: '0.75rem',
                            color: 'white',
                            background: 'rgba(0,0,0,0.2)',
                            border: '1px solid var(--glass-border)',
                            outline: 'none'
                        }}
                    />
                </div>

                {error && <p style={{ color: '#ef4444', fontSize: '0.875rem' }}>{error}</p>}
                {status && <p style={{ color: 'var(--primary)', fontSize: '0.875rem' }}>{status}</p>}

                <button
                    type="submit"
                    disabled={sending || !recipient || !amount}
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '0.5rem' }}
                >
                    {sending ? 'Sending...' : 'Send USDC'}
                </button>
            </form>
        </div>
    )
}
