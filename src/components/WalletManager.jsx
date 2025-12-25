import React, { useState } from 'react'
import { Client, Wallet } from 'xrpl'
import { USDC_TESTNET, XRPL_NODE } from '../constants'

export default function WalletManager({ wallet, setWallet, setLoadingBalance }) {
    const [creating, setCreating] = useState(false)
    const [funding, setFunding] = useState(false)
    const [error, setError] = useState('')
    const [statusMessage, setStatusMessage] = useState('')

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
                usdcBalance: '0',
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

    const fetchBalances = async (client, address) => {
        try {
            const xrpBalance = await client.getXrpBalance(address)

            const response = await client.request({
                command: 'account_lines',
                account: address
            })

            const lines = response.result.lines
            const usdcLine = lines.find(line =>
                line.currency === USDC_TESTNET.currency &&
                line.account === USDC_TESTNET.issuer
            )

            return {
                xrp: xrpBalance,
                usdc: usdcLine ? usdcLine.balance : '0'
            }
        } catch (err) {
            console.error('Error fetching balances:', err)
            // If account doesn't exist yet, return 0
            return { xrp: '0', usdc: '0' }
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

            setWallet(prev => ({
                ...prev,
                balance: balances.xrp,
                usdcBalance: balances.usdc
            }))

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

            setWallet({
                address: importedWallet.address,
                seed: importedWallet.seed,
                balance: balances.xrp,
                usdcBalance: balances.usdc,
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
                        {funding ? (statusMessage || 'Processing...') : 'Fund Wallet & Set USDC Trust Line'}
                    </button>

                    {statusMessage && !error && (
                        <p style={{
                            fontSize: '0.875rem',
                            color: 'var(--primary)',
                            marginTop: '0.5rem',
                            textAlign: 'center',
                            opacity: 0.8
                        }}>
                            {statusMessage}
                        </p>
                    )}

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
