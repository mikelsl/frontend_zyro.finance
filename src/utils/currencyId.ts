import {ZCurrency, ZIL, ZToken} from "../zilliqa/ztoken";

export function currencyId(currency: ZCurrency): string {
  if (currency === ZIL) return 'ZIL'
  if (currency instanceof ZToken) return currency.address
  throw new Error('invalid currency')
}
