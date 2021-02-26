import invariant from 'tiny-invariant'
import JSBI from 'jsbi'

import {
  ZERO,
  ONE,
  FIVE,
  _997,
  _1000,
  MINIMUM_LIQUIDITY,
  ZChainId,
  BigintIsh,
  CurrentChainId,
  ROUTER_ADDRESS,
  parseBigintIsh,
  THREE
} from './constant'
import { sqrt } from './utils'
import { InsufficientReservesError, InsufficientInputAmountError } from './errors'
import { currencyEquals, ZCurrency, ZCurrencyAmount, ZIL, ZToken, ZTokenAmount } from './ztoken'
import { ZLPT } from './index'
import { Price } from './price'

export class Pair {
  public readonly liquidityToken: ZToken
  private readonly tokenAmounts: [ZCurrencyAmount, ZCurrencyAmount]

  public static getAddress(): string {
    return ROUTER_ADDRESS
  }

  public constructor(tokenAmountA: ZCurrencyAmount, tokenAmountB: ZCurrencyAmount) {
    const tokenAmounts = [tokenAmountA, tokenAmountB]
    this.liquidityToken = ZLPT[this.chainId]
    this.tokenAmounts = tokenAmounts as [ZCurrencyAmount, ZCurrencyAmount]
  }

  /**
   * Returns true if the token is either token0 or token1
   * @param token to check
   */
  public involvesToken(token: ZCurrency): boolean {
    return currencyEquals(token, this.token0) || currencyEquals(token, this.token1)
  }

  /**
   * Returns the current mid price of the pair in terms of token0, i.e. the ratio of reserve1 to reserve0
   */
  public get token0Price(): Price {
    return new Price(this.token0, this.token1, this.tokenAmounts[0].raw, this.tokenAmounts[1].raw)
  }

  /**
   * Returns the current mid price of the pair in terms of token1, i.e. the ratio of reserve0 to reserve1
   */
  public get token1Price(): Price {
    return new Price(this.token1, this.token0, this.tokenAmounts[1].raw, this.tokenAmounts[0].raw)
  }

  /**
   * Return the price of the given token in terms of the other token in the pair.
   * @param token token to return price of
   */
  public priceOf(token: ZCurrency): Price {
    invariant(this.involvesToken(token), 'TOKEN')
    return currencyEquals(token, this.token0) ? this.token0Price : this.token1Price
  }

  /**
   * Returns the chain ID of the tokens in the pair.
   */
  public get chainId(): ZChainId {
    return CurrentChainId
  }

  public get token0(): ZCurrency {
    return this.tokenAmounts[0].currency
  }

  public get token1(): ZCurrency {
    return this.tokenAmounts[1].currency
  }

  public get reserve0(): ZCurrencyAmount {
    return this.tokenAmounts[0]
  }

  public get reserve1(): ZCurrencyAmount {
    return this.tokenAmounts[1]
  }

  public reserveOf(token: ZCurrency): ZCurrencyAmount {
    invariant(this.involvesToken(token), 'TOKEN')
    return currencyEquals(token, this.token0) ? this.reserve0 : this.reserve1
  }

  public getLiquidityOutputAmount(inputAmount: ZCurrencyAmount): [ZCurrencyAmount, Pair] {
    invariant(this.involvesToken(inputAmount.currency), 'TOKEN')
    if (JSBI.equal(this.reserve0.raw, ZERO) || JSBI.equal(this.reserve1.raw, ZERO)) {
      throw new InsufficientReservesError()
    }
    const inputReserve = this.reserveOf(inputAmount.currency)
    const outputReserve = this.reserveOf(currencyEquals(inputAmount.currency, this.token0) ? this.token1 : this.token0)
    const numerator = JSBI.multiply(inputAmount.raw, outputReserve.raw)
    const denominator = inputReserve.raw
    const outputAmount =
      inputAmount.currency === ZIL
        ? new ZTokenAmount(
            currencyEquals(inputAmount.currency, this.token0) ? (this.token1 as ZToken) : (this.token0 as ZToken),
            JSBI.add(JSBI.divide(numerator, denominator), THREE)
          )
        : ZCurrencyAmount.zil(JSBI.divide(numerator, denominator))
    if (JSBI.equal(outputAmount.raw, ZERO)) {
      throw new InsufficientInputAmountError()
    }
    return [outputAmount, new Pair(inputReserve.add(inputAmount), outputReserve.subtract(outputAmount))]
  }

  public getOutputAmount(inputAmount: ZCurrencyAmount): [ZCurrencyAmount, Pair] {
    invariant(this.involvesToken(inputAmount.currency), 'TOKEN')
    if (JSBI.equal(this.reserve0.raw, ZERO) || JSBI.equal(this.reserve1.raw, ZERO)) {
      throw new InsufficientReservesError()
    }
    const inputReserve = this.reserveOf(inputAmount.currency)
    const outputReserve = this.reserveOf(currencyEquals(inputAmount.currency, this.token0) ? this.token1 : this.token0)
    const inputAmountWithFee = JSBI.multiply(inputAmount.raw, _997)
    const numerator = JSBI.multiply(inputAmountWithFee, outputReserve.raw)
    const denominator = JSBI.add(JSBI.multiply(inputReserve.raw, _1000), inputAmountWithFee)
    const outputAmount =
      inputAmount.currency === ZIL
        ? new ZTokenAmount(
            currencyEquals(inputAmount.currency, this.token0) ? (this.token1 as ZToken) : (this.token0 as ZToken),
            JSBI.divide(numerator, denominator)
          )
        : ZCurrencyAmount.zil(JSBI.divide(numerator, denominator))
    if (JSBI.equal(outputAmount.raw, ZERO)) {
      throw new InsufficientInputAmountError()
    }
    return [outputAmount, new Pair(inputReserve.add(inputAmount), outputReserve.subtract(outputAmount))]
  }

