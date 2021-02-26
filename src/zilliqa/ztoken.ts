import { useDispatch } from 'react-redux'
import { useEffect, useMemo } from 'react'
import invariant from 'tiny-invariant'
import { ZERO_AMOUNT, ZLPT } from '.'
import JSBI from 'jsbi'
import toFormat from './toformat'
import _Big from 'big.js'
import { AppDispatch } from '../state'
import * as zilActions from '../state/zilliqa/zil/actions'
import { useZilliqaState } from '../state/zilliqa/rootReducer'
import {
  Rounding,
  BigintIsh,
  CurrentChainId,
  requestStatus,
  ROUTER_ADDRESS,
  TEN,
  ZChainId,
  parseBigintIsh,
  ZERO
} from './constant'
import { Fraction } from './fraction'

export class ZCurrency {
  public readonly decimals: number
  public readonly symbol?: string
  public readonly name?: string

  /**
   * The only instance of the base class `Currency`.
   */
  public static readonly ZIL: ZCurrency = new ZCurrency(12, 'ZIL', 'Zilliqa')

  /**
   * Constructs an instance of the base class `Currency`. The only instance of the base class `Currency` is `Currency.ETHER`.
   * @param decimals decimals of the currency
   * @param symbol symbol of the currency
   * @param name of the currency
   */
  protected constructor(decimals: number, symbol?: string, name?: string) {
    this.decimals = decimals
    this.symbol = symbol
    this.name = name
  }
}

const ZIL = ZCurrency.ZIL
export { ZIL }

export class ZToken extends ZCurrency {
  public readonly chainId: ZChainId
  public readonly address: string

  public constructor(chainId: ZChainId, address: string, decimals: number, symbol?: string, name?: string) {
    super(decimals, symbol, name)
    this.chainId = chainId
    this.address = address
  }

  /**
   * Returns true if the two tokens are equivalent, i.e. have the same chainId and address.
   * @param other other token to compare
   */
  public equals(other: ZToken): boolean {
    // short circuit on reference equality
    if (this === other) {
      return true
    }
    return this.chainId === other.chainId && this.address === other.address
  }

  /**
   * Returns true if the address of this token sorts before the address of the other token
   * @param other other token to compare
   * @throws if the tokens have the same address
   * @throws if the tokens are on different chains
   */
  public sortsBefore(other: ZToken): boolean {
    invariant(this.chainId === other.chainId, 'CHAIN_IDS')
    invariant(this.address !== other.address, 'ADDRESSES')
    return this.address.toLowerCase() < other.address.toLowerCase()
  }
}

/**
 * Compares two currencies for equality
 */
export function currencyEquals(currencyA: ZCurrency, currencyB: ZCurrency): boolean {
  if (currencyA instanceof ZToken && currencyB instanceof ZToken) {
    return currencyA.equals(currencyB)
  } else if (currencyA instanceof ZToken) {
    return false
  } else if (currencyB instanceof ZToken) {
    return false
  } else {
    return currencyA === currencyB
  }
}

const Big = toFormat(_Big)
export class ZCurrencyAmount extends Fraction {
  public readonly currency: ZCurrency

  /**
   * Helper that calls the constructor with the ETHER currency
   * @param amount ether amount in wei
   */
  public static zil(amount: BigintIsh): ZCurrencyAmount {
    return new ZCurrencyAmount(ZIL, amount)
  }

  // amount _must_ be raw, i.e. in the native representation
  protected constructor(currency: ZCurrency, amount: BigintIsh) {
    const parsedAmount = parseBigintIsh(amount)

    super(parsedAmount, JSBI.exponentiate(TEN, JSBI.BigInt(currency?.decimals ?? 0)))
    this.currency = currency
  }

  public get raw(): JSBI {
    return this.numerator
  }

  public add(other: ZCurrencyAmount): ZCurrencyAmount {
    invariant(currencyEquals(this.currency, other.currency), 'TOKEN')
    return new ZCurrencyAmount(this.currency, JSBI.add(this.raw, other.raw))
  }

  public subtract(other: ZCurrencyAmount): ZCurrencyAmount {
    invariant(currencyEquals(this.currency, other.currency), 'TOKEN')
    return new ZCurrencyAmount(this.currency, JSBI.subtract(this.raw, other.raw))
  }

  public toSignificant(significantDigits = 6, format?: object, rounding: Rounding = Rounding.ROUND_UP): string {
    return super.toSignificant(significantDigits, format, rounding)
  }

