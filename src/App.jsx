import { useState } from 'react'
import WalletManager from './components/WalletManager'
import WalletDisplay from './components/WalletDisplay'

function App() {
  // Wallet object: { address, seed, balance, classicAddress... }
  const [wallet, setWallet] = useState(null)
  
  // Balance loading state separate from wallet creation to handle independent funding
  const [loadingBalance, setLoadingBalance] = useState(false)

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
