/**
 * This file is part of zdex-app.
 * Copyright (c) 2018 - present Timelock, LLC
 *
 * zdex-app is free software: you can redistribute it and/or modify it under the
 * terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option) any later
 * version.
 *
 * zdex-app is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE.  See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * zdex-app.  If not, see <http://www.gnu.org/licenses/>.
 */

export const ACCESS_WALLET = 'ACCESS_WALLET'
export const ACCESS_WALLET_SUCCEEDED = 'ACCESS_WALLET_SUCCEEDED'
export const ACCESS_WALLET_FAILED = 'ACCESS_WALLET_FAILED'
export const accessWallet = (privateKey: string) => ({
  type: ACCESS_WALLET,
  payload: { privateKey }
})

export const ACCESS_WEB_WALLET = 'ACCESS_WEB_WALLET'
export const ACCESS_WEB_WALLET_SUCCEEDED = 'ACCESS_WEB_WALLET_SUCCEEDED'
export const ACCESS_WEB_WALLET_FAILED = 'ACCESS_WEB_WALLET_FAILED'
export const accessWebWallet = (address: string) => ({
  type: ACCESS_WEB_WALLET,
  payload: { address }
})

export const CLEAR = 'CLEAR'
export const clear = () => ({
  type: CLEAR
})

export const CREATE_MARKET = 'CREATE_MARKET'
export const CREATE_MARKET_SUCCEEDED = 'CREATE_MARKET_SUCCEEDED'
export const CREATE_MARKET_FAILED = 'CREATE_MARKET_FAILED'
export const createMarket = (tokenAddress: string) => ({
  type: CREATE_MARKET,
  payload: { tokenAddress }
})

export const INIT_ROUTER = 'INIT_ROUTER'
export const INIT_ROUTER_SUCCEEDED = 'INIT_ROUTER_SUCCEEDED'
export const INIT_ROUTER_FAILED = 'INIT_ROUTER_FAILED'
export const initRouter = (lmAddress: string, swapAddress: string, lptAddress: string, meAddress: string) => ({
  type: INIT_ROUTER,
  payload: { lmAddress, swapAddress, lptAddress, meAddress }
})

export const APPROVE_AUX_ZT = 'APPROVE_AUX_ZT'
export const APPROVE_AUX_ZT_SUCCEEDED = 'APPROVE_AUX_ZT_SUCCEEDED'
export const APPROVE_AUX_ZT_FAILED = 'APPROVE_AUX_ZT_FAILED'
export const approveAuxZT = (tokenAddress: string, amount: string) => ({
  type: APPROVE_AUX_ZT,
  payload: { tokenAddress, amount }
})

export const APPROVE_AUX_TZ = 'APPROVE_AUX_TZ'
export const APPROVE_AUX_TZ_SUCCEEDED = 'APPROVE_AUX_TZ_SUCCEEDED'
export const APPROVE_AUX_TZ_FAILED = 'APPROVE_AUX_TZ_FAILED'
export const approveAuxTZ = (tokenAddress: string, amount: string) => ({
  type: APPROVE_AUX_TZ,
  payload: { tokenAddress, amount }
})

export const APPROVE_AUX_LM = 'APPROVE_AUX_LM'
export const APPROVE_AUX_LM_SUCCEEDED = 'APPROVE_AUX_LM_SUCCEEDED'
export const APPROVE_AUX_LM_FAILED = 'APPROVE_AUX_LM_FAILED'
export const approveAuxLM = (tokenAddress: string, amount: string, fromRouter: boolean) => ({
  type: APPROVE_AUX_LM,
  payload: { tokenAddress, amount, fromRouter }
})

export const ZIL_TO_TOKEN_SWAP = 'ZIL_TO_TOKEN_SWAP'
export const ZIL_TO_TOKEN_SWAP_SUCCEEDED = 'ZIL_TO_TOKEN_SWAP_SUCCEEDED'
export const ZIL_TO_TOKEN_SWAP_FAILED = 'ZIL_TO_TOKEN_SWAP_FAILED'
export const zilToTokenSwap = (tokenAddress: string, amount: string, minTokens: string) => ({
  type: ZIL_TO_TOKEN_SWAP,
  payload: { tokenAddress, amount, minTokens }
})

export const ZIL_TO_TOKEN_SWAP_OUTPUT = 'ZIL_TO_TOKEN_SWAP_OUTPUT'
export const ZIL_TO_TOKEN_SWAP_OUTPUT_SUCCEEDED = 'ZIL_TO_TOKEN_SWAP_OUTPUT_SUCCEEDED'
export const ZIL_TO_TOKEN_SWAP_OUTPUT_FAILED = 'ZIL_TO_TOKEN_SWAP_OUTPUT_FAILED'
export const zilToTokenSwapOutput = (tokenAddress: string, amount: string, tokensBought: string) => ({
  type: ZIL_TO_TOKEN_SWAP_OUTPUT,
  payload: { tokenAddress, amount, tokensBought }
})

export const TOKEN_TO_ZIL_SWAP = 'TOKEN_TO_ZIL_SWAP'
export const TOKEN_TO_ZIL_SWAP_SUCCEEDED = 'TOKEN_TO_ZIL_SWAP_SUCCEEDED'
export const TOKEN_TO_ZIL_SWAP_FAILED = 'TOKEN_TO_ZIL_SWAP_FAILED'
export const tokenToZilSwap = (tokenAddress: string, tokensSold: string, minZil: string) => ({
  type: TOKEN_TO_ZIL_SWAP,
  payload: { tokenAddress, tokensSold, minZil }
})