  public toFixed(
    decimalPlaces: number = this.currency.decimals,
    format?: object,
    rounding: Rounding = Rounding.ROUND_UP
  ): string {
    invariant(decimalPlaces <= this.currency.decimals, 'DECIMALS')
    return super.toFixed(decimalPlaces, format, rounding)
  }

  public toExact(format: object = { groupSeparator: '' }): string {
    Big.DP = parseInt(this.currency.decimals.toString())
    return new Big(this.numerator.toString()).div(this.denominator.toString()).toFormat(format)
  }
}

export class ZTokenAmount extends ZCurrencyAmount {
  public readonly token: ZToken
  public currencyForToken: ZToken

  // amount _must_ be raw, i.e. in the native representation
  public constructor(token: ZToken, amount: BigintIsh) {
    super(token, amount)
    this.token = token
    this.currencyForToken = token
  }

  public get currency(): ZToken {
    return this.currencyForToken
  }

  public set currency(token: ZToken) {
    this.currencyForToken = token
  }

  public add(other: ZTokenAmount): ZTokenAmount {
    invariant(this.token.equals(other.token), 'TOKEN')
    return new ZTokenAmount(this.token, JSBI.add(this.raw, other.raw))
  }

  public subtract(other: ZTokenAmount): ZTokenAmount {
    invariant(this.token.equals(other.token), 'TOKEN')
    return new ZTokenAmount(this.token, JSBI.subtract(this.raw, other.raw))
  }
}

function extractTokeninit(inits: any) {
  const initObj = {
    name: undefined,
    symbol: undefined,
    decimals: undefined,
    contractOwner: undefined,
    initSupply: undefined,
    thisAddress: undefined
  }

  if (inits === undefined) return initObj

  inits.forEach((value: any) => {
    if (value.vname === 'name') initObj.name = value.value
    if (value.vname === 'symbol') initObj.symbol = value.value
    if (value.vname === 'decimals') initObj.decimals = value.value
    if (value.vname === 'contract_owner') initObj.contractOwner = value.value
    if (value.vname === 'init_supply') initObj.initSupply = value.value
    if (value.vname === '_this_address') initObj.thisAddress = value.value
  })

  return initObj
}
export function useToken(tokenAddress: string | undefined): ZToken | undefined {
  const dispatch = useDispatch<AppDispatch>()
  const { tokenContract } = useZilliqaState()
  const noInit = tokenContract[tokenAddress ?? 'xxx'] === undefined

  useEffect(() => {
    const getTokenContract = (tokenAddress: string | undefined) =>
      dispatch(zilActions.getTokenContract(tokenAddress ?? ''))
    if (noInit) {
      getTokenContract(tokenAddress)
      // console.log('effect: getTokenContract - ' + tokenAddress + '=' + tokenContract[tokenAddress ?? ''])
    }
  }, [tokenAddress, dispatch, noInit])

  const tokenInit = extractTokeninit(tokenAddress ? tokenContract[tokenAddress] : undefined)
  return tokenInit && tokenAddress && tokenContract[tokenAddress]
    ? new ZToken(CurrentChainId, tokenAddress, tokenInit.decimals ?? 0, tokenInit.symbol, tokenInit.name)
    : undefined
}