  public getInputAmount(outputAmount: ZCurrencyAmount): [ZCurrencyAmount, Pair] {
    invariant(this.involvesToken(outputAmount.currency), 'TOKEN')
    if (
      JSBI.equal(this.reserve0.raw, ZERO) ||
      JSBI.equal(this.reserve1.raw, ZERO) ||
      JSBI.greaterThanOrEqual(outputAmount.raw, this.reserveOf(outputAmount.currency).raw)
    ) {
      throw new InsufficientReservesError()
    }

    const outputReserve = this.reserveOf(outputAmount.currency)
    const inputReserve = this.reserveOf(currencyEquals(outputAmount.currency, this.token0) ? this.token1 : this.token0)
    const numerator = JSBI.multiply(JSBI.multiply(inputReserve.raw, outputAmount.raw), _1000)
    const denominator = JSBI.multiply(JSBI.subtract(outputReserve.raw, outputAmount.raw), _997)
    const inputAmount =
      outputAmount.currency === ZIL
        ? new ZTokenAmount(
            currencyEquals(outputAmount.currency, this.token0) ? (this.token1 as ZToken) : (this.token0 as ZToken),
            JSBI.add(JSBI.divide(numerator, denominator), ONE)
          )
        : ZCurrencyAmount.zil(JSBI.add(JSBI.divide(numerator, denominator), ONE))
    return [inputAmount, new Pair(inputReserve.add(inputAmount), outputReserve.subtract(outputAmount))]
  }

  public getLiquidityMinted(
    totalSupply: ZTokenAmount,
    tokenAmountA: ZCurrencyAmount,
    tokenAmountB: ZCurrencyAmount
  ): ZTokenAmount {
    invariant(totalSupply.token.equals(this.liquidityToken), 'LIQUIDITY')
    const tokenAmounts = [tokenAmountA, tokenAmountB]
    // invariant(tokenAmounts[0].currency.equals(this.token0) && tokenAmounts[1].token.equals(this.token1), 'TOKEN')

    let liquidity: JSBI
    if (JSBI.equal(totalSupply.raw, ZERO)) {
      liquidity = JSBI.subtract(sqrt(JSBI.multiply(tokenAmounts[0].raw, tokenAmounts[1].raw)), MINIMUM_LIQUIDITY)
    } else {
      const amount0 = JSBI.divide(JSBI.multiply(tokenAmounts[0].raw, totalSupply.raw), this.reserve0.raw)
      const amount1 = JSBI.divide(JSBI.multiply(tokenAmounts[1].raw, totalSupply.raw), this.reserve1.raw)
      liquidity = JSBI.lessThanOrEqual(amount0, amount1) ? amount0 : amount1
    }
    if (!JSBI.greaterThan(liquidity, ZERO)) {
      throw new InsufficientInputAmountError()
    }
    return new ZTokenAmount(this.liquidityToken, liquidity)
  }

  public getLiquidityValue(
    token: ZCurrency,
    totalSupply: ZTokenAmount,
    liquidity: ZTokenAmount,
    feeOn = false,
    kLast?: BigintIsh
  ): ZCurrencyAmount {
    invariant(this.involvesToken(token), 'TOKEN')
    invariant(totalSupply.token.equals(this.liquidityToken), 'TOTAL_SUPPLY')
    invariant(liquidity.token.equals(this.liquidityToken), 'LIQUIDITY')
    invariant(JSBI.lessThanOrEqual(liquidity.raw, totalSupply.raw), 'LIQUIDITY')

    let totalSupplyAdjusted: ZTokenAmount
    if (!feeOn) {
      totalSupplyAdjusted = totalSupply
    } else {
      invariant(!!kLast, 'K_LAST')
      const kLastParsed = parseBigintIsh(kLast)
      if (!JSBI.equal(kLastParsed, ZERO)) {
        const rootK = sqrt(JSBI.multiply(this.reserve0.raw, this.reserve1.raw))
        const rootKLast = sqrt(kLastParsed)
        if (JSBI.greaterThan(rootK, rootKLast)) {
          const numerator = JSBI.multiply(totalSupply.raw, JSBI.subtract(rootK, rootKLast))
          const denominator = JSBI.add(JSBI.multiply(rootK, FIVE), rootKLast)
          const feeLiquidity = JSBI.divide(numerator, denominator)
          totalSupplyAdjusted = totalSupply.add(new ZTokenAmount(this.liquidityToken, feeLiquidity))
        } else {
          totalSupplyAdjusted = totalSupply
        }
      } else {
        totalSupplyAdjusted = totalSupply
      }
    }

    return token === ZIL
      ? ZCurrencyAmount.zil(
          JSBI.divide(JSBI.multiply(liquidity.raw, this.reserveOf(token).raw), totalSupplyAdjusted.raw)
        )
      : new ZTokenAmount(
          token as ZToken,
          JSBI.divide(JSBI.multiply(liquidity.raw, this.reserveOf(token).raw), totalSupplyAdjusted.raw)
        )
  }
}