export const TOKEN_TO_ZIL_SWAP_OUTPUT = 'TOKEN_TO_ZIL_SWAP_OUTPUT'
export const TOKEN_TO_ZIL_SWAP_OUTPUT_SUCCEEDED = 'TOKEN_TO_ZIL_SWAP_OUTPUT_SUCCEEDED'
export const TOKEN_TO_ZIL_SWAP_OUTPUT_FAILED = 'TOKEN_TO_ZIL_SWAP_OUTPUT_FAILED'
export const tokenToZilSwapOutput = (tokenAddress: string, maxToken: string, zilBought: string) => ({
  type: TOKEN_TO_ZIL_SWAP_OUTPUT,
  payload: { tokenAddress, maxToken, zilBought }
})

export const AUTHORIZE_TOKEN = 'AUTHORIZE_TOKEN'
export const AUTHORIZE_TOKEN_SUCCEEDED = 'AUTHORIZE_TOKEN_SUCCEEDED'
export const AUTHORIZE_TOKEN_FAILED = 'AUTHORIZE_TOKEN_FAILED'
export const authorizeToken = (tokenAddress: string, amount: string) => ({
  type: AUTHORIZE_TOKEN,
  payload: { tokenAddress, amount }
})

export const ADD_LIQUIDITY = 'ADD_LIQUIDITY'
export const ADD_LIQUIDITY_SUCCEEDED = 'ADD_LIQUIDITY_SUCCEEDED'
export const ADD_LIQUIDITY_FAILED = 'ADD_LIQUIDITY_FAILED'
export const addLiquidity = (
  tokenAddress: string,
  amount: string,
  minLiquidity: number,
  maxTokens: string,
  deadline: string
) => ({
  type: ADD_LIQUIDITY,
  payload: { tokenAddress, amount, minLiquidity, maxTokens, deadline }
})

export const REMOVE_LIQUIDITY = 'REMOVE_LIQUIDITY'
export const REMOVE_LIQUIDITY_SUCCEEDED = 'REMOVE_LIQUIDITY_SUCCEEDED'
export const REMOVE_LIQUIDITY_FAILED = 'REMOVE_LIQUIDITY_FAILED'
export const removeLiquidity = (
  tokenAddress: string,
  amount: string,
  minZil: string,
  minTokens: string,
  recipientAddress: string
) => ({
  type: REMOVE_LIQUIDITY,
  payload: { tokenAddress, amount, minZil, minTokens, recipientAddress }
})

export const AUTHORIZE_LIQUIDITY = 'AUTHORIZE_LIQUIDITY'
export const AUTHORIZE_LIQUIDITY_SUCCEEDED = 'AUTHORIZE_LIQUIDITY_SUCCEEDED'
export const AUTHORIZE_LIQUIDITY_FAILED = 'AUTHORIZE_LIQUIDITY_FAILED'
export const authorizeLiquidity = (tokenAddress: string, amount: string) => ({
  type: AUTHORIZE_LIQUIDITY,
  payload: { tokenAddress, amount }
})

export const GET_BALANCE = 'GET_BALANCE'
export const GET_BALANCE_SUCCEEDED = 'GET_BALANCE_SUCCEEDED'
export const GET_BALANCE_FAILED = 'GET_BALANCE_FAILED'
export const getBalance = (address: string) => ({ type: GET_BALANCE, payload: { address } })

export const GET_TOKEN_BALANCE = 'GET_TOKEN_BALANCE'
export const GET_TOKEN_BALANCE_SUCCEEDED = 'GET_TOKEN_BALANCE_SUCCEEDED'
export const GET_TOKEN_BALANCE_FAILED = 'GET_TOKEN_BALANCE_FAILED'
export const getTokenBalance = (tokenAddress: string, address: string) => ({
  type: GET_TOKEN_BALANCE,
  payload: { tokenAddress, address }
})

export const GET_TOKEN_CONTRACT = 'GET_TOKEN_CONTRACT'
export const GET_TOKEN_CONTRACT_SUCCEEDED = 'GET_TOKEN_CONTRACT_SUCCEEDED'
export const GET_TOKEN_CONTRACT_FAILED = 'GET_TOKEN_CONTRACT_FAILED'
export const getTokenContract = (tokenAddress: string) => ({
  type: GET_TOKEN_CONTRACT,
  payload: { tokenAddress }
})

export const GET_TOKEN_CONTRACT_STATE = 'GET_TOKEN_CONTRACT_STATE'
export const GET_TOKEN_CONTRACT_STATE_SUCCEEDED = 'GET_TOKEN_CONTRACT_STATE_SUCCEEDED'
export const GET_TOKEN_CONTRACT_STATE_FAILED = 'GET_TOKEN_CONTRACT_STATE_FAILED'
export const getTokenContractState = (tokenAddress: string) => ({
  type: GET_TOKEN_CONTRACT_STATE,
  payload: { tokenAddress }
})

export const INVALID_TOKEN_CONTRACT_STATE = 'INVALID_TOKEN_CONTRACT_STATE'
export const invalidTokenContractState = (tokenAddress: string) => ({
  type: INVALID_TOKEN_CONTRACT_STATE,
  payload: { tokenAddress }
})

export const GET_MIN_GAS_PRICE = 'GET_MIN_GAS_PRICE'
export const GET_MIN_GAS_PRICE_SUCCEEDED = 'GET_MIN_GAS_PRICE_SUCCEEDED'
export const GET_MIN_GAS_PRICE_FAILED = 'GET_MIN_GAS_PRICE_FAILED'
export const getMinGasPrice = () => ({ type: GET_MIN_GAS_PRICE })
