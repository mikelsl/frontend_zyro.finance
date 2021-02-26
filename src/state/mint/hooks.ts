import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import JSBI from 'jsbi'

import { useActiveWeb3React } from '../../hooks'
import { AppDispatch, AppState } from '../index'
import { Field, typeInput } from './actions'
import {
  useAllLiquidityTokens,
  useTokenAllowances,
  useTokenReserves,
  useTokenTotalSupply,
  useZilReserves,
  ZCurrency,
  ZCurrencyAmount,
  ZToken,
  ZTokenAmount
} from '../../zilliqa/ztoken'
import { useZilliqaState } from '../zilliqa/rootReducer'
import { Percent } from '../../zilliqa/percent'
import { Pair } from '../../zilliqa/pairs'
import { toQA, toTokenQA } from '../../zilliqa/utils'
import { ZERO_AMOUNT } from '../../zilliqa'
import { MANAGER_ADDRESS } from '../../zilliqa/constant'

export function useMintState(): AppState['mint'] {
  return useSelector<AppState, AppState['mint']>(state => state.mint)
}

export function useMintInfo(currencyA: ZCurrency | undefined, currencyB: ZCurrency | undefined) {
  const { account } = useActiveWeb3React()

  const currencies: { [field in Field]?: ZCurrency } = useMemo(
    () => ({
      [Field.CURRENCY_A]: currencyA ?? undefined,
      [Field.CURRENCY_B]: currencyB ?? undefined
    }),
    [currencyA, currencyB]
  )

  const { independentField, typedValue, otherTypedValue } = useMintState()
  const dependentField = independentField === Field.CURRENCY_A ? Field.CURRENCY_B : Field.CURRENCY_A
  const aIsZil = currencyA?.symbol === 'ZIL'
  const tokenField = aIsZil ? Field.CURRENCY_B : Field.CURRENCY_A
  const zilValue = currencies[independentField] instanceof ZToken ? otherTypedValue : typedValue
  const tokenValue = zilValue === typedValue ? otherTypedValue : typedValue

  const tokens = useAllLiquidityTokens()
  const pairExists =
    currencies[tokenField] && currencies[tokenField] instanceof ZToken
      ? tokens.includes((currencies[tokenField] as ZToken).address ?? '')
      : true
  const ltAddress = currencies[tokenField] && (currencies[tokenField] as ZToken).address
  const tokenTS = useTokenTotalSupply(ltAddress)
  const noLiquidity = !pairExists || tokenTS === undefined || tokenTS.equalTo('0')

  const { balanceInQa, tokenBalance } = useZilliqaState()
  const zilBalanceAmount = account ? ZCurrencyAmount.zil(balanceInQa[account]) : ZERO_AMOUNT
  const tokenBalanceNum =
    account && currencies[tokenField] && (currencies[tokenField] as ZToken)
      ? tokenBalance[(currencies[tokenField] as ZToken)?.address]
        ? tokenBalance[(currencies[tokenField] as ZToken)?.address][account]
        : '0'
      : '0'
  const tokenBalanceAmount = new ZTokenAmount(currencies[tokenField] as ZToken, tokenBalanceNum)
  const userAllowances = useTokenAllowances(tokenBalanceAmount.token?.address ?? '', account ?? '', MANAGER_ADDRESS)
  const enoughApprove = JSBI.lessThan(tokenBalanceAmount.raw, userAllowances)

  const currencyBalances: { [field in Field]?: ZCurrencyAmount } = {
    [Field.CURRENCY_A]: aIsZil ? zilBalanceAmount : tokenBalanceAmount,
    [Field.CURRENCY_B]: aIsZil ? tokenBalanceAmount : zilBalanceAmount
  }

  const zilAmount = ZCurrencyAmount.zil(JSBI.BigInt(toQA(zilValue === '' ? '0' : zilValue)))
  const tokenAmount =
    tokenField && currencies[tokenField]
      ? new ZTokenAmount(
          currencies[tokenField] as ZToken,
          JSBI.BigInt(toTokenQA(tokenValue === '' ? '0' : tokenValue, currencies[tokenField] as ZToken))
        )
      : ZERO_AMOUNT
  const zilReserves = useZilReserves(currencies[tokenField] ? (currencies[tokenField] as ZToken).address : undefined)
  const tokenReserves = useTokenReserves(
    currencies[tokenField] ? (currencies[tokenField] as ZToken).address : undefined
  )
  const reserveAmounts: { [field in Field]: ZCurrencyAmount | undefined } = {
    [Field.CURRENCY_A]: aIsZil ? zilReserves : tokenReserves,
    [Field.CURRENCY_B]: aIsZil ? tokenReserves : zilReserves
  }
  const inputAmount = currencies[independentField]
    ? currencies[independentField] instanceof ZToken
      ? tokenAmount
      : zilAmount
    : ZERO_AMOUNT
  const inputReserve = reserveAmounts[independentField]
  const outputReserve = reserveAmounts[dependentField]
  const pair = inputReserve && outputReserve ? new Pair(inputReserve, outputReserve) : undefined
  let outputAmount
  try {
    const [oa] = pair ? pair.getLiquidityOutputAmount(inputAmount) : [ZERO_AMOUNT]
    outputAmount = oa
  } catch (e) {
    console.log('insufficient reserves')
    outputAmount = ZERO_AMOUNT
  }
  const parsedAmounts = noLiquidity
    ? {
        [Field.CURRENCY_A]: aIsZil ? zilAmount : tokenAmount,
        [Field.CURRENCY_B]: aIsZil ? tokenAmount : zilAmount
      }
    : {
        [independentField]: inputAmount,
        [dependentField]: outputAmount
      }

  let liquidityMinted: ZTokenAmount | undefined
  try {
    liquidityMinted =
      pair && parsedAmounts[Field.CURRENCY_A] && parsedAmounts[Field.CURRENCY_B]
        ? pair.getLiquidityMinted(
            tokenTS,
            parsedAmounts[independentField] as ZCurrencyAmount,
            parsedAmounts[dependentField] as ZCurrencyAmount
          )
        : undefined
  } catch (e) {
    // console.log(e)
    liquidityMinted = undefined
  }

  const poolTokenPercentage = useMemo(() => {
    if (liquidityMinted && tokenTS) {
      return new Percent(liquidityMinted.raw, tokenTS.add(liquidityMinted).raw)
    } else {
      return undefined
    }
  }, [liquidityMinted, tokenTS])
  const error = false

  return {
    dependentField,
    currencies,
    currencyBalances,
    noLiquidity,
    liquidityMinted,
    parsedAmounts,
    poolTokenPercentage,
    enoughApprove,
    tokenField,
    pairExists,
    tokenTS,
    pair,
    error
  }
}

export function useMintActionHandlers(
  noLiquidity: boolean | undefined
): {
  onFieldAInput: (typedValue: string) => void
  onFieldBInput: (typedValue: string) => void
} {
  const dispatch = useDispatch<AppDispatch>()

  const onFieldAInput = useCallback(
    (typedValue: string) => {
      dispatch(typeInput({ field: Field.CURRENCY_A, typedValue, noLiquidity: noLiquidity === true }))
    },
    [dispatch, noLiquidity]
  )
  const onFieldBInput = useCallback(
    (typedValue: string) => {
      dispatch(typeInput({ field: Field.CURRENCY_B, typedValue, noLiquidity: noLiquidity === true }))
    },
    [dispatch, noLiquidity]
  )

  return {
    onFieldAInput,
    onFieldBInput
  }
}
