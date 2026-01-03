import React from 'react'
import { EXPLORER_URL } from '../constants'

export default function TransactionModal({ isOpen, onClose, transactions, loading, address }) {
    if (!isOpen) return null

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container glass anim-slide-up" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 style={{ margin: 0 }}>Transaction History</h2>
                    <button className="btn-close" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <div className="anim-pulse" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Fetching transactions...</div>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                            No transactions found for this wallet.
                        </div>
                    ) : (
                        <div className="transaction-list">
                            {transactions.map((tx, idx) => (
                                <div key={tx.hash || idx} className="transaction-item">
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ fontWeight: 'bold', color: tx.sender === address ? '#f87171' : '#4ade80' }}>
                                                {tx.sender === address ? 'Sent' : 'Received'} {tx.type}
                                            </div>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 'bold', color: tx.result === 'tesSUCCESS' ? '#4ade80' : '#f87171' }}>
                                                {tx.result === 'tesSUCCESS' ? 'SUCCESS' : tx.result}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            {tx.amount !== null && (
                                                <div style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>
                                                    {tx.sender === address ? '-' : '+'}{tx.amount} <span style={{ fontSize: '0.875rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>{tx.currency}</span>
                                                </div>
                                            )}

                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {tx.date}
                                            </div>

                                            <div style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: 'var(--text-muted)', wordBreak: 'break-all', marginTop: '0.25rem' }}>
                                                <a
                                                    href={`${EXPLORER_URL}${tx.hash}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ color: 'inherit', textDecoration: 'underline', opacity: 0.7 }}
                                                    title="View on Explorer"
                                                >
                                                    {tx.hash}
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose} style={{ width: '100%' }}>Close</button>
                </div>
            </div>
        </div>
    )
}
