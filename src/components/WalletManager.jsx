import React, { useState } from 'react'
import { Client, Wallet } from 'xrpl'
import { USDC_TESTNET, XRPL_NODE } from '../constants'
import { fetchBalances } from '../utils/xrpl'
import SendTokenForm from './SendTokenForm'

export default function WalletManager({ wallet, addWallet, setLoadingBalance, refreshBalance, hasWallets, onViewHistory }) {
    const [creating, setCreating] = useState(false)
    const [funding, setFunding] = useState(false)
    const [error, setError] = useState('')
    const [statusMessage, setStatusMessage] = useState('')
    const [showSend, setShowSend] = useState(false)
    const [showAddForm, setShowAddForm] = useState(false)

    // Import state
    const [importing, setImporting] = useState(false)
    const [seedInput, setSeedInput] = useState('')

    const createLocalWallet = () => {
        try {
            setCreating(true)
            setError('')
            const newWallet = Wallet.generate()
            // Initialize with 0 balance
            addWallet({
                address: newWallet.address,
                seed: newWallet.seed,
                balance: '0',
                usdcBalance: '0',
                publicKey: newWallet.publicKey,
                privateKey: newWallet.privateKey
            })
            setShowAddForm(false)
            setSeedInput('')
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
            setStatusMessage('Connecting to XRPL Testnet...')

            const client = new Client(XRPL_NODE)
            await client.connect()

            setStatusMessage('Requesting XRP from Faucet (approx 10s)...')
            // Create a wallet instance from current seed to ensure we have the object
            const currentWallet = Wallet.fromSeed(wallet.seed)

            // Use the faucet to fund the wallet
            await client.fundWallet(currentWallet)

            setStatusMessage('Checking for USDC Trust Line...')
            // Check if trust line exists
            const response = await client.request({
                command: 'account_lines',
                account: currentWallet.address
            })

            const lines = response.result.lines
            const hasTrustLine = lines.some(line =>
                line.currency === USDC_TESTNET.currency &&
                line.account === USDC_TESTNET.issuer
            )

            if (!hasTrustLine) {
                setStatusMessage('Establishing USDC Trust Line...')
                const trustSetTx = {
                    TransactionType: "TrustSet",
                    Account: currentWallet.address,
                    LimitAmount: {
                        currency: USDC_TESTNET.currency,
                        issuer: USDC_TESTNET.issuer,
                        value: "1000000000" // Large limit
                    }
                }
                const prepared = await client.autofill(trustSetTx)
                const signed = currentWallet.sign(prepared)
                await client.submitAndWait(signed.tx_blob)
                setStatusMessage('Trust line established!')
            }

            // Fetch all balances after funding and trust line
            const balances = await fetchBalances(client, currentWallet.address)

            // We don't need to manually update balance here as refreshBalance will be triggered 
            // by the parent if we update the wallets array or we can just call refreshBalance
            await refreshBalance()

            await client.disconnect()
            setStatusMessage('')
        } catch (err) {
            console.error(err)
            setError('Failed to fund wallet or create trust line.')
            setStatusMessage('')
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

            // Fetch balances
            const client = new Client(XRPL_NODE)
            await client.connect()

            const balances = await fetchBalances(client, importedWallet.address)

            await client.disconnect()

            addWallet({
                address: importedWallet.address,
                seed: importedWallet.seed,
                balance: balances.xrp,
                usdcBalance: balances.usdc,
                publicKey: importedWallet.publicKey,
                privateKey: importedWallet.privateKey
            })
            setShowAddForm(false)
            setSeedInput('')

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

            {!showAddForm && hasWallets && (
                <button
                    onClick={() => setShowAddForm(true)}
                    className="btn btn-secondary"
                    style={{ width: '100%', marginBottom: '1rem' }}
                >
                    + Add or Import Another Wallet
                </button>
            )}

            {(showAddForm || !hasWallets) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, fontSize: '1rem' }}>Add New Wallet</h3>
                        {hasWallets && (
                            <button onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
                        )}
                    </div>

                    {/* Create Section */}
                    <button
                        onClick={createLocalWallet}
                        disabled={creating || importing}
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                    >
                        {creating ? 'Generating keys...' : 'Create New Wallet'}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)' }}>
                        <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
                        <span style={{ fontSize: '0.75rem' }}>OR IMPORT</span>
                        <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
                    </div>

                    {/* Import Section */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="text"
                            placeholder="Seed / Private Key"
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
                                minWidth: 0,
                                fontSize: '0.875rem'
                            }}
                        />
                        <button
                            onClick={importWallet}
                            disabled={creating || importing || !seedInput}
                            className="btn btn-secondary"
                            style={{ padding: '0.5rem 1rem' }}
                        >
                            {importing ? '...' : 'Import'}
                        </button>
                    </div>
                </div>
            )}

            {wallet && !showAddForm && (
                <div className="anim-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Fund Button */}
                    <button
                        onClick={fundWallet}
                        disabled={funding}
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                    >
                        {funding ? (statusMessage || 'Processing...') : 'Fund Active Wallet'}
                    </button>

                    {statusMessage && !error && (
                        <p style={{
                            fontSize: '0.875rem',
                            color: 'var(--primary)',
                            marginTop: '-0.5rem',
                            textAlign: 'center',
                            opacity: 0.8
                        }}>
                            {statusMessage}
                        </p>
                    )}

                    {/* Send USDC Toggle */}
                    <button
                        onClick={() => setShowSend(!showSend)}
                        className="btn btn-secondary"
                        style={{ width: '100%', padding: '0.75rem' }}
                    >
                        {showSend ? 'Cancel Transfer' : 'Send USDC'}
                    </button>

                    {/* View History Button */}
                    <button
                        onClick={onViewHistory}
                        className="btn btn-secondary"
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem' }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        View Transaction History
                    </button>

                    {showSend && (
                        <div className="anim-slide-up">
                            <SendTokenForm
                                wallet={wallet}
                                refreshBalance={refreshBalance}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
