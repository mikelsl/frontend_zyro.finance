import JSBI from 'jsbi'

export type BigintIsh = JSBI | bigint | string

export enum Rounding {
  ROUND_DOWN,
  ROUND_HALF_UP,
  ROUND_UP
}
export const ZERO = JSBI.BigInt(0)
export const ONE = JSBI.BigInt(1)
export const TWO = JSBI.BigInt(2)
export const THREE = JSBI.BigInt(3)
export const FIVE = JSBI.BigInt(5)
export const TEN = JSBI.BigInt(10)
export const _100 = JSBI.BigInt(100)
export const _997 = JSBI.BigInt(997)
export const _1000 = JSBI.BigInt(1000)

export enum TradeType {
  EXACT_INPUT,
  EXACT_OUTPUT
}

export enum ZChainId {
  MAINNET = 1,
  TESTNET = 333
}
export const CurrentChainId = ZChainId.MAINNET

export const NETWORK = 'Dev Testnet'

export const NETWORK_LABELS: { [chainId in ZChainId]?: string } = {
  [ZChainId.MAINNET]: 'MAINNET',
  [ZChainId.TESTNET]: 'testnet'
}
export const NetworkProvider = {
  [ZChainId.MAINNET]: 'https://api.zilliqa.com',
  [ZChainId.TESTNET]: 'https://dev-api.zilliqa.com'
}
export const faucetHostnameList: string[] = [
  'dev-wallet.zilliqa.com',
  'zdex-app.firebaseapp.com',
  'localhost',
  '127.0.0.1'
]

export const NODE_URL = NetworkProvider[CurrentChainId]
export const ZYRO_LOG = 'https://zyro.finance/images/zyrologo.png'

export enum requestStatus {
  PENDING = 'PENDING',
  FAILED = 'FAILED',
  SUCCEED = 'SUCCEED'
}

export const MINIMUM_LIQUIDITY = JSBI.BigInt(1000)
export const ADJUSTED_APPROVE_AMOUNT = JSBI.BigInt(100)
// default allowed slippage, in bips
export const INITIAL_ALLOWED_SLIPPAGE = 50
// 20 minutes, denominated in seconds
export const DEFAULT_DEADLINE_FROM_NOW = 60 * 20
export const BIG_INT_ZERO = JSBI.BigInt(0)
// one basis point
export const BIPS_BASE = JSBI.BigInt(10000)
// used to ensure the user doesn't send so much ZIL so they end up with < 1
export const MIN_ZIL: JSBI = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(12)) // 1 ZIL

//mainnet contract address
export const ROUTER_ADDRESS_BECH32 = 'zil18uzjpmzta69qahwy2hntdtmtegrs3um26840fy'
export const ROUTER_ADDRESS = '0x3f0520ec4bee8a0eddc455e6b6af6bca0708f36a'
export const MANAGER_ADDRESS = '0x9db917125e3ad598c99aabe675f0293a0cedf1c9'
export const TOKEN_SWAP_ADDRESS = '0xde4d428d81063556b1ff262789fad17b795d687a'
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
export const GOVERNANCE_ADDRESS = '0x5098e0965e3c888214dede44876b837eddf5c9fa'
export const ZLPT_ADDRESS = '0xf48e20b5b3bf2e921008a4f0ae91d67c129682f0'
export const TOKEN_CONVERT_ADDRESS = '0x68425533d2d77be2f2dc9819d0ac162ae7b5584b'
export const TOKEN_MINING_ADDRESS = '0xe4e4e99be695c338b6288dea30be0f788e367bb4'
export const ZYRO_ADDRESS = '0xe61839a9463c75a6082ea2fd0e6b24dfd5de605c'

export function parseBigintIsh(bigintIsh: BigintIsh): JSBI {
  bigintIsh = bigintIsh ?? 0
  return bigintIsh instanceof JSBI
    ? bigintIsh
    : typeof bigintIsh === 'bigint'
    ? JSBI.BigInt(bigintIsh.toString())
    : JSBI.BigInt(bigintIsh)
}

export const baseUrl = 'https://api.zyro.finance'
// export const baseUrl = 'http://localhost:8080'
