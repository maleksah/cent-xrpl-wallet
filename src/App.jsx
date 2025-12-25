import { useState, useEffect } from 'react'
import WalletManager from './components/WalletManager'
import WalletDisplay from './components/WalletDisplay'
import { Client } from 'xrpl'
import { XRPL_NODE } from './constants'
import { fetchBalances } from './utils/xrpl'
import centLogo from './assets/cent_logo_white.png'

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

  const refreshBalance = async () => {
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
        console.error('Failed to refresh balance:', err)
      } finally {
        setLoadingBalance(false)
      }
    }
  }

  // Refresh balance on mount
  useEffect(() => {
    refreshBalance()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="container anim-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <img src={centLogo} alt="Cent Logo" style={{ height: '90px', width: 'auto' }} />
        <h1 className="title" style={{ margin: 0 }}>
          XRPL <span className="text-gradient">Wallet</span>
        </h1>
      </div>

      <div className="glass" style={{ padding: '2rem', width: '100%', maxWidth: '500px' }}>
        <WalletDisplay
          wallet={wallet}
          loadingBalance={loadingBalance}
          refreshBalance={refreshBalance}
        />

        <WalletManager
          wallet={wallet}
          setWallet={setWallet}
          setLoadingBalance={setLoadingBalance}
          refreshBalance={refreshBalance}
        />
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        Connected to XRPL Testnet
      </p>
    </div >
  )
}

export default App
