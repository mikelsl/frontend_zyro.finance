import zilpayConnector from './zilpay'
// import { EventEmitter } from 'events'

export interface AccountInfo {
  base16: string
  bech32: string
}

export interface ConnectorArguments {
  supportedChainIds?: number[]
}

export interface WalletContext {
  account: any
}

export class NoZilliqaProviderError extends Error {
  public constructor() {
    super()
    this.name = this.constructor.name
    this.message = 'No Zilliqa provider was found on window.zilpay.'
  }
}

export class UserRejectedRequestError extends Error {
  public constructor() {
    super()
    this.name = this.constructor.name
    this.message = 'The user rejected the request.'
  }
}

export interface AbstractConnector {
  readonly supportedChainIds?: number[]
  activate(): Promise<[boolean, any]>
  getProvider(): Promise<any>
  getChainId(): Promise<number | string>
  getAccount(): AccountInfo
  deactivate(): void
  // emitUpdate(update: any): void
  // emitError(error: Error): void
  // emitDeactivate(): void
}

export function useZilpayWallet(): AccountInfo | null {
  // const { setUserAddress } = useWalletActions()
  //
  // useEffect(() => {
  //   setUserAddress(zilpayConnector.getAccount()?.base16)
  // }, [])

  if (zilpayConnector.isAuthorized()) {
    return zilpayConnector.getAccount()
  }
  return null
}
