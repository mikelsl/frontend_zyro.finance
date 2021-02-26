import { useMemo } from 'react'
import { ZLPT } from './index'
import { Contract } from '@zilliqa-js/contract'
import { Zilliqa } from '@zilliqa-js/zilliqa'
import { CurrentChainId, GOVERNANCE_ADDRESS, NetworkProvider } from './constant'

const zilliqa = new Zilliqa(NetworkProvider[CurrentChainId])
const chainId = CurrentChainId
export function getContract(address: string): Contract {
  return zilliqa.contracts.at(address)
}

// returns null on errors
function useContract(address: string | undefined): Contract | null {
  return useMemo(() => {
    if (!address) return null
    try {
      return getContract(address)
    } catch (error) {
      console.error('Failed to get contract', error)
      return null
    }
  }, [address])
}

export function usePairContract(pairAddress?: string): Contract | null {
  return useContract(pairAddress)
}

export function useTokenContract(tokenAddress?: string): Contract | null {
  return useContract(tokenAddress)
}

export function useGovernanceContract(): Contract | null {
  return useContract(GOVERNANCE_ADDRESS)
}

export function useZlptContract(): Contract | null {
  return useContract(ZLPT[chainId].address)
}

export function useStakingContract(stakingAddress?: string): Contract | null {
  return useContract(stakingAddress)
}
