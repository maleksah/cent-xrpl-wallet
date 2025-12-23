import React, { useState } from 'react'
import { Client, Wallet } from 'xrpl'

export default function WalletManager({ wallet, setWallet, setLoadingBalance }) {
    const [creating, setCreating] = useState(false)
    const [funding, setFunding] = useState(false)
    const [error, setError] = useState('')

    const createLocalWallet = () => {
        try {
            setCreating(true)
            setError('')
            const newWallet = Wallet.generate()
            // Initialize with 0 balance
            setWallet({
                address: newWallet.address,
                seed: newWallet.seed,
                balance: '0',
                publicKey: newWallet.publicKey,
                privateKey: newWallet.privateKey
            })
        } catch (err) {
            console.error(err)
            setError('Failed to generate wallet locally.')
        } finally {
            setCreating(false)
        }
    }

    const fundWallet = async () => {
        if (!wallet) return

        try {
            setFunding(true)
            setLoadingBalance(true)
            setError('')

            const client = new Client('wss://s.altnet.rippletest.net:51233')
            await client.connect()

            // Create a wallet instance from current seed to ensure we have the object
            const currentWallet = Wallet.fromSeed(wallet.seed)

            // Use the faucet to fund the wallet
            // fundWallet returns { balance, wallet }
            const fundResult = await client.fundWallet(currentWallet)

            setWallet(prev => ({
                ...prev,
                balance: fundResult.balance
            }))

            await client.disconnect()
        } catch (err) {
            console.error(err)
            setError('Failed to fund wallet (Faucet might be busy).')
        } finally {
            setFunding(false)
            setLoadingBalance(false)
        }
    }

    return (
        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {error && <div style={{ color: '#ef4444', marginBottom: '0.5rem' }}>{error}</div>}

            {!wallet ? (
                <button
                    onClick={createLocalWallet}
                    disabled={creating}
                    className="btn btn-primary"
                >
                    {creating ? 'Generating keys...' : 'Create New Wallet'}
                </button>
            ) : (
                <div className="anim-slide-up">
                    <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
                        Wallet generated. Fund it to activate on Ledger.
                    </p>
                    <button
                        onClick={fundWallet}
                        disabled={funding}
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                    >
                        {funding ? 'Requesting Faucet (approx 10s)...' : 'Fund Wallet (1000 XRP)'}
                    </button>
                </div>
            )}
        </div>
    )
}
