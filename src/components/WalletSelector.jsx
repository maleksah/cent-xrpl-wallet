import React, { useState, useRef, useEffect } from 'react'

export default function WalletSelector({ wallets, activeAddress, onSelect, onDelete }) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef(null)

    const activeWallet = wallets.find(w => w.address === activeAddress)

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    if (wallets.length === 0) return null

    return (
        <div style={{ position: 'relative', marginBottom: '1.5rem', width: '100%', zIndex: 100 }} ref={dropdownRef}>
            {/* Trigger Button */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--glass-border)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                }}
                className="wallet-trigger-hover"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Active Wallet
                    </span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                        {activeWallet ? `${activeWallet.address.substring(0, 8)}...${activeWallet.address.substring(activeWallet.address.length - 8)} ` : 'Select a wallet'}
                    </span>
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>
                    {isOpen ? '▲' : '▼'}
                </div>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="glass anim-slide-up" style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '0.5rem',
                    padding: '0.5rem',
                    background: 'rgba(30, 41, 59, 0.98)', // Darker, more solid background
                    backdropFilter: 'blur(16px)',
                    border: '2px solid var(--primary)', // Stronger border
                    borderRadius: '12px',
                    boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.5)',
                    maxHeight: '400px',
                    overflowY: 'auto'
                }}>
                    {wallets.length === 0 && (
                        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            No wallets saved.
                        </div>
                    )}

                    {wallets.map((w) => (
                        <div
                            key={w.address}
                            onClick={() => {
                                onSelect(w.address)
                                setIsOpen(false)
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '1rem',
                                borderRadius: '8px',
                                background: w.address === activeAddress ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                marginBottom: '0.5rem',
                                border: w.address === activeAddress ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid transparent'
                            }}
                            className="wallet-item-hover"
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{
                                    fontSize: '0.9rem',
                                    fontWeight: w.address === activeAddress ? 'bold' : 'normal',
                                    color: w.address === activeAddress ? 'var(--primary)' : 'white'
                                }}>
                                    {w.address.substring(0, 10)}...{w.address.substring(w.address.length - 10)}
                                </div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.8, color: 'var(--text-muted)' }}>
                                    {w.balance || '0'} XRP · {w.usdcBalance || '0'} USDC
                                </div>
                            </div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm('Delete this wallet from your local storage?')) {
                                        onDelete(w.address);
                                    }
                                }}
                                className="btn-icon"
                                style={{
                                    padding: '0.5rem 0.75rem',
                                    fontSize: '0.75rem',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: '6px',
                                    color: '#f87171',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    transition: 'all 0.2s'
                                }}
                                title="Delete Wallet"
                            >
                                🗑️ <span style={{ fontWeight: 'bold' }}>Delete</span>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
