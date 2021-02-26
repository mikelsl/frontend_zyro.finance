import { AppDispatch } from '../index'
import { useDispatch } from 'react-redux'
import * as zilActions from '../zilliqa/zil/actions'
import {ZLPT} from "../../zilliqa";
import {CurrentChainId} from "../../zilliqa/constant";

export function useHeaderActions() {
  const dispatch = useDispatch<AppDispatch>()
  return {
    getBalance: (address: string) => dispatch(zilActions.getBalance(address)),
    getZLPTBalance: (address: string) => dispatch(zilActions.getTokenBalance(ZLPT[CurrentChainId].address, address))
  }
}
