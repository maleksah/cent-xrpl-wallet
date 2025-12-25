import { useState, useEffect } from 'react'
import WalletManager from './components/WalletManager'
import WalletDisplay from './components/WalletDisplay'
import WalletSelector from './components/WalletSelector'
import { Client } from 'xrpl'
import { XRPL_NODE } from './constants'
import { fetchBalances } from './utils/xrpl'
import centLogo from './assets/cent_logo_white.png'

function App() {
  // Mult-wallet state
  const [wallets, setWallets] = useState(() => {
    const saved = localStorage.getItem('xrpl_wallets')
    if (saved) return JSON.parse(saved)

    // Migration from single wallet
    const legacy = localStorage.getItem('xrpl_wallet')
    if (legacy) {
      const legacyWallet = JSON.parse(legacy)
      // Cleanup legacy
      localStorage.removeItem('xrpl_wallet')
      return [legacyWallet]
    }
    return []
  })

  const [activeAddress, setActiveAddress] = useState(() => {
    const saved = localStorage.getItem('xrpl_active_address')
    if (saved) return saved
    return wallets.length > 0 ? wallets[0].address : null
  })

  // Balance loading state separate from wallet creation to handle independent funding
  const [loadingBalance, setLoadingBalance] = useState(false)

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('xrpl_wallets', JSON.stringify(wallets))
  }, [wallets])

  useEffect(() => {
    if (activeAddress) {
      localStorage.setItem('xrpl_active_address', activeAddress)
    } else {
      localStorage.removeItem('xrpl_active_address')
    }
  }, [activeAddress])

  // Handlers
  const addWallet = (newWallet) => {
    // Check if duplicate
    if (wallets.some(w => w.address === newWallet.address)) {
      setActiveAddress(newWallet.address)
      return
    }
    setWallets(prev => [...prev, newWallet])
    setActiveAddress(newWallet.address)
  }

  const deleteWallet = (address) => {
    const updatedWallets = wallets.filter(w => w.address !== address)
    setWallets(updatedWallets)
    if (activeAddress === address) {
      setActiveAddress(updatedWallets.length > 0 ? updatedWallets[0].address : null)
    }
  }

  // Get active wallet object
  const activeWallet = wallets.find(w => w.address === activeAddress) || null

  const refreshBalance = async () => {
    if (activeWallet && activeWallet.address) {
      setLoadingBalance(true)
      try {
        const client = new Client(XRPL_NODE)
        await client.connect()
        const balances = await fetchBalances(client, activeWallet.address)

        setWallets(prev => prev.map(w =>
          w.address === activeWallet.address
            ? { ...w, balance: balances.xrp, usdcBalance: balances.usdc }
            : w
        ))
        await client.disconnect()
      } catch (err) {
        console.error('Failed to refresh balance:', err)
      } finally {
        setLoadingBalance(false)
      }
    }
  }

  // Refresh balance on wallet switch or mount
  useEffect(() => {
    refreshBalance()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAddress])

  return (
    <div className="container anim-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <img src={centLogo} alt="Cent Logo" style={{ height: '90px', width: 'auto' }} />
        <h1 className="title" style={{ margin: 0 }}>
          XRPL <span className="text-gradient">Wallet</span>
        </h1>
      </div>

      <div className="glass" style={{ padding: '2rem', width: '100%', maxWidth: '500px' }}>
        <WalletSelector
          wallets={wallets}
          activeAddress={activeAddress}
          onSelect={setActiveAddress}
          onDelete={deleteWallet}
        />

        {activeWallet ? (
          <WalletDisplay
            wallet={activeWallet}
            loadingBalance={loadingBalance}
            refreshBalance={refreshBalance}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>
            No wallet selected. Add or import one below.
          </div>
        )}

        <div style={{ height: '1px', background: 'var(--glass-border)', margin: '1.5rem 0' }}></div>

        <WalletManager
          wallet={activeWallet}
          addWallet={addWallet}
          setLoadingBalance={setLoadingBalance}
          refreshBalance={refreshBalance}
          hasWallets={wallets.length > 0}
        />
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        Connected to XRPL Testnet
      </p>
    </div >
  )
}

export default App
