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
