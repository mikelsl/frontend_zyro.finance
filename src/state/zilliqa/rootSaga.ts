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

import { all } from 'redux-saga/effects'

import * as zilSagas from './zil/sagas'

function* rootSaga() {
  yield all([
    /* ZIL */
    zilSagas.watchGetMinGasPriceSaga(),
    zilSagas.watchGetBalanceSaga(),
    zilSagas.watchAccessWalletSaga(),
    zilSagas.watchCreateMarketSaga(),
    zilSagas.watchApproveAuxZTSaga(),
    zilSagas.watchApproveAuxTZSaga(),
    zilSagas.watchApproveAuxLMSaga(),
    zilSagas.watchZilToTokenSwapSaga(),
    zilSagas.watchTokenToZilSwapSaga(),
    zilSagas.watchAuthorizeTokenToZilSaga(),
    zilSagas.watchAddLiquiditySaga(),
    zilSagas.watchRemoveLiquiditySaga(),
    zilSagas.watchAuthorizeLiquiditySaga(),
    zilSagas.watchGetTokenBalanceSaga(),
    zilSagas.watchGetTokenContractSaga(),
    zilSagas.watchGetTokenContractStateSaga(),
    zilSagas.watchAccessWebWalletSaga(),
    zilSagas.watchInitRouterSaga(),
    zilSagas.watchAccessZilpayWalletSaga(),
    zilSagas.watchZilToTokenSwapOutputSaga(),
    zilSagas.watchTokenToZilSwapOutputSaga()
  ])
}

export default rootSaga
