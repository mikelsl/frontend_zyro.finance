import invariant from 'tiny-invariant'
import JSBI from 'jsbi'
import { currencyEquals, ZCurrency, ZCurrencyAmount, ZToken, ZTokenAmount } from './ztoken'
import { BigintIsh, Rounding, TEN } from './constant'
import { Fraction } from './fraction'

export class Price extends Fraction {
  public readonly baseCurrency: ZCurrency // input i.e. denominator
  public readonly quoteCurrency: ZCurrency // output i.e. numerator
  public readonly scalar: Fraction // used to adjust the raw fraction w/r/t the decimals of the {base,quote}Token

  // public static fromRoute(route: Route): Price {
  //   const prices: Price[] = []
  //   for (const [i, pair] of route.pairs.entries()) {
  //     prices.push(
  //       route.path[i].equals(pair.token0)
  //         ? new Price(pair.reserve0.currency, pair.reserve1.currency, pair.reserve0.raw, pair.reserve1.raw)
  //         : new Price(pair.reserve1.currency, pair.reserve0.currency, pair.reserve1.raw, pair.reserve0.raw)
  //     )
  //   }
  //   return prices.slice(1).reduce((accumulator, currentValue) => accumulator.multiply(currentValue), prices[0])
  // }

  // denominator and numerator _must_ be raw, i.e. in the native representation
  public constructor(baseCurrency: ZCurrency, quoteCurrency: ZCurrency, denominator: BigintIsh, numerator: BigintIsh) {
    super(numerator, denominator)

    this.baseCurrency = baseCurrency
    this.quoteCurrency = quoteCurrency
    // const fixDecimals =
    //   baseCurrency?.decimals && quoteCurrency?.decimals
    //     ? quoteCurrency?.decimals > baseCurrency?.decimals
    //       ? quoteCurrency?.decimals
    //       : baseCurrency?.decimals
    //     : '0'
    this.scalar = new Fraction(
      // JSBI.exponentiate(TEN, JSBI.BigInt(fixDecimals)),
      // JSBI.exponentiate(TEN, JSBI.BigInt(fixDecimals))
      JSBI.exponentiate(TEN, JSBI.BigInt(baseCurrency?.decimals ?? '0')),
      JSBI.exponentiate(TEN, JSBI.BigInt(quoteCurrency?.decimals ?? '0'))
    )
  }

  public get raw(): Fraction {
    return new Fraction(this.numerator, this.denominator)
  }

  public get adjusted(): Fraction {
    return super.multiply(this.scalar)
  }

  public invert(): Price {
    return new Price(this.quoteCurrency, this.baseCurrency, this.numerator, this.denominator)
  }

  public multiply(other: Price): Price {
    invariant(currencyEquals(this.quoteCurrency, other.baseCurrency), 'TOKEN')
    const fraction = super.multiply(other)
    return new Price(this.baseCurrency, other.quoteCurrency, fraction.denominator, fraction.numerator)
  }

  // performs floor division on overflow
  public quote(currencyAmount: ZCurrencyAmount): ZCurrencyAmount {
    invariant(currencyEquals(currencyAmount.currency, this.baseCurrency), 'TOKEN')
    if (this.quoteCurrency instanceof ZToken) {
      return new ZTokenAmount(this.quoteCurrency, super.multiply(currencyAmount.raw).quotient)
    }
    return ZCurrencyAmount.zil(super.multiply(currencyAmount.raw).quotient)
  }

  public toSignificant(significantDigits = 6, format?: object, rounding?: Rounding): string {
    // return this.adjusted.toSignificant(significantDigits, format, rounding)
    return this.adjusted.toSignificant(significantDigits, format, rounding)
  }

  public toFixed(decimalPlaces = 4, format?: object, rounding?: Rounding): string {
    return this.adjusted.toFixed(decimalPlaces, format, rounding)
  }
}
