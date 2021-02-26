import { delay, put, select, takeLatest } from 'redux-saga/effects'
import { getAddressFromPrivateKey, getPubKeyFromPrivateKey } from '@zilliqa-js/crypto'
import * as consts from './actions'
import { Contract } from '@zilliqa-js/contract'
import zilpayConnector from '../../../zilliqa/zilpay'
import { MANAGER_ADDRESS, ROUTER_ADDRESS, TOKEN_CONVERT_ADDRESS, TOKEN_SWAP_ADDRESS } from '../../../zilliqa/constant'

// const VERSION = bytes.pack(CHAIN_ID, MSG_VERSION)

const getZilState = (state: any) => state.zilliqa.zil

export function* accessZilpayWalletSaga(): any {
  // debounce by 500ms
  yield delay(500)
  try {
    const [account] = yield zilpayConnector.activate()
    const address = account.base16

    yield put({
      type: consts.ACCESS_WALLET_SUCCEEDED,
      payload: { address, publicKey: '', privateKey: '' }
    })
  } catch (error) {
    console.log(error)
    yield put({ type: consts.ACCESS_WALLET_FAILED })
  }
}
export function* watchAccessZilpayWalletSaga() {
  yield takeLatest(consts.ACCESS_WALLET, accessZilpayWalletSaga)
}

export function* accessWalletSaga(action: any) {
  // debounce by 500ms
  yield delay(500)
  try {
    const { payload } = action
    const privateKey: string = payload.privateKey
    const address = getAddressFromPrivateKey(privateKey)
    const publicKey = getPubKeyFromPrivateKey(privateKey)

    const { zilliqa } = yield select(getZilState)
    zilliqa.wallet.addByPrivateKey(privateKey)

    yield put({
      type: consts.ACCESS_WALLET_SUCCEEDED,
      payload: {
        address,
        publicKey,
        privateKey
      }
    })
  } catch (error) {
    console.log(error)
    yield put({ type: consts.ACCESS_WALLET_FAILED })
  }
}
export function* watchAccessWalletSaga() {
  yield takeLatest(consts.ACCESS_WALLET, accessWalletSaga)
}

export function* accessWebWalletSaga(action: any) {
  // debounce by 500ms
  yield delay(500)
  try {
    const { payload } = action
    const address = payload.address

    yield put({
      type: consts.ACCESS_WEB_WALLET_SUCCEEDED,
      payload: {
        address
      }
    })
  } catch (error) {
    console.log(error)
    yield put({ type: consts.ACCESS_WEB_WALLET_FAILED })
  }
}
export function* watchAccessWebWalletSaga() {
  yield takeLatest(consts.ACCESS_WEB_WALLET, accessWebWalletSaga)
}

