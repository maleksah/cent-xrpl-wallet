import { useState, useEffect } from 'react'
import WalletManager from './components/WalletManager'
import WalletDisplay from './components/WalletDisplay'
import { Client } from 'xrpl'
import { XRPL_NODE } from './constants'
import { fetchBalances } from './utils/xrpl'

function App() {
  // Wallet object: { address, seed, balance, usdcBalance... }
  const [wallet, setWallet] = useState(() => {
    const saved = localStorage.getItem('xrpl_wallet')
    return saved ? JSON.parse(saved) : null
  })

  // Balance loading state separate from wallet creation to handle independent funding
  const [loadingBalance, setLoadingBalance] = useState(false)

  // Sync wallet to localStorage
  useEffect(() => {
    if (wallet) {
      localStorage.setItem('xrpl_wallet', JSON.stringify(wallet))
    } else {
      localStorage.removeItem('xrpl_wallet')
    }
  }, [wallet])

  // Refresh balance on mount
  useEffect(() => {
    const refreshData = async () => {
      if (wallet && wallet.address) {
        setLoadingBalance(true)
        try {
          const client = new Client(XRPL_NODE)
          await client.connect()
          const balances = await fetchBalances(client, wallet.address)
          setWallet(prev => ({
            ...prev,
            balance: balances.xrp,
            usdcBalance: balances.usdc
          }))
          await client.disconnect()
        } catch (err) {
          console.error('Failed to refresh balance on mount:', err)
        } finally {
          setLoadingBalance(false)
        }
      }
    }

    refreshData()
    // We only want to run this once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="container anim-fade-in">
      <h1 className="title">
        XRPL <span className="text-gradient">Wallet</span>
      </h1>

      <div className="glass" style={{ padding: '2rem' }}>
        <WalletDisplay
          wallet={wallet}
          loadingBalance={loadingBalance}
        />

        <WalletManager
          wallet={wallet}
          setWallet={setWallet}
          setLoadingBalance={setLoadingBalance}
        />
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        Connected to XRPL Testnet
      </p>
    </div>
  )
}

export default App
