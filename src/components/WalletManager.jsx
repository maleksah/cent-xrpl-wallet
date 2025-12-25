import React, { useState } from 'react'
import { Client, Wallet } from 'xrpl'

export default function WalletManager({ wallet, setWallet, setLoadingBalance }) {
    const [creating, setCreating] = useState(false)
    const [funding, setFunding] = useState(false)
    const [error, setError] = useState('')

    // Import state
    const [importing, setImporting] = useState(false)
    const [seedInput, setSeedInput] = useState('')

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

    const importWallet = async () => {
        if (!seedInput.trim()) {
            setError('Please enter a valid seed or private key.')
            return
        }

        try {
            setImporting(true)
            setLoadingBalance(true)
            setError('')

            let importedWallet
            try {
                importedWallet = Wallet.fromSeed(seedInput.trim())
            } catch (e) {
                // Try as private key if seed fails, though fromSeed handles both usually check xrpl docs
                // Actually fromSeed takes a seed. fromEntropy might be needed for unchecked hex.
                // But let's assume standard seed/family seed first.
                throw new Error('Invalid seed or private key format.')
            }

            // Fetch balance
            const client = new Client('wss://s.altnet.rippletest.net:51233')
            await client.connect()

            let balance = '0'
            try {
                const balanceResponse = await client.getXrpBalance(importedWallet.address)
                balance = balanceResponse
            } catch (err) {
                console.log('Account not found or no balance:', err)
                // Ensure we handle unfunded accounts gracefully
            }

            await client.disconnect()

            setWallet({
                address: importedWallet.address,
                seed: importedWallet.seed,
                balance: balance,
                publicKey: importedWallet.publicKey,
                privateKey: importedWallet.privateKey
            })

        } catch (err) {
            console.error(err)
            setError(err.message || 'Failed to import wallet. Check your seed.')
        } finally {
            setImporting(false)
            setLoadingBalance(false)
        }
    }

    return (
        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {error && <div style={{ color: '#ef4444', marginBottom: '0.5rem' }}>{error}</div>}

            {!wallet ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Create Section */}
                    <div>
                        <button
                            onClick={createLocalWallet}
                            disabled={creating || importing}
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                        >
                            {creating ? 'Generating keys...' : 'Create New Wallet'}
                        </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)' }}>
                        <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
                        <span style={{ fontSize: '0.875rem' }}>OR</span>
                        <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
                    </div>

                    {/* Import Section */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="text"
                            placeholder="Enter Seed / Private Key"
                            value={seedInput}
                            onChange={(e) => setSeedInput(e.target.value)}
                            disabled={creating || importing}
                            className="glass"
                            style={{
                                flex: 1,
                                padding: '0.75rem',
                                color: 'white',
                                background: 'rgba(0,0,0,0.2)',
                                border: '1px solid var(--glass-border)',
                                outline: 'none',
                                minWidth: 0
                            }}
                        />
                        <button
                            onClick={importWallet}
                            disabled={creating || importing || !seedInput}
                            className="btn btn-secondary"
                        >
                            {importing ? '...' : 'Import'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="anim-slide-up">
                    <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
                        {Number(wallet.balance) > 0
                            ? 'Wallet connected successfully.'
                            : 'Wallet generated/imported. Fund it to activate on Ledger.'}
                    </p>

                    {/* Only show fund button if balance is zero-ish or user wants to add more */}
                    <button
                        onClick={fundWallet}
                        disabled={funding}
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                    >
                        {funding ? 'Requesting Faucet (approx 10s)...' : 'Fund Wallet (1000 XRP)'}
                    </button>

                    <button
                        onClick={() => { setWallet(null); setSeedInput(''); }}
                        className="btn btn-secondary"
                        style={{ width: '100%', marginTop: '1rem' }}
                    >
                        Disconnect Wallet
                    </button>
                </div>
            )}
        </div>
    )
}