// function* callTransition(transition: string, toAddr: string, amount: number, params: any) {
//   const zilState = yield select(getZilState)
//   const { zilliqa, provider, privateKey, address, publicKey } = zilState
//
//   const response = yield zilliqa.blockchain.getMinimumGasPrice()
//   const minGasPriceInQa: string = response.result
//
//   const nonceResponse = yield zilliqa.blockchain.getBalance(address)
//   const nonceData = nonceResponse.result.nonce || { nonce: 0 }
//   const nonce: number = nonceData.nonce + 1
//
//   const wallet = zilliqa.wallet
//   wallet.addByPrivateKey(privateKey)
//
//   const txData = {
//     _tag: transition,
//     params
//   }
//
//   const tx = new Transaction(
//     {
//       version: VERSION,
//       toAddr,
//       amount: units.toQa(amount, units.Units.Zil),
//       gasPrice: new BN(minGasPriceInQa),
//       gasLimit: Long.fromNumber(10000),
//       pubKey: publicKey,
//       nonce,
//       data: JSON.stringify(txData)
//     },
//     provider,
//     TxStatus.Initialised,
//     true
//   )
//   const signedTx = yield wallet.sign(tx)
//   const { txParams } = signedTx
//
//   // Send a transaction to the network
//   const data = yield provider.send(RPCMethod.CreateTransaction, txParams)
//   if (data.error !== undefined) {
//     throw Error(data.error.message)
//   }
//
//   const id = data.result.TranID
//   console.log(data.result)
//   return id
// }
function* callTransitionByZilpay(transition: string, contractAddr: string, amount: string, params: any): any {
  const contracts = window.zilPay?.contracts
  const utils = window.zilPay?.utils

  const contract = contracts.at(contractAddr)
  const response = yield window.zilPay?.blockchain.getMinimumGasPrice()
  const minGasPriceInQa: string = response.result
  // const minGasPriceInZil: string = utils.units.fromQa(minGasPriceInQa, utils.units.Units.Zil)
  // const amountQA = units.toQa(amount, utils.units.Units.Zil)
  // const limitGasQa = utils.units.toQa(1, utils.units.Units.Zil)

  const tx = yield contract.call(transition, params, {
    amount: amount,
    gasPrice: minGasPriceInQa,
    gasLimit: utils.Long.fromNumber(50000)
  })

  const txid = tx.TranID
  console.log(txid)
  return txid
}
export function* createMarketSaga(action: any) {
  // debounce by 500ms
  yield delay(500)
  try {
    const { payload } = action
    const { tokenAddress } = payload
    const params = [
      {
        vname: 'token',
        type: 'ByStr20',
        value: tokenAddress
      }
    ]
    const createMarketId = yield* callTransitionByZilpay('CreateMarket', ROUTER_ADDRESS, '0', params)
    yield put({
      type: consts.CREATE_MARKET_SUCCEEDED,
      payload: { createMarketId }
    })
  } catch (error) {
    console.log(error)
    yield put({ type: consts.CREATE_MARKET_FAILED })
  }
}
export function* watchCreateMarketSaga() {
  yield takeLatest(consts.CREATE_MARKET, createMarketSaga)
}

export function* initRouterSaga(action: any) {
  // debounce by 500ms
  yield delay(500)
  try {
    const { payload } = action
    const { lmAddress, swapAddress, lptAddress, meAddress } = payload
    const params = [
      {
        vname: 'l_m_address',
        type: 'ByStr20',
        value: lmAddress
      },
      {
        vname: 'z_t_address',
        type: 'ByStr20',
        value: swapAddress
      },
      {
        vname: 't_z_address',
        type: 'ByStr20',
        value: swapAddress
      },
      {
        vname: 'l_p_address',
        type: 'ByStr20',
        value: lptAddress
      },
      {
        vname: 'm_e_address',
        type: 'ByStr20',
        value: meAddress
      }
    ]
    yield* callTransitionByZilpay('Initialize', ROUTER_ADDRESS, '0', params)
    yield put({ type: consts.INIT_ROUTER_SUCCEEDED })
  } catch (error) {
    console.log(error)
    yield put({ type: consts.INIT_ROUTER_FAILED })
  }
}
export function* watchInitRouterSaga() {
  yield takeLatest(consts.INIT_ROUTER, initRouterSaga)
}
export function* approveByTokenSaga(action: any, aux: string) {
  const { payload } = action
  const { tokenAddress, amount } = payload
  const params = [
    {
      vname: 'spender',
      type: 'ByStr20',
      value: `${aux}`
    },
    {
      vname: 'amount',
      type: 'Uint128',
      value: amount
    }
  ]
  return yield* callTransitionByZilpay('IncreaseAllowance', tokenAddress, '0', params)
}
export function* approveAuxSaga(action: any, aux: string) {
  const { payload } = action
  const { tokenAddress, amount } = payload
  const params = [
    {
      vname: 'token',
      type: 'ByStr20',
      value: tokenAddress
    },
    {
      vname: 'aux',
      type: 'ByStr20',
      value: `${aux}`
    },
    {
      vname: 'limit',
      type: 'Uint128',
      value: `${amount}`
    }
  ]
  const approveAuxId = yield* callTransitionByZilpay('ApproveAux', ROUTER_ADDRESS, '0', params)
  return approveAuxId
}

