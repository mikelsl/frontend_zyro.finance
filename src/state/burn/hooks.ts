import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { useActiveWeb3React } from '../../hooks'
import { AppDispatch, AppState } from '../index'
import { Field, typeInput } from './actions'
import {
  useTokenAllowances,
  useTokenBalance,
  useTokenReserves,
  useTokenTotalSupplyByContract,
  useZilReserves,
  ZCurrency,
  ZCurrencyAmount,
  ZToken,
  ZTokenAmount
} from '../../zilliqa/ztoken'
import { ZERO_AMOUNT, ZLPT } from '../../zilliqa'
import { Percent } from '../../zilliqa/percent'
import { tryParseAmount } from '../swap/hooks'
import { toQA, toTokenQA } from '../../zilliqa/utils'
import { CurrentChainId, MANAGER_ADDRESS, Rounding, ROUTER_ADDRESS, ZLPT_ADDRESS } from '../../zilliqa/constant'
import BN from 'bn.js'
import {JSBI} from "@uniswap/sdk";

export function useBurnState(): AppState['burn'] {
  return useSelector<AppState, AppState['burn']>(state => state.burn)
}

export function useBurnInfo(
  currencyA: ZCurrency | undefined,
  currencyB: ZCurrency | undefined
): {
  error: string | undefined
  parsedAmounts: {
    [Field.LIQUIDITY_PERCENT]: Percent
    [Field.LIQUIDITY]?: ZTokenAmount
    [Field.CURRENCY_A]?: ZCurrencyAmount
    [Field.CURRENCY_B]?: ZCurrencyAmount
  }
  tokenField: Field
  enoughApprove: boolean
} {
  const { account } = useActiveWeb3React()
  const chaiId = CurrentChainId

  const { independentField, typedValue } = useBurnState()
  const currencies: { [field in Field]?: ZCurrency } = useMemo(
    () => ({
      [Field.CURRENCY_A]: currencyA ?? undefined,
      [Field.CURRENCY_B]: currencyB ?? undefined
    }),
    [currencyA, currencyB]
  )
  const aIsZil = currencyA?.symbol === 'ZIL'
  const tokenField = aIsZil ? Field.CURRENCY_B : Field.CURRENCY_A
  const zilReserves = useZilReserves(currencies[tokenField] ? (currencies[tokenField] as ZToken).address : undefined)
  const tokenReserves = useTokenReserves(
    currencies[tokenField] ? (currencies[tokenField] as ZToken).address : undefined
  )

  // const userLiquidity = useTokenBalance(ZLPT[CurrentChainId], account ?? '')
  const totalSupply = useTokenTotalSupplyByContract(ZLPT_ADDRESS)
  const userTotalSupply = useTokenBalance(ZLPT[chaiId], account ?? '')

  let percentToRemove: Percent = new Percent('0', '100')
  if (independentField === Field.LIQUIDITY_PERCENT) {
    percentToRemove = new Percent(typedValue, '100')
  } else if (independentField === Field.LIQUIDITY) {
    const typedAmount = new ZTokenAmount(ZLPT[chaiId], typedValue)
    percentToRemove = typedAmount.divide(totalSupply)
  } else if (independentField === Field.CURRENCY_A) {
    const typedAmount = tryParseAmount(typedValue)
    if (typedAmount !== undefined) {
      percentToRemove = typedAmount?.divide(aIsZil ? zilReserves : tokenReserves)
    }
  } else if (independentField === Field.CURRENCY_B) {
    const typedAmount = tryParseAmount(typedValue)
    if (typedAmount !== undefined) {
      percentToRemove = typedAmount.divide(aIsZil ? tokenReserves : zilReserves)
    }
  }
  const burnAmount = userTotalSupply.multiply(percentToRemove)
  const ta = tokenReserves.multiply(burnAmount).divide(totalSupply)
  const za = zilReserves.multiply(burnAmount).divide(totalSupply)
  const min = new BN('10000000000')
  const tmin = new BN('1000000')
  const zilAmount = ZCurrencyAmount.zil(
    toQA(za.toSignificant(6, { groupSeparator: '' }, Rounding.ROUND_DOWN))
      .sub(min)
      .toString()
  )
  const tokeAmount = currencies[tokenField]
    ? new ZTokenAmount(
        currencies[tokenField] as ZToken,
        toTokenQA(ta.toSignificant(6, { groupSeparator: '' }, Rounding.ROUND_DOWN), currencies[tokenField] as ZToken)
          .sub(tmin)
          .toString()
      )
    : ZERO_AMOUNT
  const liquidityAmount = new ZTokenAmount(
    ZLPT[chaiId],
    toTokenQA(burnAmount.toSignificant(6, { groupSeparator: '' }, Rounding.ROUND_DOWN), ZLPT[CurrentChainId]).toString()
  )
  const userAllowances = useTokenAllowances(tokeAmount.token?.address ?? '', ROUTER_ADDRESS, MANAGER_ADDRESS)
  const enoughApprove = JSBI.lessThan(tokeAmount.raw, userAllowances)

  const parsedAmounts: {
    [Field.LIQUIDITY_PERCENT]: Percent
    [Field.LIQUIDITY]?: ZTokenAmount
    [Field.CURRENCY_A]?: ZCurrencyAmount
    [Field.CURRENCY_B]?: ZCurrencyAmount
  } = {
    [Field.LIQUIDITY_PERCENT]: percentToRemove,
    [Field.LIQUIDITY]: liquidityAmount,
    [Field.CURRENCY_A]: aIsZil ? zilAmount : tokeAmount,
    [Field.CURRENCY_B]: aIsZil ? tokeAmount : zilAmount
  }

  let error: string | undefined
  if (!account) {
    error = 'Connect Wallet'
  }

  if (!parsedAmounts[Field.LIQUIDITY] || !parsedAmounts[Field.CURRENCY_A] || !parsedAmounts[Field.CURRENCY_B]) {
    error = error ?? 'Enter an amount'
  }

  return { parsedAmounts, error, tokenField, enoughApprove }
}

export function useBurnActionHandlers(): {
  onUserInput: (field: Field, typedValue: string) => void
} {
  const dispatch = useDispatch<AppDispatch>()

  const onUserInput = useCallback(
    (field: Field, typedValue: string) => {
      dispatch(typeInput({ field, typedValue }))
    },
    [dispatch]
  )

  return {
    onUserInput
  }
}
