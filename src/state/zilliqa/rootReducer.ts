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

import { combineReducers } from 'redux'
import zil from './zil/reducer'
import { AppState } from '../index'
import { useSelector } from 'react-redux'

export default combineReducers({
  zil
})

export function useZilliqaState(): AppState['zilliqa']['zil'] {
  return useSelector<AppState, AppState['zilliqa']['zil']>(state => state.zilliqa.zil)
}