export function* approveAuxZTSaga(action: any) {
  // debounce by 500ms
  yield delay(500)
  try {
    const approveAuxZTId = yield* approveAuxSaga(action, TOKEN_SWAP_ADDRESS)
    yield put({
      type: consts.APPROVE_AUX_ZT_SUCCEEDED,
      payload: { approveAuxZTId }
    })
  } catch (error) {
    console.log(error)
    yield put({ type: consts.APPROVE_AUX_ZT_FAILED })
  }
}
export function* watchApproveAuxZTSaga() {
  yield takeLatest(consts.APPROVE_AUX_ZT, approveAuxZTSaga)
}

export function* approveAuxTZSaga(action: any) {
  // debounce by 500ms
  yield delay(500)
  try {
    const approveAuxTZId = yield* approveByTokenSaga(action, TOKEN_SWAP_ADDRESS)
    yield put({
      type: consts.APPROVE_AUX_TZ_SUCCEEDED,
      payload: { approveAuxTZId }
    })
  } catch (error) {
    console.log(error)
    yield put({ type: consts.APPROVE_AUX_TZ_FAILED })
  }
}
export function* watchApproveAuxTZSaga() {
  yield takeLatest(consts.APPROVE_AUX_TZ, approveAuxTZSaga)
}

export function* approveAuxLMSaga(action: any) {
  // debounce by 500ms
  yield delay(500)
  try {
    const { payload } = action
    const { fromRouter } = payload

    let approveAuxLMId = '0x0'
    if (fromRouter) {
      approveAuxLMId = yield* approveAuxSaga(action, MANAGER_ADDRESS)
    } else {
      approveAuxLMId = yield* approveByTokenSaga(action, MANAGER_ADDRESS)
    }
    yield put({
      type: consts.APPROVE_AUX_LM_SUCCEEDED,
      payload: { approveAuxLMId }
    })
  } catch (error) {
    console.log(error)
    yield put({ type: consts.APPROVE_AUX_LM_FAILED })
  }
}
export function* watchApproveAuxLMSaga() {
  yield takeLatest(consts.APPROVE_AUX_LM, approveAuxLMSaga)
}

export function* zilToTokenSwapSaga(action: any) {
  // debounce by 500ms
  yield delay(500)
  try {
    const { payload } = action
    const { tokenAddress, amount, minTokens } = payload
    const params = [
      {
        vname: 'token',
        type: 'ByStr20',
        value: tokenAddress
      },
      {
        vname: 'min_tokens',
        type: 'Uint128',
        value: minTokens
      },
      {
        vname: 'deadline',
        type: 'BNum',
        value: `${5e20}`
      }
    ]
    const zilToTokenSwapId = yield* callTransitionByZilpay('ZilToTokenSwapInput', ROUTER_ADDRESS, amount, params)
    yield put({
      type: consts.ZIL_TO_TOKEN_SWAP_SUCCEEDED,
      payload: { zilToTokenSwapId }
    })
  } catch (error) {
    console.log(error)
    yield put({ type: consts.ZIL_TO_TOKEN_SWAP_FAILED })
  }
}
export function* watchZilToTokenSwapSaga() {
  yield takeLatest(consts.ZIL_TO_TOKEN_SWAP, zilToTokenSwapSaga)
}

