import { AbstractConnector, AccountInfo, ConnectorArguments, NoZilliqaProviderError } from './connector'

export class ZInjectedConnector implements AbstractConnector {
  public readonly supportedChainIds?: number[]

  constructor({ supportedChainIds }: ConnectorArguments = {}) {
    this.supportedChainIds = supportedChainIds
  }

  public async activate(): Promise<any> {
    if (!window.zilPay) {
      throw new NoZilliqaProviderError()
    }
    // let account
    await window.zilPay.wallet.connect()
    // if (isConnect) {
    //   account = window.zilPay?.wallet.defaultAccount
    // } else {
    //   throw new UserRejectedRequestError()
    // }
    //
    // return [isConnect, account]
  }

  public getProvider(): any {
    return window.zilPay
  }

  public async getChainId(): Promise<number | string> {
    if (!window.zilPay) {
      throw new NoZilliqaProviderError()
    }

    return 2
  }

  public getAccount(): AccountInfo {
    if (!window.zilPay) {
      throw new NoZilliqaProviderError()
    }

    return window.zilPay?.wallet.defaultAccount
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public deactivate() {}

  public isAuthorized(): boolean {
    if (!window.zilPay) {
      return false
    }
    return window.zilPay?.wallet.isEnable
  }

  public getNetwork(): string {
    return window.zilPay?.wallet.net
  }
}
const zilpayConnector = new ZInjectedConnector({ supportedChainIds: [1, 2] })
export default zilpayConnector
