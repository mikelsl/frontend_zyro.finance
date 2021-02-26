import { NETWORK, NODE_URL, requestStatus } from '../../../zilliqa/constant'
import { Zilliqa } from '@zilliqa-js/zilliqa'
import { HTTPProvider } from '@zilliqa-js/core'
import * as consts from './actions'

const provider = new HTTPProvider(NODE_URL)
const zilliqa = new Zilliqa(NODE_URL, provider)

const initialState: any = {
  zilliqa,
  provider,
  network: NETWORK,
  address: undefined,
  publicKey: undefined,
  privateKey: undefined,
  faucetTxId: undefined,
  swapId: undefined,
  authStatus: undefined,
  faucetStatus: undefined,
  swapStatus: undefined,
  minGasPriceInQa: undefined,
  getMinGasPriceStatus: undefined,
  balanceInQa: {},
  getBalanceStatus: {},
  tokenBalance: {},
  getTokenBalanceStatus: {},
  tokenContract: {},
  getTokenContractStatus: {},
  tokenContractState: {},
  getTokenContractStateStatus: {}
}

export default function zil(state = initialState, action: any) {
  switch (action.type) {
    case consts.ACCESS_WALLET:
      return {
        ...state,
        address: undefined,
        publicKey: undefined,
        privateKey: undefined,
        authStatus: requestStatus.PENDING
      }
    case consts.ACCESS_WALLET_SUCCEEDED:
      return {
        ...state,
        address: action.payload.address,
        publicKey: action.payload.publicKey,
        privateKey: action.payload.privateKey,
        authStatus: requestStatus.SUCCEED
      }
    case consts.ACCESS_WALLET_FAILED:
      return {
        ...state,
        address: undefined,
        publicKey: undefined,
        privateKey: undefined,
        authStatus: requestStatus.FAILED
      }
    case consts.ACCESS_WEB_WALLET:
      return {
        ...state,
        address: undefined
      }
    case consts.ACCESS_WEB_WALLET_SUCCEEDED:
      return {
        ...state,
        address: action.payload.address
      }
    case consts.ACCESS_WEB_WALLET_FAILED:
      return {
        ...state,
        address: undefined
      }
    case consts.CREATE_MARKET:
      return {
        ...state,
        createMarketStatus: requestStatus.PENDING,
        createMarketId: undefined
      }
    case consts.CREATE_MARKET_SUCCEEDED:
      return {
        ...state,
        createMarketStatus: requestStatus.SUCCEED,
        createMarketId: action.payload.createMarketId
      }
    case consts.CREATE_MARKET_FAILED:
      return {
        ...state,
        createMarketStatus: requestStatus.FAILED,
        createMarketId: undefined
      }
    case consts.INIT_ROUTER:
      return {
        ...state,
        initRouterStatus: requestStatus.PENDING
      }
    case consts.INIT_ROUTER_SUCCEEDED:
      return {
        ...state,
        initRouterStatus: requestStatus.SUCCEED
      }
    case consts.INIT_ROUTER_FAILED:
      return {
        ...state,
        initRouterStatus: requestStatus.FAILED
      }
    case consts.APPROVE_AUX_ZT:
      return {
        ...state,
        approveAuxZTStatus: requestStatus.PENDING,
        approveAuxZTId: undefined
      }
    case consts.APPROVE_AUX_ZT_SUCCEEDED:
      return {
        ...state,
        approveAuxZTStatus: requestStatus.SUCCEED,
        approveAuxZTId: action.payload.approveAuxZTId
      }
    case consts.APPROVE_AUX_ZT_FAILED:
      return {
        ...state,
        approveAuxZTStatus: requestStatus.FAILED,
        approveAuxZTId: undefined
      }
    case consts.APPROVE_AUX_TZ:
      return {
        ...state,
        approveAuxTZStatus: requestStatus.PENDING,
        approveAuxTZId: undefined
      }
    case consts.APPROVE_AUX_TZ_SUCCEEDED:
      return {
        ...state,
        approveAuxTZStatus: requestStatus.SUCCEED,
        approveAuxTZId: action.payload.approveAuxTZId
      }
    case consts.APPROVE_AUX_TZ_FAILED:
      return {
        ...state,
        approveAuxTZStatus: requestStatus.FAILED,
        approveAuxTZId: undefined
      }
    case consts.APPROVE_AUX_LM:
      return {
        ...state,
        approveAuxLMStatus: requestStatus.PENDING,
        approveAuxLMId: undefined
      }
    case consts.APPROVE_AUX_LM_SUCCEEDED:
      return {
        ...state,
        approveAuxLMStatus: requestStatus.SUCCEED,
        approveAuxLMId: action.payload.approveAuxLMId
      }
    case consts.APPROVE_AUX_LM_FAILED:
      return {
        ...state,
        approveAuxLMStatus: requestStatus.FAILED,
        approveAuxLMId: undefined
      }
    case consts.ZIL_TO_TOKEN_SWAP_OUTPUT:
      return {
        ...state,
        zilToTokenSwapStatus: requestStatus.PENDING,
        zilToTokenSwapId: undefined
      }
    case consts.ZIL_TO_TOKEN_SWAP_OUTPUT_SUCCEEDED:
      return {
        ...state,
        zilToTokenSwapStatus: requestStatus.SUCCEED,
        zilToTokenSwapId: action.payload.zilToTokenSwapId
      }
    case consts.ZIL_TO_TOKEN_SWAP_OUTPUT_FAILED:
      return {
        ...state,
        zilToTokenSwapStatus: requestStatus.FAILED,
        zilToTokenSwapId: undefined
      }
    case consts.ZIL_TO_TOKEN_SWAP:
      return {
        ...state,
        zilToTokenSwapStatus: requestStatus.PENDING,
        zilToTokenSwapId: undefined
      }
    case consts.ZIL_TO_TOKEN_SWAP_SUCCEEDED:
      return {
        ...state,
        zilToTokenSwapStatus: requestStatus.SUCCEED,
        zilToTokenSwapId: action.payload.zilToTokenSwapId
      }
    case consts.ZIL_TO_TOKEN_SWAP_FAILED:
      return {
        ...state,
        zilToTokenSwapStatus: requestStatus.FAILED,
        zilToTokenSwapId: undefined
      }
    case consts.TOKEN_TO_ZIL_SWAP:
      return {
        ...state,
        tokenToZilSwapStatus: requestStatus.PENDING,
        tokenToZilSwapId: undefined
      }
    case consts.TOKEN_TO_ZIL_SWAP_SUCCEEDED:
      return {
        ...state,
        tokenToZilSwapStatus: requestStatus.SUCCEED,
        tokenToZilSwapId: action.payload.tokenToZilSwapId
      }
    case consts.TOKEN_TO_ZIL_SWAP_FAILED:
      return {
        ...state,
        tokenToZilSwapStatus: requestStatus.FAILED,
        tokenToZilSwapId: undefined
      }
    case consts.TOKEN_TO_ZIL_SWAP_OUTPUT:
      return {
        ...state,
        tokenToZilSwapStatus: requestStatus.PENDING,
        tokenToZilSwapId: undefined
      }
    case consts.TOKEN_TO_ZIL_SWAP_OUTPUT_SUCCEEDED:
      return {
        ...state,
        tokenToZilSwapStatus: requestStatus.SUCCEED,
        tokenToZilSwapId: action.payload.tokenToZilSwapId
      }
    case consts.TOKEN_TO_ZIL_SWAP_OUTPUT_FAILED:
      return {
        ...state,
        tokenToZilSwapStatus: requestStatus.FAILED,
        tokenToZilSwapId: undefined
      }
    case consts.AUTHORIZE_TOKEN:
      return {
        ...state,
        authorizeTokenStatus: requestStatus.PENDING,
        authorizeTokenId: undefined
      }
    case consts.AUTHORIZE_TOKEN_SUCCEEDED:
      return {
        ...state,
        authorizeTokenStatus: requestStatus.SUCCEED,
        authorizeTokenId: action.payload.authorizeTokenId
      }
    case consts.AUTHORIZE_TOKEN_FAILED:
      return {
        ...state,
        authorizeTokenStatus: requestStatus.FAILED,
        authorizeTokenId: undefined
      }
    case consts.ADD_LIQUIDITY:
      return {
        ...state,
        addLiquidityStatus: requestStatus.PENDING,
        addLiquidityId: undefined
      }
    case consts.ADD_LIQUIDITY_SUCCEEDED:
      return {
        ...state,
        addLiquidityStatus: requestStatus.SUCCEED,
        addLiquidityId: action.payload.addLiquidityId
      }
    case consts.ADD_LIQUIDITY_FAILED:
      return {
        ...state,
        addLiquidityStatus: requestStatus.FAILED,
        addLiquidityId: undefined
      }
    case consts.REMOVE_LIQUIDITY:
      return {
        ...state,
        removeLiquidityStatus: requestStatus.PENDING,
        removeLiquidityId: undefined
      }
    case consts.REMOVE_LIQUIDITY_SUCCEEDED:
      return {
        ...state,
        removeLiquidityStatus: requestStatus.SUCCEED,
        removeLiquidityId: action.payload.removeLiquidityId
      }
    case consts.REMOVE_LIQUIDITY_FAILED:
      return {
        ...state,
        removeLiquidityStatus: requestStatus.FAILED,
        removeLiquidityId: undefined
      }
    case consts.AUTHORIZE_LIQUIDITY:
      return {
        ...state,
        authorizeLiquidityStatus: requestStatus.PENDING,
        authorizeLiquidityId: undefined
      }
    case consts.AUTHORIZE_LIQUIDITY_SUCCEEDED:
      return {
        ...state,
        authorizeLiquidityStatus: requestStatus.SUCCEED,
        authorizeLiquidityId: action.payload.authorizeLiquidityId
      }
    case consts.AUTHORIZE_LIQUIDITY_FAILED:
      return {
        ...state,
        authorizeLiquidityStatus: requestStatus.FAILED,
        authorizeLiquidityId: undefined
      }
    case consts.GET_BALANCE:
      return {
        ...state,
        getBalanceStatus: Object.assign({}, state.getBalanceStatus, {
          [action.payload.address]: requestStatus.PENDING
        }),
        balanceInQa: Object.assign({}, state.balanceInQa, {
          [action.payload.address]: undefined
        })
      }
    case consts.GET_BALANCE_SUCCEEDED:
      return {
        ...state,
        getBalanceStatus: Object.assign({}, state.getBalanceStatus, {
          [action.payload.address]: requestStatus.SUCCEED
        }),
        balanceInQa: Object.assign({}, state.balanceInQa, {
          [action.payload.address]: action.payload.balanceInQa
        })
      }
    case consts.GET_BALANCE_FAILED:
      return {
        ...state,
        getBalanceStatus: Object.assign({}, state.getBalanceStatus, {
          [action.payload.address]: requestStatus.FAILED
        }),
        balanceInQa: Object.assign({}, state.balanceInQa, {
          [action.payload.address]: undefined
        })
      }
    case consts.GET_TOKEN_CONTRACT:
      return {
        ...state,
        getTokenContractStatus: Object.assign({}, state.getTokenContractStatus, {
          [action.payload.tokenAddress]: requestStatus.PENDING
        }),
        tokenContract: Object.assign({}, state.tokenContract, {
          [action.payload.tokenAddress]: undefined
        })
      }
    case consts.GET_TOKEN_CONTRACT_SUCCEEDED:
      return {
        ...state,
        getTokenContractStatus: Object.assign({}, state.getTokenContractStatus, {
          [action.payload.tokenAddress]: requestStatus.SUCCEED
        }),
        tokenContract: Object.assign({}, state.tokenContract, {
          [action.payload.tokenAddress]: action.payload.tokenContract
        })
      }
    case consts.GET_TOKEN_CONTRACT_FAILED:
      return {
        ...state,
        getTokenContractStatus: Object.assign({}, state.getTokenContractStatus, {
          [action.payload.tokenAddress]: requestStatus.FAILED
        }),
        tokenContract: Object.assign({}, state.tokenContract, {
          [action.payload.tokenAddress]: undefined
        })
      }
    case consts.INVALID_TOKEN_CONTRACT_STATE:
      return {
        ...state,
        getTokenContractStateStatus: Object.assign({}, state.getTokenContractStateStatus, {
          [action.payload.tokenAddress]: undefined
        }),
        tokenContractState: Object.assign({}, state.tokenContractState, {
          [action.payload.tokenAddress]: undefined
        })
      }
    case consts.GET_TOKEN_CONTRACT_STATE:
      return {
        ...state,
        getTokenContractStateStatus: Object.assign({}, state.getTokenContractStateStatus, {
          [action.payload.tokenAddress]: requestStatus.PENDING
        }),
        tokenContractState: Object.assign({}, state.tokenContractState, {
          [action.payload.tokenAddress]: undefined
        })
      }
    case consts.GET_TOKEN_CONTRACT_STATE_SUCCEEDED:
      return {
        ...state,
        getTokenContractStateStatus: Object.assign({}, state.getTokenContractStateStatus, {
          [action.payload.tokenAddress]: requestStatus.SUCCEED
        }),
        tokenContractState: Object.assign({}, state.tokenContractState, {
          [action.payload.tokenAddress]: action.payload.tokenContractState
        })
      }
    case consts.GET_TOKEN_CONTRACT_STATE_FAILED:
      return {
        ...state,
        getTokenContractStateStatus: Object.assign({}, state.getTokenContractStateStatus, {
          [action.payload.tokenAddress]: requestStatus.FAILED
        }),
        tokenContractState: Object.assign({}, state.tokenContractState, {
          [action.payload.tokenAddress]: undefined
        })
      }
    case consts.GET_TOKEN_BALANCE:
      return {
        ...state,
        getTokenBalanceStatus: Object.assign({}, state.getTokenBalanceStatus, {
          [action.payload.tokenAddress]: { [action.payload.address]: requestStatus.PENDING }
        }),
        tokenBalance: Object.assign({}, state.tokenBalance, {
          [action.payload.tokenAddress]: { [action.payload.address]: undefined }
        })
      }
    case consts.GET_TOKEN_BALANCE_SUCCEEDED:
      return {
        ...state,
        getTokenBalanceStatus: Object.assign({}, state.getTokenBalanceStatus, {
          [action.payload.tokenAddress]: { [action.payload.address]: requestStatus.SUCCEED }
        }),
        tokenBalance: Object.assign({}, state.tokenBalance, {
          [action.payload.tokenAddress]: { [action.payload.address]: action.payload.tokenBalance }
        })
      }
    case consts.GET_TOKEN_BALANCE_FAILED:
      return {
        ...state,
        getTokenBalanceStatus: Object.assign({}, state.getTokenBalanceStatus, {
          [action.payload.tokenAddress]: { [action.payload.address]: requestStatus.FAILED }
        }),
        tokenBalance: Object.assign({}, state.tokenBalance, {
          [action.payload.tokenAddress]: { [action.payload.address]: undefined }
        })
      }
    case consts.GET_MIN_GAS_PRICE:
      return {
        ...state,
        getMinGasPriceStatus: requestStatus.PENDING,
        minGasPriceInQa: undefined
      }
    case consts.GET_MIN_GAS_PRICE_SUCCEEDED:
      return {
        ...state,
        getMinGasPriceStatus: requestStatus.SUCCEED,
        minGasPriceInQa: action.payload.minGasPriceInQa
      }
    case consts.GET_MIN_GAS_PRICE_FAILED:
      return {
        ...state,
        getMinGasPriceStatus: requestStatus.FAILED,
        minGasPriceInQa: undefined
      }
    case consts.CLEAR:
      return initialState
    default:
      return state
  }
}