export function* zilToTokenSwapOutputSaga(action: any) {
  // debounce by 500ms
  yield delay(500)
  try {
    const { payload } = action
    const { tokenAddress, amount, tokensBought } = payload
    const params = [
      {
        vname: 'token',
        type: 'ByStr20',
        value: tokenAddress
      },
      {
        vname: 'tokens_bought',
        type: 'Uint128',
        value: tokensBought
      },
      {
        vname: 'deadline',
        type: 'BNum',
        value: `${5e20}`
      }
    ]
    const zilToTokenSwapId = yield* callTransitionByZilpay('ZilToTokenSwapOutput', ROUTER_ADDRESS, amount, params)
    yield put({
      type: consts.ZIL_TO_TOKEN_SWAP_OUTPUT_SUCCEEDED,
      payload: { zilToTokenSwapId }
    })
  } catch (error) {
    console.log(error)
    yield put({ type: consts.ZIL_TO_TOKEN_SWAP_OUTPUT_FAILED })
  }
}
export function* watchZilToTokenSwapOutputSaga() {
  yield takeLatest(consts.ZIL_TO_TOKEN_SWAP_OUTPUT, zilToTokenSwapOutputSaga)
}

export function* tokenToZilSwapSaga(action: any) {
  // debounce by 500ms
  yield delay(500)
  try {
    const { payload } = action
    const { tokenAddress, tokensSold, minZil } = payload
    const params = [
      {
        vname: 'token',
        type: 'ByStr20',
        value: tokenAddress
      },
      {
        vname: 'tokens_sold',
        type: 'Uint128',
        value: `${tokensSold}`
      },
      {
        vname: 'min_zil',
        type: 'Uint128',
        value: `${minZil}`
      },
      {
        vname: 'deadline',
        type: 'BNum',
        value: `${5e20}`
      }
    ]
    const tokenToZilSwapId = yield* callTransitionByZilpay('TokenToZilSwapInput', ROUTER_ADDRESS, '0', params)
    yield put({
      type: consts.TOKEN_TO_ZIL_SWAP_SUCCEEDED,
      payload: { tokenToZilSwapId }
    })
  } catch (error) {
    console.log(error)
    yield put({ type: consts.TOKEN_TO_ZIL_SWAP_FAILED })
  }
}
export function* watchTokenToZilSwapSaga() {
  yield takeLatest(consts.TOKEN_TO_ZIL_SWAP, tokenToZilSwapSaga)
}

export function* tokenToZilSwapOutputSaga(action: any) {
  // debounce by 500ms
  yield delay(500)
  try {
    const { payload } = action
    const { tokenAddress, maxToken, zilBought } = payload
    const params = [
      {
        vname: 'token',
        type: 'ByStr20',
        value: tokenAddress
      },
      {
        vname: 'zil_bought',
        type: 'Uint128',
        value: `${zilBought}`
      },
      {
        vname: 'max_tokens',
        type: 'Uint128',
        value: `${maxToken}`
      },
      {
        vname: 'deadline',
        type: 'BNum',
        value: `${5e20}`
      }
    ]
    const tokenToZilSwapId = yield* callTransitionByZilpay('TokenToZilSwapOutput', ROUTER_ADDRESS, '0', params)
    yield put({
      type: consts.TOKEN_TO_ZIL_SWAP_OUTPUT_SUCCEEDED,
      payload: { tokenToZilSwapId }
    })
  } catch (error) {
    console.log(error)
    yield put({ type: consts.TOKEN_TO_ZIL_SWAP_OUTPUT_FAILED })
  }
}
export function* watchTokenToZilSwapOutputSaga() {
  yield takeLatest(consts.TOKEN_TO_ZIL_SWAP_OUTPUT, tokenToZilSwapOutputSaga)
}

export function* authorizeAuxSaga(action: any, aux: string) {
  const { payload } = action
  const { tokenAddress, amount } = payload
  const params = [
    {
      vname: 'spender',
      type: 'ByStr20',
      value: `0x${aux}`
    },
    {
      vname: 'tokens',
      type: 'Uint128',
      value: `${amount}`
    }
  ]
  const authorizeAuxId = yield* callTransitionByZilpay('Approve', tokenAddress, '0', params)
  return authorizeAuxId
}

