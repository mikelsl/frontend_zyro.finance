import { JSBI } from '@uniswap/sdk'
import { ParsedQs } from 'qs'
import { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import useParsedQueryString from '../../hooks/useParsedQueryString'
import { AppDispatch, AppState } from '../index'
import { Field, replaceSwapState, selectCurrency, setRecipient, switchCurrencies, typeInput } from './actions'
import { SwapState } from './reducer'
import { useUserSlippageTolerance } from '../user/hooks'
import {
  useCurrency,
  useTokenAllowances,
  useTokenReserves,
  useZilReserves,
  ZCurrency,
  ZCurrencyAmount,
  ZIL,
  ZToken,
  ZTokenAmount
} from '../../zilliqa/ztoken'
import { Pair } from '../../zilliqa/pairs'
import { computeSlippageAdjustedAmounts, toQA, toTokenQA } from '../../zilliqa/utils'
import { useZilliqaState } from '../zilliqa/rootReducer'
import { useActiveWeb3React } from '../../hooks'
import { ZERO_AMOUNT } from '../../zilliqa'
import { CurrentChainId, TOKEN_SWAP_ADDRESS, ROUTER_ADDRESS } from '../../zilliqa/constant'

export function useSwapState(): AppState['swap'] {
  return useSelector<AppState, AppState['swap']>(state => state.swap)
}

export function useSwapActionHandlers(): {
  onCurrencySelection: (field: Field, currency: ZCurrency) => void
  onSwitchTokens: () => void
  onUserInput: (field: Field, typedValue: string) => void
  onChangeRecipient: (recipient: string | null) => void
} {
  const dispatch = useDispatch<AppDispatch>()
  const onCurrencySelection = useCallback(
    (field: Field, currency: ZCurrency) => {
      dispatch(
        selectCurrency({
          field,
          currencyId: currency instanceof ZToken ? currency.address : currency === ZIL ? 'ZIL' : ''
        })
      )
    },
    [dispatch]
  )

  const onSwitchTokens = useCallback(() => {
    dispatch(switchCurrencies())
  }, [dispatch])

  const onUserInput = useCallback(
    (field: Field, typedValue: string) => {
      dispatch(typeInput({ field, typedValue }))
    },
    [dispatch]
  )

  const onChangeRecipient = useCallback(
    (recipient: string | null) => {
      dispatch(setRecipient({ recipient }))
    },
    [dispatch]
  )

  return {
    onSwitchTokens,
    onCurrencySelection,
    onUserInput,
    onChangeRecipient
  }
}

// try to parse a user entered amount for a given token
export function tryParseAmount(value?: string, currency?: ZCurrency): ZCurrencyAmount | undefined {
  if (!value || !currency) {
    return undefined
  }
  try {
    const typedValueParsed = value
    if (typedValueParsed !== '0') {
      return currency instanceof ZToken
        ? new ZTokenAmount(currency, JSBI.BigInt(typedValueParsed))
        : ZCurrencyAmount.zil(JSBI.BigInt(typedValueParsed))
    }
  } catch (error) {
    // should fail if the user specifies too many decimal places of precision (or maybe exceed max uint?)
    console.debug(`Failed to parse input amount: "${value}"`, error)
  }
  // necessary for all paths to return a value
  return undefined
}

export function useSwapCurrencyInfo() {
  const {
    independentField,
    typedValue,
    [Field.INPUT]: { currencyId: inputCurrencyId },
    [Field.OUTPUT]: { currencyId: outputCurrencyId }
  } = useSwapState()
  let inputError = ''

  const { account } = useActiveWeb3React()
  const inputCurrency = useCurrency(inputCurrencyId)
  const outputCurrency = useCurrency(outputCurrencyId)

  const currencies: { [field in Field]?: ZCurrency } = {
    [Field.INPUT]: inputCurrency ?? undefined,
    [Field.OUTPUT]: outputCurrency ?? undefined
  }
  if (!currencies[Field.INPUT] || !currencies[Field.OUTPUT]) {
    inputError = inputError ?? 'Select a token'
  }

  const { balanceInQa, tokenBalance } = useZilliqaState()
  const inputIsZil = inputCurrencyId === 'ZIL'
  const tokenAddress = inputIsZil ? outputCurrencyId : inputCurrencyId
  const token = inputIsZil ? outputCurrency : inputCurrency
  const zilBalanceAmount = account ? ZCurrencyAmount.zil(balanceInQa[account]) : ZERO_AMOUNT
  const tokenBalanceNum =
    account && tokenAddress && tokenBalance[tokenAddress] ? tokenBalance[tokenAddress][account] : '0'
  const tokenBalanceAmount = token ? new ZTokenAmount(token as ZToken, tokenBalanceNum) : ZERO_AMOUNT

  const currencyBalances: { [field in Field]?: ZCurrencyAmount } = {
    [Field.INPUT]: tokenAddress === inputCurrencyId ? tokenBalanceAmount : zilBalanceAmount,
    [Field.OUTPUT]: tokenAddress === outputCurrencyId ? tokenBalanceAmount : zilBalanceAmount
  }

  const isExactIn: boolean = independentField === Field.INPUT
  const zilReserves = useZilReserves(tokenAddress)
  const tokenReserves = useTokenReserves(tokenAddress)
  const independentValue = typedValue === '' ? '0' : typedValue

  const inputReserve = inputIsZil ? zilReserves : tokenReserves
  const outputReserve = inputIsZil ? tokenReserves : zilReserves
  const owner = inputIsZil ? ROUTER_ADDRESS : account
  const userAllowances = useTokenAllowances(tokenAddress ?? '', owner ?? '', TOKEN_SWAP_ADDRESS)
  const enoughApprove = JSBI.lessThan(tokenReserves.raw, userAllowances)
  const pair = inputReserve && outputReserve ? new Pair(inputReserve, outputReserve) : undefined

  let inputAmount, outputAmount
  if (independentField === Field.INPUT) {
    inputAmount = token
      ? currencies[Field.INPUT] instanceof ZToken
        ? new ZTokenAmount(token as ZToken, JSBI.BigInt(toTokenQA(independentValue, token as ZToken)))
        : ZCurrencyAmount.zil(JSBI.BigInt(toQA(independentValue)))
      : ZERO_AMOUNT
    try {
      const [oa] = pair ? pair.getOutputAmount(inputAmount) : [ZERO_AMOUNT]
      outputAmount = oa
    } catch (e) {
      outputAmount = ZERO_AMOUNT
    }
  } else {
    outputAmount = token
      ? currencies[Field.OUTPUT] instanceof ZToken
        ? new ZTokenAmount(token as ZToken, JSBI.BigInt(toTokenQA(independentValue, token as ZToken)))
        : ZCurrencyAmount.zil(JSBI.BigInt(toQA(independentValue)))
      : ZERO_AMOUNT
    try {
      const [ia] = pair ? pair.getInputAmount(outputAmount) : [ZERO_AMOUNT]
      inputAmount = ia
    } catch (e) {
      inputAmount = ZERO_AMOUNT
    }
  }

  const [allowedSlippage] = useUserSlippageTolerance()
  const slippageAdjustedAmounts =
    inputAmount && outputAmount && computeSlippageAdjustedAmounts(allowedSlippage, isExactIn, inputAmount, outputAmount)

  return {
    currencies,
    currencyBalances,
    slippageAdjustedAmounts,
    inputAmount,
    outputAmount,
    enoughApprove,
    token,
    isExactIn,
    inputError
  }
}

const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/
function parseCurrencyFromURLParameter(urlParam: any): string {
  if (typeof urlParam === 'string') {
    if (ADDRESS_REGEX.test(urlParam)) return urlParam
    if (urlParam.toUpperCase() === 'ZIL') return 'ZIL'
  }
  return 'ZIL' ?? ''
}
function validatedRecipient(recipient: any): string | null {
  if (typeof recipient !== 'string') return null
  if (ADDRESS_REGEX.test(recipient)) return recipient
  return null
}
function parseTokenAmountURLParameter(urlParam: any): string {
  return typeof urlParam === 'string' && !isNaN(parseFloat(urlParam)) ? urlParam : ''
}
function parseIndependentFieldURLParameter(urlParam: any): Field {
  return typeof urlParam === 'string' && urlParam.toLowerCase() === 'output' ? Field.OUTPUT : Field.INPUT
}
export function queryParametersToSwapState(parsedQs: ParsedQs): SwapState {
  let inputCurrency = parseCurrencyFromURLParameter(parsedQs.inputCurrency)
  let outputCurrency = parseCurrencyFromURLParameter(parsedQs.outputCurrency)
  if (inputCurrency === outputCurrency) {
    if (typeof parsedQs.outputCurrency === 'string') {
      inputCurrency = ''
    } else {
      outputCurrency = ''
    }
  }

  const recipient = validatedRecipient(parsedQs.recipient)

  return {
    [Field.INPUT]: {
      currencyId: inputCurrency
    },
    [Field.OUTPUT]: {
      currencyId: outputCurrency
    },
    typedValue: parseTokenAmountURLParameter(parsedQs.exactAmount),
    independentField: parseIndependentFieldURLParameter(parsedQs.exactField),
    recipient
  }
}

// updates the swap state to use the defaults for a given network
export function useDefaultsFromURLSearch():
  | { inputCurrencyId: string | undefined; outputCurrencyId: string | undefined }
  | undefined {
  const chainId = CurrentChainId
  const dispatch = useDispatch<AppDispatch>()
  const parsedQs = useParsedQueryString()
  const [result, setResult] = useState<
    { inputCurrencyId: string | undefined; outputCurrencyId: string | undefined } | undefined
  >()

  useEffect(() => {
    if (!chainId) return
    const parsed = queryParametersToSwapState(parsedQs)

    dispatch(
      replaceSwapState({
        typedValue: parsed.typedValue,
        field: parsed.independentField,
        inputCurrencyId: parsed[Field.INPUT].currencyId,
        outputCurrencyId: parsed[Field.OUTPUT].currencyId,
        recipient: parsed.recipient
      })
    )

    setResult({ inputCurrencyId: parsed[Field.INPUT].currencyId, outputCurrencyId: parsed[Field.OUTPUT].currencyId })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, chainId])

  return result
}
