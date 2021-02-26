import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit'
import { save, load } from 'redux-localstorage-simple'
import createSagaMiddleware from 'redux-saga'

import application from './application/reducer'
import { updateVersion } from './global/actions'
import user from './user/reducer'
import transactions from './transactions/reducer'
import swap from './swap/reducer'
import mint from './mint/reducer'
import lists from './lists/reducer'
import burn from './burn/reducer'
import multicall from './multicall/reducer'
import zilliqa from './zilliqa/rootReducer'
import rootSaga from './zilliqa/rootSaga'

const PERSISTED_KEYS: string[] = ['user']

const sagaMiddleware = createSagaMiddleware()

const store = configureStore({
  reducer: {
    zilliqa,
    application,
    user,
    transactions,
    swap,
    mint,
    burn,
    multicall,
    lists
  },
  middleware: [
    ...getDefaultMiddleware({
      thunk: false,
      serializableCheck: false,
      immutableCheck: false
    }),
    save({ states: PERSISTED_KEYS }),
    sagaMiddleware
  ],
  preloadedState: load({ states: PERSISTED_KEYS })
})

sagaMiddleware.run(rootSaga)

store.dispatch(updateVersion())

export default store

export type AppState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