export function* authorizeTokenSaga(action: any) {
  // debounce by 500ms
  yield delay(500)
  try {
    const authorizeTokenId = yield* approveByTokenSaga(action, TOKEN_CONVERT_ADDRESS)
    yield put({
      type: consts.AUTHORIZE_TOKEN_SUCCEEDED,
      payload: { authorizeTokenId }
    })
  } catch (error) {
    console.log(error)
    yield put({ type: consts.AUTHORIZE_TOKEN_FAILED })
  }
}
export function* watchAuthorizeTokenToZilSaga() {
  yield takeLatest(consts.AUTHORIZE_TOKEN, authorizeTokenSaga)
}

export function* addLiquiditySaga(action: any) {
  // debounce by 500ms
  yield delay(500)
  try {
    const { payload } = action
    const { tokenAddress, amount, minLiquidity, maxTokens, deadline } = payload
    const params = [
      {
        vname: 'token',
        type: 'ByStr20',
        value: tokenAddress
      },
      {
        vname: 'min_liquidity',
        type: 'Uint128',
        value: `${minLiquidity}`
      },
      {
        vname: 'max_tokens',
        type: 'Uint128',
        value: maxTokens
      },
      {
        vname: 'deadline',
        type: 'BNum',
        value: `${deadline}`
      }
    ]
    const addLiquidityId = yield* callTransitionByZilpay('AddLiquidity', ROUTER_ADDRESS, amount, params)
    yield put({
      type: consts.ADD_LIQUIDITY_SUCCEEDED,
      payload: { addLiquidityId }
    })
  } catch (error) {
    console.log(error)
    yield put({ type: consts.ADD_LIQUIDITY_FAILED })
  }
}
export function* watchAddLiquiditySaga() {
  yield takeLatest(consts.ADD_LIQUIDITY, addLiquiditySaga)
}

export function* removeLiquiditySaga(action: any) {
  // debounce by 500ms
  yield delay(500)
  try {
    const { payload } = action
    const { tokenAddress, amount, minZil, minTokens, recipientAddress } = payload
    const params = [
      {
        vname: 'token',
        type: 'ByStr20',
        value: tokenAddress
      },
      {
        vname: 'amount',
        type: 'Uint128',
        value: amount
      },
      {
        vname: 'min_zil',
        type: 'Uint128',
        value: minZil
      },
      {
        vname: 'min_tokens',
        type: 'Uint128',
        value: minTokens
      },
      {
        vname: 'deadline',
        type: 'BNum',
        value: `${5e20}`
      },
      {
        vname: 'recipient',
        type: 'ByStr20',
        value: recipientAddress
      }
    ]
    const removeLiquidityId = yield* callTransitionByZilpay('RemoveLiquidity', ROUTER_ADDRESS, '0', params)
    yield put({
      type: consts.REMOVE_LIQUIDITY_SUCCEEDED,
      payload: { removeLiquidityId }
    })
  } catch (error) {
    console.log(error)
    yield put({ type: consts.REMOVE_LIQUIDITY_FAILED })
  }
}
export function* watchRemoveLiquiditySaga() {
  yield takeLatest(consts.REMOVE_LIQUIDITY, removeLiquiditySaga)
}

export function* authorizeLiquiditySaga(action: any) {
  // debounce by 500ms
  yield delay(500)
  try {
    const authorizeLiquidityId = yield* authorizeAuxSaga(action, MANAGER_ADDRESS)
    yield put({
      type: consts.AUTHORIZE_LIQUIDITY_SUCCEEDED,
      payload: { authorizeLiquidityId }
    })
  } catch (error) {
    console.log(error)
    yield put({ type: consts.AUTHORIZE_LIQUIDITY_FAILED })
  }
}
export function* watchAuthorizeLiquiditySaga() {
  yield takeLatest(consts.AUTHORIZE_LIQUIDITY, authorizeLiquiditySaga)
}