export function useCurrency(currencyId: string | undefined): ZCurrency | undefined {
  const isZIL = currencyId?.toUpperCase() === 'ZIL'
  const token = useToken(isZIL ? undefined : currencyId)
  return isZIL ? ZIL : token
}
export function useZLPTBalance(address: string): ZTokenAmount {
  const dispatch = useDispatch<AppDispatch>()
  const chainId = CurrentChainId
  const { tokenBalance, getTokenBalanceStatus } = useZilliqaState()

  const tokenAddress = ZLPT[chainId].address
  useEffect(() => {
    const getZLPTBalance = (address: string) => dispatch(zilActions.getTokenBalance(tokenAddress, address))
    if (
      getTokenBalanceStatus[tokenAddress] === undefined ||
      getTokenBalanceStatus[tokenAddress][address] === undefined ||
      getTokenBalanceStatus[tokenAddress][address] !== requestStatus.PENDING
    ) {
      getZLPTBalance(address)
    }
  }, [address, dispatch, tokenAddress])

  return tokenBalance[tokenAddress]
    ? tokenBalance[tokenAddress][address]
      ? new ZTokenAmount(ZLPT[chainId], tokenBalance[tokenAddress][address])
      : ZERO_AMOUNT
    : ZERO_AMOUNT
}
export function useTokenBalance(token: ZToken, account: string): ZTokenAmount {
  const dispatch = useDispatch<AppDispatch>()
  const { tokenBalance, getTokenBalanceStatus } = useZilliqaState()

  const tokenAddress = token?.address
  useEffect(() => {
    const getTokenBalance = (tokenAddress: string | undefined) =>
      dispatch(zilActions.getTokenBalance(tokenAddress ?? '', account ?? ''))
    if (
      (getTokenBalanceStatus[tokenAddress] === undefined ||
        getTokenBalanceStatus[tokenAddress][account] === undefined ||
        getTokenBalanceStatus[tokenAddress][account] !== requestStatus.PENDING) &&
      !(token === ZIL)
    ) {
      getTokenBalance(tokenAddress)
    }
  }, [account, tokenAddress, dispatch])

  return tokenBalance[tokenAddress]
    ? tokenBalance[tokenAddress][account]
      ? new ZTokenAmount(token, tokenBalance[tokenAddress][account])
      : ZERO_AMOUNT
    : ZERO_AMOUNT
}
export function useZilBalance(account: string): ZCurrencyAmount {
  const dispatch = useDispatch<AppDispatch>()
  const { balanceInQa, getBalanceStatus } = useZilliqaState()

  // const isUpdatingBalance = getBalanceStatus === requestStatus.PENDING
  useEffect(() => {
    const getBalance = (address: string) => dispatch(zilActions.getBalance(address))
    if (getBalanceStatus[account] === undefined) {
      getBalance(account)
    }
  }, [account, dispatch])

  return ZCurrencyAmount.zil(balanceInQa[account] ?? '0')
}

export function useCurrencyBalance(currency: ZCurrency, account: string): ZCurrencyAmount {
  const tokenBalance = useTokenBalance(currency as ZToken, account)
  const zilBalance = useZilBalance(account)

  return useMemo(() => {
    if (!account || !currency) return ZERO_AMOUNT
    if (currency instanceof ZToken) return tokenBalance
    if (currency === ZIL) return zilBalance
    return ZERO_AMOUNT
  }, [account, currency, tokenBalance, zilBalance])
}

export function useTokenReserves(liquidityTokenAddress: string | undefined): ZTokenAmount {
  const dispatch = useDispatch<AppDispatch>()
  const { tokenContract, tokenContractState, getTokenContractStateStatus } = useZilliqaState()
  const tokenAddress = ROUTER_ADDRESS

  useEffect(() => {
    const getTokenContractState = (tokenAddress: string | undefined) =>
      dispatch(zilActions.getTokenContractState(tokenAddress ?? ''))
    if (getTokenContractStateStatus[tokenAddress] === undefined) {
      // console.log('effect: getTokenContractState - ' + liquidityTokenAddress)
      getTokenContractState(tokenAddress)
    }
  }, [dispatch, liquidityTokenAddress])

  const tokenInit = extractTokeninit(liquidityTokenAddress ? tokenContract[liquidityTokenAddress] : undefined)
  const token =
    tokenInit && liquidityTokenAddress && tokenContract[liquidityTokenAddress]
      ? new ZToken(CurrentChainId, liquidityTokenAddress, tokenInit.decimals ?? 0, tokenInit.symbol, tokenInit.name)
      : undefined

  const zeroAmount = token ? new ZTokenAmount(token as ZToken, '0') : ZERO_AMOUNT
  const allReserves =
    liquidityTokenAddress && tokenContractState[tokenAddress]
      ? tokenContractState[tokenAddress]['token_reserves'][liquidityTokenAddress]
      : undefined
  return allReserves ? (token ? new ZTokenAmount(token, allReserves) : zeroAmount) : zeroAmount
}

export function useInvalideTokenContractStat(tokenAddress: string | undefined) {
  const dispatch = useDispatch<AppDispatch>()
  if (tokenAddress === undefined) return
  const invalidTokenContractState = (tokenAddress: string) =>
    dispatch(zilActions.invalidTokenContractState(tokenAddress))
  invalidTokenContractState(tokenAddress)
}

