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

            {/* Balance Card */}
            <div className="glass" style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1.5rem', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    Current Balance
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
                    {loadingBalance ? (
                        <span className="anim-pulse" style={{ opacity: 0.5 }}>---</span>
                    ) : (
                        <span>{wallet.balance} <span style={{ fontSize: '1rem', color: 'var(--primary)' }}>XRP</span></span>
                    )}
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

        </div>
    )
}