export function* getTokenContract(action: any) {
  // debounce by 500ms
  yield delay(500)
  try {
    const zilState = yield select(getZilState)
    const { zilliqa } = zilState
    const { payload } = action
    const { tokenAddress } = payload

    const contract: Contract = yield zilliqa.contracts.at(tokenAddress)
    const tokenContract = yield contract.getInit()

    yield put({
      type: consts.GET_TOKEN_CONTRACT_SUCCEEDED,
      payload: { tokenAddress, tokenContract }
    })
  } catch (error) {
    console.log(error)
    const { payload } = action
    const { tokenAddress } = payload
    yield put({ type: consts.GET_TOKEN_CONTRACT_FAILED, payload: { tokenAddress } })
  }
}
export function* watchGetTokenContractSaga() {
  yield takeLatest(consts.GET_TOKEN_CONTRACT, getTokenContract)
}
export function* getTokenContractState(action: any) {
  // debounce by 500ms
  yield delay(500)
  try {
    // const zilState = yield select(getZilState)
    // const { zilliqa } = zilState
    const { payload } = action
    const { tokenAddress } = payload

    const contract = yield window.zilPay?.contracts.at(tokenAddress)
    const tokenContractState = yield contract.getState()

    yield put({
      type: consts.GET_TOKEN_CONTRACT_STATE_SUCCEEDED,
      payload: { tokenContractState, tokenAddress }
    })
  } catch (error) {
    console.log(error)
    const { payload } = action
    const { tokenAddress } = payload
    yield put({ type: consts.GET_TOKEN_CONTRACT_STATE_FAILED, payload: { tokenAddress } })
  }
}
export function* watchGetTokenContractStateSaga() {
  yield takeLatest(consts.GET_TOKEN_CONTRACT_STATE, getTokenContractState)
}
export function* getTokenBalance(action: any) {
  // debounce by 500ms
  yield delay(500)
  try {
    const zilState = yield select(getZilState)
    const { zilliqa } = zilState
    const { payload } = action
    const { tokenAddress, address } = payload

    const resp = yield zilliqa.blockchain.getSmartContractState(tokenAddress)
    let tokenBalance = '0'
    if (resp.result) {
      tokenBalance = resp.result.balances[address.toLowerCase()]
    }

    yield put({
      type: consts.GET_TOKEN_BALANCE_SUCCEEDED,
      payload: { tokenBalance, tokenAddress, address }
    })
  } catch (error) {
    console.log(error)
    const { payload } = action
    const { tokenAddress, address } = payload
    yield put({ type: consts.GET_TOKEN_BALANCE_FAILED, payload: { tokenAddress, address } })
  }
}
export function* watchGetTokenBalanceSaga() {
  yield takeLatest(consts.GET_TOKEN_BALANCE, getTokenBalance)
}
export function* getBalance(action: any) {
  // debounce by 500ms
  yield delay(500)
  try {
    const zilState = yield select(getZilState)
    const { zilliqa } = zilState
    const { payload } = action
    const { address } = payload

    const response = yield zilliqa.blockchain.getBalance(address)
    let balanceInQa = '0'
    if (response.result) {
      balanceInQa = response.result.balance
    }

    yield put({
      type: consts.GET_BALANCE_SUCCEEDED,
      payload: { balanceInQa, address }
    })
  } catch (error) {
    console.log(error)
    const { payload } = action
    const { address } = payload
    yield put({ type: consts.GET_BALANCE_FAILED, payload: { address } })
  }
}
export function* watchGetBalanceSaga() {
  yield takeLatest(consts.GET_BALANCE, getBalance)
}

export function* getMinGasPrice(action: any) {
  // debounce by 500ms
  yield delay(500)
  try {
    const zilState = yield select(getZilState)
    const { zilliqa } = zilState

    const response = yield zilliqa.blockchain.getMinimumGasPrice()
    const minGasPriceInQa: string = response.result
    yield put({
      type: consts.GET_MIN_GAS_PRICE_SUCCEEDED,
      payload: { minGasPriceInQa }
    })
  } catch (error) {
    console.log(error)
    yield put({ type: consts.GET_MIN_GAS_PRICE_FAILED })
  }
}
export function* watchGetMinGasPriceSaga() {
  yield takeLatest(consts.GET_MIN_GAS_PRICE, getMinGasPrice)
}
