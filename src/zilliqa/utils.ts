import JSBI from 'jsbi'
import invariant from 'tiny-invariant'
import { Fraction } from './fraction'
import { Percent } from './percent'
import { ZCurrency, ZCurrencyAmount, ZIL, ZToken, ZTokenAmount } from './ztoken'
import { Field } from '../state/swap/actions'
import * as utils from '@zilliqa-js/util'
import { MIN_ZIL, ONE, THREE, TradeType, TWO, ZERO } from './constant'
import BN from 'bn.js'

export function maxAmountSpend(currencyAmount?: ZCurrencyAmount): ZCurrencyAmount | undefined {
  if (!currencyAmount) return undefined
  if (currencyAmount.currency === ZIL) {
    if (JSBI.greaterThan(currencyAmount.raw, MIN_ZIL)) {
      return ZCurrencyAmount.zil(JSBI.subtract(currencyAmount.raw, MIN_ZIL))
    } else {
      return ZCurrencyAmount.zil(JSBI.BigInt(0))
    }
  }
  return currencyAmount
}

export function minimumAmountOut(
  outputAmount: ZCurrencyAmount,
  slippageTolerance: Percent,
  tradeType: number
): ZCurrencyAmount {
  invariant(!slippageTolerance.lessThan(ZERO), 'SLIPPAGE_TOLERANCE')
  if (tradeType === TradeType.EXACT_OUTPUT) {
    return outputAmount
  } else {
    const slippageAdjustedAmountOut = new Fraction(ONE)
      .add(slippageTolerance)
      .invert()
      .multiply(outputAmount.raw).quotient
    return outputAmount instanceof ZTokenAmount
      ? new ZTokenAmount(outputAmount.token, slippageAdjustedAmountOut)
      : ZCurrencyAmount.zil(slippageAdjustedAmountOut)
  }
}

export function maximumAmountIn(
  inputAmount: ZCurrencyAmount,
  slippageTolerance: Percent,
  tradeType: number
): ZCurrencyAmount {
  invariant(!slippageTolerance.lessThan(ZERO), 'SLIPPAGE_TOLERANCE')
  if (tradeType === TradeType.EXACT_INPUT) {
    return inputAmount
  } else {
    const slippageAdjustedAmountIn = new Fraction(ONE).add(slippageTolerance).multiply(inputAmount.raw).quotient
    return inputAmount instanceof ZTokenAmount
      ? new ZTokenAmount(inputAmount.token, slippageAdjustedAmountIn)
      : ZCurrencyAmount.zil(slippageAdjustedAmountIn)
  }
}

export function currencyId(currency: ZCurrency): string {
  if (currency === ZIL) return 'ZIL'
  if (currency instanceof ZToken) return currency.address
  throw new Error('invalid currency')
}

// mock the on-chain sqrt function
export function sqrt(y: JSBI): JSBI {
  let z: JSBI = ZERO
  let x: JSBI
  if (JSBI.greaterThan(y, THREE)) {
    z = y
    x = JSBI.add(JSBI.divide(y, TWO), ONE)
    while (JSBI.lessThan(x, z)) {
      z = x
      x = JSBI.divide(JSBI.add(JSBI.divide(y, x), x), TWO)
    }
  } else if (JSBI.notEqual(y, ZERO)) {
    z = ONE
  }
  return z
}

// converts a basis points value to a sdk percent
export function basisPointsToPercent(num: number): Percent {
  return new Percent(JSBI.BigInt(num), JSBI.BigInt(10000))
}

export function computeSlippageAdjustedAmounts(
  allowedSlippage: number,
  isExactIn: boolean,
  inputAmount: ZCurrencyAmount,
  outputAmount: ZCurrencyAmount
): { [field in Field]?: ZCurrencyAmount } {
  const pct = basisPointsToPercent(allowedSlippage)
  const tradeType = isExactIn ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT
  return {
    [Field.INPUT]: maximumAmountIn(inputAmount, pct, tradeType),
    [Field.OUTPUT]: minimumAmountOut(outputAmount, pct, tradeType)
  }
}

export function isAddress(address: string): boolean {
  return utils.validation.isAddress(address)
}

export function shortenAddress(address: string, chars = 4): string {
  const parsed = isAddress(address)
  if (!parsed) {
    throw Error(`Invalid 'address' parameter '${address}'.`)
  }
  return `${address.substring(0, chars + 2)}...${address.substring(40 - chars)}`
}

export function toQA(amount: string | number | utils.BN) {
  return utils.units.toQa(amount, utils.units.Units.Zil)
}

const numToStr = (input: string | number | BN) => {
  if (typeof input === 'string') {
    if (!input.match(/^-?[0-9.]+$/)) {
      throw new Error(
        `while converting number to string, invalid number value '${input}', should be a number matching (^-?[0-9.]+).`
      )
    }
    return input
  } else if (typeof input === 'number') {
    return String(input)
  } else if (BN.isBN(input)) {
    return input.toString(10)
  }

  throw new Error(`while converting number to string, invalid number value '${input}' type ${typeof input}.`)
}

export const toTokenQA = (input: string | number | BN, token: ZToken) => {
  let inputStr = numToStr(input)
  const baseStr = '1' + '0'.repeat(token.decimals)

  if (!baseStr) {
    throw new Error(`No unit of token ${token.symbol} exists.`)
  }

  const baseNumDecimals = baseStr.length - 1
  const base = new BN(baseStr, 10)

  // Is it negative?
  const isNegative = inputStr.substring(0, 1) === '-'
  if (isNegative) {
    inputStr = inputStr.substring(1)
  }

  if (inputStr === '.') {
    throw new Error(`Cannot convert ${inputStr} to Qa.`)
  }

  // Split it into a whole and fractional part
    const comps = inputStr.split('.'); // eslint-disable-line
  if (comps.length > 2) {
    throw new Error(`Cannot convert ${inputStr} to Qa.`)
  }

  let [whole, fraction] = comps

  if (!whole) {
    whole = '0'
  }
  if (!fraction) {
    fraction = '0'
  }
  if (fraction.length > baseNumDecimals) {
    throw new Error(`Cannot convert ${inputStr} to Qa.`)
  }

  while (fraction.length < baseNumDecimals) {
    fraction += '0'
  }

  const wholeBN = new BN(whole)
  const fractionBN = new BN(fraction)
    let wei = wholeBN.mul(base).add(fractionBN); // eslint-disable-line

  if (isNegative) {
    wei = wei.neg()
  }

  return new BN(wei.toString(10), 10)
}

export function getViewBlockIOTXLink(hash: string, network: string): string {
  return 'https://viewblock.io/zilliqa/tx/' + hash + '?network=' + network
}
