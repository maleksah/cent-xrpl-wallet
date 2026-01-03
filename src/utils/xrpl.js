import { USDC_TESTNET } from '../constants'

export const fetchBalances = async (client, address) => {
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

export const fetchTransactions = async (client, address) => {
    try {
        const response = await client.request({
            command: 'account_tx',
            account: address,
            ledger_index_min: -1,
            ledger_index_max: -1,
            limit: 20
        })

        if (!response.result || !response.result.transactions) {
            return []
        }

        return response.result.transactions.map(tx => {
            // Normalize transaction and metadata fields
            const t = tx.tx || tx.tx_json || tx
            const meta = tx.meta || tx.metadata
            const deliveredAmount = meta ? (meta.delivered_amount || meta.DeliveredAmount) : null

            let amount = '0'
            let currency = 'XRP'

            // Prioritize delivered_amount for Payments, fallback to Amount or LimitAmount
            const rawAmount = deliveredAmount || t.Amount || t.LimitAmount

            if (rawAmount) {
                if (typeof rawAmount === 'string') {
                    amount = (parseFloat(rawAmount) / 1000000).toString()
                    currency = 'XRP'
                } else if (typeof rawAmount === 'object') {
                    if (t.TransactionType === 'TrustSet') {
                        amount = null
                        currency = ''
                    } else {
                        amount = rawAmount.value
                        if (rawAmount.currency === USDC_TESTNET.currency || rawAmount.currency === 'USDC') {
                            currency = 'USDC'
                        } else {
                            currency = rawAmount.currency.length > 3 ? 'Token' : rawAmount.currency
                        }
                    }
                }
            }

            return {
                hash: t.hash || tx.hash || 'Unknown',
                type: t.TransactionType,
                amount,
                currency,
                date: t.date ? new Date((t.date + 946684800) * 1000).toLocaleString() : 'Unknown',
                sender: t.Account,
                destination: t.Destination || '',
                result: meta ? meta.TransactionResult : 'Unknown'
            }
        })
    } catch (err) {
        console.error('Error fetching transactions:', err)
        return []
    }
}