export function useZilReserves(liquidityTokenAddress: string | undefined): ZCurrencyAmount {
  const dispatch = useDispatch<AppDispatch>()
  const { tokenContractState, getTokenContractStateStatus } = useZilliqaState()
  const tokenAddress = ROUTER_ADDRESS

  useEffect(() => {
    console.log('enter use effect ' + tokenAddress)
    const getTokenContractState = (tokenAddress: string) => dispatch(zilActions.getTokenContractState(tokenAddress))
    if (getTokenContractStateStatus[tokenAddress] === undefined) {
      console.log('did get token contract state')
      getTokenContractState(tokenAddress)
    }
  }, [tokenAddress, dispatch])

  const zeroAmount = ZCurrencyAmount.zil('0')
  const allReserves = tokenContractState[tokenAddress] ? tokenContractState[tokenAddress]['zil_reserves'] : undefined
  return liquidityTokenAddress
    ? allReserves
      ? ZCurrencyAmount.zil(allReserves[liquidityTokenAddress])
      : zeroAmount
    : zeroAmount
}

export function useAllLiquidityTokens(): string[] {
  const dispatch = useDispatch<AppDispatch>()
  const { tokenContractState } = useZilliqaState()
  const tokenAddress = ROUTER_ADDRESS
  const noState = tokenContractState[tokenAddress] === undefined

  useEffect(() => {
    const getTokenContractState = (tokenAddress: string) => dispatch(zilActions.getTokenContractState(tokenAddress))
    if (noState) {
      getTokenContractState(tokenAddress)
    }
  }, [tokenAddress, dispatch, noState])

  const allTokenIds: string[] | undefined = tokenContractState[tokenAddress]
    ? Object.values(tokenContractState[tokenAddress]['id_to_token'])
    : undefined
  return allTokenIds ? allTokenIds : []
}

export function useTokenTotalSupply(liquidityTokenAddress: string | undefined): ZTokenAmount {
  const dispatch = useDispatch<AppDispatch>()
  const { tokenContractState, getTokenContractStateStatus } = useZilliqaState()
  const tokenAddress = ROUTER_ADDRESS

  useEffect(() => {
    const getTokenContractState = (tokenAddress: string | undefined) =>
      dispatch(zilActions.getTokenContractState(tokenAddress ?? ''))
    if (getTokenContractStateStatus[tokenAddress] === undefined) {
      getTokenContractState(tokenAddress)
    }
  }, [tokenAddress, dispatch])

  const allSupplies = tokenContractState[tokenAddress]
    ? tokenContractState[tokenAddress]['token_total_supplies']
    : undefined

  const zeroAmount = new ZTokenAmount(ZLPT[CurrentChainId], '0')
  return liquidityTokenAddress
    ? allSupplies
      ? new ZTokenAmount(ZLPT[CurrentChainId], allSupplies[liquidityTokenAddress])
      : zeroAmount
    : zeroAmount
}
export function useTokenTotalSupplyByContract(tokenAddress: string): ZTokenAmount {
  const dispatch = useDispatch<AppDispatch>()
  const { tokenContractState, getTokenContractStateStatus } = useZilliqaState()

  useEffect(() => {
    const getTokenContractState = (tokenAddress: string | undefined) =>
      dispatch(zilActions.getTokenContractState(tokenAddress ?? ''))
    if (getTokenContractStateStatus[tokenAddress] === undefined) {
      console.log('did get total supply' + tokenAddress)
      getTokenContractState(tokenAddress)
    }
  }, [tokenAddress, dispatch])

  const allSupplies = tokenContractState[tokenAddress] ? tokenContractState[tokenAddress]['total_supply'] : undefined
  console.log('enter get total supply' + tokenAddress + ' ' + allSupplies)

  const zeroAmount = new ZTokenAmount(ZLPT[CurrentChainId], '0')
  return allSupplies ? new ZTokenAmount(ZLPT[CurrentChainId], allSupplies) : zeroAmount
}
export function useTokenAllowances(tokenAddress: string, account: string, aux: string): JSBI {
  const dispatch = useDispatch<AppDispatch>()
  const { tokenContractState, getTokenContractStateStatus } = useZilliqaState()

  useEffect(() => {
    const getTokenContractState = (tokenAddress: string) => dispatch(zilActions.getTokenContractState(tokenAddress))
    if (tokenAddress !== '' && account !== '' && getTokenContractStateStatus[tokenAddress] === undefined) {
      getTokenContractState(tokenAddress)
    }
  }, [account, getTokenContractStateStatus, tokenAddress, dispatch])

  const allowances = tokenContractState[tokenAddress]
    ? tokenContractState[tokenAddress]['allowances'][account.toLowerCase()]
    : undefined
  const userAllowances = allowances ? allowances[aux] : undefined
  return userAllowances ? JSBI.BigInt(userAllowances) : ZERO
}
