import { BIPS_BASE, CurrentChainId, NetworkProvider, ZChainId, ZERO_ADDRESS, ZLPT_ADDRESS } from './constant'
import { Zilliqa } from '@zilliqa-js/zilliqa'
import { Percent } from './percent'
import JSBI from 'jsbi'
import { ZToken, ZTokenAmount } from './ztoken'

export const NetworkContextName = 'NETWORK'

export const CHAIN_ID: number = CurrentChainId
export const MSG_VERSION = 1

export const zilliqa = new Zilliqa(NetworkProvider[CurrentChainId])
export const ZLPT: { [chainId in ZChainId]: ZToken } = {
  [ZChainId.MAINNET]: new ZToken(ZChainId.MAINNET, ZLPT_ADDRESS, 8, 'ZLPT', 'Zyroswap'),
  [ZChainId.TESTNET]: new ZToken(ZChainId.TESTNET, ZLPT_ADDRESS, 8, 'ZLPT', 'Zyroswap')
}
export const FAKET: { [chainId in ZChainId]: ZToken } = {
  [ZChainId.MAINNET]: new ZToken(ZChainId.TESTNET, ZERO_ADDRESS, 8, 'FAKE', 'STUBFORUNDEFINEDTOKEN'),
  [ZChainId.TESTNET]: new ZToken(ZChainId.TESTNET, ZERO_ADDRESS, 8, 'FAKE', 'STUBFORUNDEFINEDTOKEN')
}
export const ZERO_AMOUNT = new ZTokenAmount(FAKET[CurrentChainId], '0')

// used for warning states
export const ONE_ZBIPS = new Percent(JSBI.BigInt(1), JSBI.BigInt(10000))
export const ALLOWED_PRICE_IMPACT_LOW: Percent = new Percent(JSBI.BigInt(100), BIPS_BASE) // 1%
export const ALLOWED_PRICE_IMPACT_MEDIUM: Percent = new Percent(JSBI.BigInt(300), BIPS_BASE) // 3%
export const ALLOWED_PRICE_IMPACT_HIGH: Percent = new Percent(JSBI.BigInt(500), BIPS_BASE) // 5%

// if the price slippage exceeds this number, force the user to type 'confirm' to execute
export const PRICE_IMPACT_WITHOUT_FEE_CONFIRM_MIN: Percent = new Percent(JSBI.BigInt(1000), BIPS_BASE) // 10%

// for non expert mode disable swaps above this
export const BLOCKED_PRICE_IMPACT_NON_EXPERT: Percent = new Percent(JSBI.BigInt(1500), BIPS_BASE) // 15%
