import React, { useState } from 'react'

export default function WalletDisplay({ wallet, loadingBalance }) {
    const [copied, setCopied] = useState(false)

    if (!wallet) {
        return (
            <div style={{ padding: '2rem 0', color: 'var(--text-muted)' }}>
                No wallet connected. Create one to get started.
            </div>
        )
    }

    const copyAddress = () => {
        navigator.clipboard.writeText(wallet.address)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // Shorten address logic
    const shortAddress = `${wallet.address.substring(0, 6)}...${wallet.address.substring(wallet.address.length - 4)}`

    return (
        <div className="anim-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Balances Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* XRP Balance Card */}
                <div className="glass" style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1.25rem', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        XRP Balance
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {loadingBalance ? (
                            <span className="anim-pulse" style={{ opacity: 0.5 }}>---</span>
                        ) : (
                            <span>{wallet.balance} <span style={{ fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 'normal' }}>XRP</span></span>
                        )}
                    </div>
                </div>

                {/* USDC Balance Card */}
                <div className="glass" style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '1.25rem', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        USDC Balance
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {loadingBalance ? (
                            <span className="anim-pulse" style={{ opacity: 0.5 }}>---</span>
                        ) : (
                            <span>{wallet.usdcBalance || '0'} <span style={{ fontSize: '0.875rem', color: '#22c55e', fontWeight: 'normal' }}>USDC</span></span>
                        )}
                    </div>
                </div>
            </div>

            {/* Address Card */}
            <div className="glass" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Address</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '1rem' }} title={wallet.address}>
                        {shortAddress}
                    </span>
                </div>

                <button
                    onClick={copyAddress}
                    className="btn btn-secondary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                >
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>

            {/* Private Key Card */}
            <PrivateKeyDisplay wallet={wallet} />

        </div>
    )
}

function PrivateKeyDisplay({ wallet }) {
    const [showKey, setShowKey] = useState(false)
    const [copied, setCopied] = useState(false)

    const copyKey = () => {
        navigator.clipboard.writeText(wallet.seed || wallet.privateKey)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // Determine what to show (seed or private key preferred if available)
    const secret = wallet.seed || wallet.privateKey || 'Unknown'

    return (
        <div className="glass" style={{ padding: '1rem', border: '1px solid rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showKey ? '0.5rem' : '0' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'bold' }}>
                        Private Key / Seed
                    </span>
                    {!showKey && (
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            ••••••••••••••••••••••••••••••
                        </span>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={() => setShowKey(!showKey)}
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                    >
                        {showKey ? 'Hide' : 'Show'}
                    </button>
                    {showKey && (
                        <button
                            onClick={copyKey}
                            className="btn btn-secondary"
                            style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                        >
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    )}
                </div>
            </div>

            {showKey && (
                <div className="anim-fade-in" style={{
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    wordBreak: 'break-all',
                    background: 'rgba(0,0,0,0.2)',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    color: '#fca5a5'
                }}>
                    {secret}
                </div>
            )}
        </div>
    )
}
