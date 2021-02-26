import { ChainId } from '@uniswap/sdk'
import { useWeb3React as useWeb3ReactCore } from '@web3-react/core'
import { useEffect, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { injected } from '../connectors'
import zilpayConnector from '../zilliqa/zilpay'
import {CHAIN_ID} from '../zilliqa'
import { AbstractConnector, useZilpayWallet } from '../zilliqa/connector'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '../state'
import * as zilActions from '../state/zilliqa/zil/actions'
import {Zilliqa} from "@zilliqa-js/zilliqa";
import {CurrentChainId, NetworkProvider} from "../zilliqa/constant";

const zilliqa = new Zilliqa(NetworkProvider[CurrentChainId])

export interface Web3ReactContextInterface<T = any> {
  connector?: AbstractConnector
  library?: T
  chainId?: number
  account?: null | string
  active: boolean
  error?: Error
}
export function useActiveWeb3React(): Web3ReactContextInterface<any> & { chainId?: ChainId } {
  const address = useZilpayWallet()?.base16
  return {
    connector: zilpayConnector,
    library: zilliqa,
    chainId: CHAIN_ID,
    account: address,
    active: true
  }
}
export function useEagerConnect() {
  const { activate, active } = useWeb3ReactCore() // specifically using useWeb3ReactCore because of what this hook does
  const [tried, setTried] = useState(false)

  useEffect(() => {
    injected.isAuthorized().then(isAuthorized => {
      if (isAuthorized) {
        activate(injected, undefined, true).catch(() => {
          setTried(true)
        })
      } else {
        if (isMobile && window.ethereum) {
          activate(injected, undefined, true).catch(() => {
            setTried(true)
          })
        } else {
          setTried(true)
        }
      }
    })
  }, [activate]) // intentionally only running on mount (make sure it's only mounted once :))

  // if the connection worked, wait until we get confirmation of that to flip the flag
  useEffect(() => {
    if (active) {
      setTried(true)
    }
  }, [active])

  return tried
}

/**
 * Use for network and injected - logs user in
 * and out after checking what network theyre on
 */
export function useInactiveListener(suppress = false) {
  const { active, error, activate } = useWeb3ReactCore() // specifically using useWeb3React because of what this hook does

  useEffect(() => {
    const { ethereum } = window

    if (ethereum && ethereum.on && !active && !error && !suppress) {
      const handleChainChanged = () => {
        // eat errors
        activate(injected, undefined, true).catch(error => {
          console.error('Failed to activate after chain changed', error)
        })
      }

      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          // eat errors
          activate(injected, undefined, true).catch(error => {
            console.error('Failed to activate after accounts changed', error)
          })
        }
      }

      ethereum.on('chainChanged', handleChainChanged)
      ethereum.on('accountsChanged', handleAccountsChanged)

      return () => {
        if (ethereum.removeListener) {
          ethereum.removeListener('chainChanged', handleChainChanged)
          ethereum.removeListener('accountsChanged', handleAccountsChanged)
        }
      }
    }
    return undefined
  }, [active, error, suppress, activate])
}

export function useZilliqaConnect() {
  const { activate, active } = useWeb3ReactCore() // specifically using useWeb3ReactCore because of what this hook does
  const [tried, setTried] = useState(false)

  useEffect(() => {
    injected.isAuthorized().then(isAuthorized => {
      if (isAuthorized) {
        activate(injected, undefined, true).catch(() => {
          setTried(true)
        })
      } else {
        if (isMobile && window.ethereum) {
          activate(injected, undefined, true).catch(() => {
            setTried(true)
          })
        } else {
          setTried(true)
        }
      }
    })
  }, [activate]) // intentionally only running on mount (make sure it's only mounted once :))

  // if the connection worked, wait until we get confirmation of that to flip the flag
  useEffect(() => {
    if (active) {
      setTried(true)
    }
  }, [active])

  return tried
}

export function useWalletActions() {
  const dispatch = useDispatch<AppDispatch>()
  return {
    setUserAddress: (address: string) => dispatch(zilActions.accessWebWallet(address))
  }
}
