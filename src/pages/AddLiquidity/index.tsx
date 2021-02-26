import React, { useCallback, useContext, useEffect, useState } from 'react'
import { Plus } from 'react-feather'
import { RouteComponentProps } from 'react-router-dom'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { ButtonError, ButtonLight, ButtonPrimary } from '../../components/Button'
import { BlueCard, LightCard } from '../../components/Card'
import { AutoColumn, ColumnCenter } from '../../components/Column'
import TransactionConfirmationModal, { ConfirmationModalContent } from '../../components/TransactionConfirmationModal'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import DoubleCurrencyLogo from '../../components/DoubleLogo'
import { AddRemoveTabs } from '../../components/NavigationTabs'
import Row, { RowBetween, RowFlat } from '../../components/Row'

import { useActiveWeb3React } from '../../hooks'
import { useWalletModalToggle } from '../../state/application/hooks'

import { useIsExpertMode, useUserSlippageTolerance } from '../../state/user/hooks'
import { TYPE } from '../../theme'
import AppBody from '../AppBody'
import { Dots, Wrapper } from '../Pool/styleds'
import { currencyId } from '../../utils/currencyId'
import { useCurrency, ZCurrency, ZToken, ZTokenAmount } from '../../zilliqa/ztoken'
import { useMintActionHandlers, useMintInfo, useMintState } from '../../state/mint/hooks'
import { maxAmountSpend, toQA, toTokenQA } from '../../zilliqa/utils'
import { Field } from '../../state/mint/actions'
import { ConfirmAddModalBottom } from './ConfirmAddModalBottom'
import { useZilliqaState } from '../../state/zilliqa/rootReducer'
import { zilliqa, ZLPT } from '../../zilliqa'
import { PoolPriceBar } from './PoolPriceBar'
import { useRouterActions } from '../../hooks/useApproveCallback'
import { Price } from '../../zilliqa/price'
import { JSBI } from '@uniswap/sdk'
import {
  baseUrl,
  CurrentChainId,
  MANAGER_ADDRESS,
  MINIMUM_LIQUIDITY,
  requestStatus,
  TOKEN_MINING_ADDRESS,
  TOKEN_SWAP_ADDRESS,
  ZERO
} from '../../zilliqa/constant'
import LoadingModal from '../../components/LoadingModal'
import BN from 'bn.js'
import Long from 'long'
import { ROUTER_ADDRESS } from '../../constants'

export default function AddLiquidity({
  match: {
    params: { currencyIdA, currencyIdB }
  },
  history
}: RouteComponentProps<{ currencyIdA?: string; currencyIdB?: string }>) {
  const { account } = useActiveWeb3React()
  const theme = useContext(ThemeContext)
  const toggleWalletModal = useWalletModalToggle() // toggle wallet when disconnected
  const expertMode = useIsExpertMode()
  // const deadline = useTransactionDeadline() // custom from users settings
  const [allowedSlippage] = useUserSlippageTolerance() // custom from users
  const isOperator = account === '0x1D9822AEcE21a28Aa499c93920dF839Ba143E36D'
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm
  const [txHash, setTxHash] = useState<string | undefined>(undefined)
  const isCreate = history.location.pathname.includes('/create')
  const currencyA = useCurrency(currencyIdA)
  const currencyB = useCurrency(currencyIdB)
  const [bntSupplyTxt, setBntSupplyTxt] = useState('Not Approved')

  const { independentField, typedValue, otherTypedValue } = useMintState()
  const {
    dependentField,
    currencies,
    currencyBalances,
    noLiquidity,
    liquidityMinted,
    parsedAmounts,
    poolTokenPercentage,
    enoughApprove,
    tokenField,
    pairExists,
    error
  } = useMintInfo(currencyA ?? undefined, currencyB ?? undefined)
  const isValid = !error
  const { onFieldAInput, onFieldBInput } = useMintActionHandlers(noLiquidity)
  const [waitingTrans, setWaitingTrans] = useState(false)

  // get formatted amounts
  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: noLiquidity ? otherTypedValue : parsedAmounts[dependentField]?.toSignificant(12) ?? ''
  }

  // get the max amounts user can add
  const maxAmounts: { [field in Field]?: ZTokenAmount } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmountSpend(currencyBalances[field])
      }
    },
    {}
  )

  const atMaxAmounts: { [field in Field]?: ZTokenAmount } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmounts[field]?.equalTo(parsedAmounts[field] ?? '0')
      }
    },
    {}
  )
  const price =
    parsedAmounts[Field.CURRENCY_A] &&
    parsedAmounts[Field.CURRENCY_B] &&
    !JSBI.equal(parsedAmounts[Field.CURRENCY_B]?.raw ?? ZERO, ZERO) &&
    !JSBI.equal(parsedAmounts[Field.CURRENCY_A]?.raw ?? ZERO, ZERO)
      ? new Price(
          parsedAmounts[Field.CURRENCY_A]?.currency as ZCurrency,
          parsedAmounts[Field.CURRENCY_B]?.currency as ZCurrency,
          parsedAmounts[Field.CURRENCY_A]?.raw as JSBI,
          parsedAmounts[Field.CURRENCY_B]?.raw as JSBI
        )
      : undefined

  const { createMarket, approveAuxLM, addLiquidity, initRouter } = useRouterActions()
  const {
    approveAuxLMStatus,
    createMarketStatus,
    initRouterStatus,
    addLiquidityStatus,
    addLiquidityId,
    approveAuxLMId
  } = useZilliqaState()
  const tokenAmount = parsedAmounts[tokenField]?.toSignificant(12)
  const tokenAmountString =
    currencies[tokenField] === undefined
      ? '0'
      : toTokenQA(tokenAmount ?? '0', currencies[tokenField] as ZToken).toString(10)
  const [approveTxConfirmed, setApproveTxConfirmed] = useState(false)
  const approveTokenAmount = '240282366920938463463374607431768211455'
  const handleApprove = () => {
    if (currencies[tokenField] === undefined) return
    approveAuxLM((currencies[tokenField] as ZToken).address, approveTokenAmount, false)
    setBntSupplyTxt('Waiting Approve confirmed')
  }

  const pendingText = `Supplying ${parsedAmounts[Field.CURRENCY_A]?.toSignificant(12)} ${
    currencies[Field.CURRENCY_A]?.symbol
  } and ${parsedAmounts[Field.CURRENCY_B]?.toSignificant(12)} ${currencies[Field.CURRENCY_B]?.symbol}`
  async function onAdd() {
    const zilField = tokenField === Field.CURRENCY_A ? Field.CURRENCY_B : Field.CURRENCY_A
    const zilAmount = parsedAmounts[zilField]?.toSignificant(12)
    const deadline = independentField === tokenField ? '600000000' : '500000000'
    if (tokenAmount !== undefined && currencies[tokenField] !== undefined) {
      addLiquidity(
        (currencies[tokenField] as ZToken).address,
        toQA(zilAmount ?? '0').toString(10),
        Number(MINIMUM_LIQUIDITY),
        tokenAmountString,
        deadline
      )
      setAttemptingTxn(true)
    }
  }
  const txParams = {
    version: 0,
    toAddr: ROUTER_ADDRESS,
    amount: new BN(0),
    gasPrice: new BN(10000),
    gasLimit: Long.fromNumber(50000)
  }
  const tx = zilliqa.transactions.new(txParams, false, false)
  useEffect(() => {
    if (approveAuxLMId) {
      tx.confirm(approveAuxLMId, 100, 2000)
        .then(() => {
          setBntSupplyTxt('Supply')
          setApproveTxConfirmed(true)
        })
        .catch(() => {
          alert('approve failed')
        })
    }
  }, [approveAuxLMStatus, approveAuxLMId])

  const handleLogAdd = (txhash: any) => {
    const data = {
      Address: account,
      Hash: txhash
    }
    fetch(baseUrl + '/info/log/addliquidity', {
      method: 'POST',
      headers: {
        'Content-Security-Policy': 'upgrade-insecure-requests',
        'content-type': 'application/json',
        accept: 'application/json'
      },
      body: JSON.stringify(data)
    }).then(resp => {
      console.log(resp.body)
    })
  }

  useEffect(() => {
    if (addLiquidityId) {
      setTxHash(addLiquidityId)
      handleLogAdd(addLiquidityId)
      tx.confirm(addLiquidityId, 100, 2000)
        .then(() => {
          setAttemptingTxn(false)
        })
        .catch(e => console.log(e))
    }
  }, [addLiquidityStatus, addLiquidityId])

  const handleCurrencyASelect = useCallback(
    (currencyA: ZCurrency) => {
      const newCurrencyIdA = currencyId(currencyA)
      if (newCurrencyIdA === currencyIdB) {
        history.push(`/add/${currencyIdB}/${currencyIdA}`)
      } else {
        history.push(`/add/${newCurrencyIdA}/${currencyIdB}`)
      }
    },
    [currencyIdB, history, currencyIdA]
  )

  const [bntCreateMarketTxt, setBntCreateMarketTxt] = useState('Create Pair')
  const [bntInitRouterTxt, setBntInitRouterTxt] = useState('Init Router')
  const handleCreateMarket = () => {
    if (currencies[tokenField] === undefined) return
    const txt = createMarketStatus ? 'Create Pair ' + createMarketStatus : 'Create Pair'
    setBntCreateMarketTxt(txt)
    const id = createMarket((currencies[tokenField] as ZToken).address)
    console.log('create market transaction id: ' + id)
  }
  const handleInitRouter = () => {
    const txt = initRouterStatus ? 'Route Initialzing ' + initRouterStatus : 'Init Router'
    setBntInitRouterTxt(txt)
    initRouter(MANAGER_ADDRESS, TOKEN_SWAP_ADDRESS, ZLPT[CurrentChainId].address, TOKEN_MINING_ADDRESS)
  }

  const handleCurrencyBSelect = useCallback(
    (currencyB: ZCurrency) => {
      const newCurrencyIdB = currencyId(currencyB)
      if (currencyIdA === newCurrencyIdB) {
        if (currencyIdB) {
          history.push(`/add/${currencyIdB}/${newCurrencyIdB}`)
        } else {
          history.push(`/add/${newCurrencyIdB}`)
        }
      } else {
        history.push(`/add/${currencyIdA ? currencyIdA : 'ZIL'}/${newCurrencyIdB}`)
      }
    },
    [currencyIdA, history, currencyIdB]
  )

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onFieldAInput('')
    }
    setTxHash(undefined)
    setAttemptingTxn(false)
  }, [onFieldAInput, txHash])

  const handleDismissLoading = useCallback(() => {
    setWaitingTrans(false)
    setTxHash(undefined)
  }, [])

  const modalHeader = () => {
    return noLiquidity ? (
      <AutoColumn gap="20px">
        <LightCard mt="20px" borderRadius="20px">
          <RowFlat>
            <Text fontSize="48px" fontWeight={500} lineHeight="42px" marginRight={10}>
              {currencies[Field.CURRENCY_A]?.symbol + '/' + currencies[Field.CURRENCY_B]?.symbol}
            </Text>
            <DoubleCurrencyLogo
              currency0={currencies[Field.CURRENCY_A]}
              currency1={currencies[Field.CURRENCY_B]}
              size={30}
            />
          </RowFlat>
        </LightCard>
      </AutoColumn>
    ) : (
      <AutoColumn gap="20px">
        <RowFlat style={{ marginTop: '20px' }}>
          <Text fontSize="48px" fontWeight={500} lineHeight="42px" marginRight={10}>
            {liquidityMinted?.toSignificant(6)}
          </Text>
          <DoubleCurrencyLogo
            currency0={currencies[Field.CURRENCY_A]}
            currency1={currencies[Field.CURRENCY_B]}
            size={30}
          />
        </RowFlat>
        <Row>
          <Text fontSize="24px">
            {currencies[Field.CURRENCY_A]?.symbol + '/' + currencies[Field.CURRENCY_B]?.symbol + ' Pool Tokens'}
          </Text>
        </Row>
        <TYPE.italic fontSize={12} textAlign="left" padding={'8px 0 0 0 '}>
          {`Output is estimated. If the price changes by more than ${allowedSlippage /
            100}% your transaction will revert.`}
        </TYPE.italic>
      </AutoColumn>
    )
  }

  const modalBottom = () => {
    return (
      <ConfirmAddModalBottom
        price={price}
        currencies={currencies}
        parsedAmounts={parsedAmounts}
        noLiquidity={noLiquidity}
        onAdd={onAdd}
        poolTokenPercentage={poolTokenPercentage}
      />
    )
  }

  return (
    <>
      <AppBody>
        <AddRemoveTabs creating={isCreate} adding={true} />
        <LoadingModal isOpen={waitingTrans} onDismiss={handleDismissLoading} />
        <Wrapper>
          <TransactionConfirmationModal
            isOpen={showConfirm}
            onDismiss={handleDismissConfirmation}
            attemptingTxn={attemptingTxn}
            hash={txHash}
            content={() => (
              <ConfirmationModalContent
                title={noLiquidity ? 'You are creating a pool' : 'You will receive'}
                onDismiss={handleDismissConfirmation}
                topContent={modalHeader}
                bottomContent={modalBottom}
              />
            )}
            pendingText={pendingText}
          />
          <AutoColumn gap="20px">
            <CurrencyInputPanel
              value={formattedAmounts[Field.CURRENCY_A]}
              onUserInput={onFieldAInput}
              onMax={() => {
                onFieldAInput(maxAmounts[Field.CURRENCY_A]?.toSignificant(6) ?? '')
              }}
              onCurrencySelect={handleCurrencyASelect}
              showMaxButton={!atMaxAmounts[Field.CURRENCY_A]}
              currency={currencies[Field.CURRENCY_A]}
              id="add-liquidity-input-tokena"
              showCommonBases
            />
            <ColumnCenter>
              <Plus size="16" color={theme.text2} />
            </ColumnCenter>
            <CurrencyInputPanel
              value={formattedAmounts[Field.CURRENCY_B]}
              onUserInput={onFieldBInput}
              onCurrencySelect={handleCurrencyBSelect}
              onMax={() => {
                onFieldBInput(maxAmounts[Field.CURRENCY_B]?.toSignificant(6) ?? '')
              }}
              showMaxButton={!atMaxAmounts[Field.CURRENCY_B]}
              currency={currencies[Field.CURRENCY_B]}
              id="add-liquidity-input-tokenb"
              showCommonBases
            />

            <>
              <LightCard padding="0px" borderRadius={'20px'}>
                <RowBetween padding="1rem">
                  <TYPE.subHeader fontWeight={500} fontSize={14}>
                    {noLiquidity ? 'Initial prices' : 'Prices'} and pool share
                  </TYPE.subHeader>
                </RowBetween>{' '}
                <LightCard padding="1rem" borderRadius={'20px'}>
                  <PoolPriceBar
                    currencies={currencies}
                    poolTokenPercentage={poolTokenPercentage}
                    noLiquidity={noLiquidity}
                    price={price}
                  />
                </LightCard>
              </LightCard>
            </>
            {isOperator && <ButtonLight onClick={handleInitRouter}>{bntInitRouterTxt}</ButtonLight>}
            {noLiquidity && (
              <AutoColumn gap={'md'}>
                <ColumnCenter>
                  <BlueCard>
                    <AutoColumn gap="10px">
                      <TYPE.link fontWeight={600} color={'primaryText1'}>
                        You are the first liquidity provider.
                      </TYPE.link>
                      <TYPE.link fontWeight={400} color={'primaryText1'}>
                        The ratio of tokens you add will set the price of this pool.
                      </TYPE.link>
                      <TYPE.link fontWeight={400} color={'primaryText1'}>
                        Once you are happy with the rate click supply to review.
                      </TYPE.link>
                    </AutoColumn>
                  </BlueCard>
                </ColumnCenter>
              </AutoColumn>
            )}
            {!pairExists && <ButtonLight onClick={handleCreateMarket}>{bntCreateMarketTxt}</ButtonLight>}
            {!account ? (
              <ButtonLight onClick={toggleWalletModal}>Connect Wallet</ButtonLight>
            ) : (
              <AutoColumn gap={'md'}>
                {!enoughApprove && (
                  <RowBetween>
                    <ButtonPrimary onClick={handleApprove} disabled={approveAuxLMStatus === requestStatus.PENDING}>
                      {approveAuxLMStatus === requestStatus.PENDING ? (
                        <Dots>Approving {currencies[tokenField]?.symbol}</Dots>
                      ) : (
                        'Approve ' + currencies[tokenField]?.symbol ?? ''
                      )}
                    </ButtonPrimary>
                  </RowBetween>
                )}
                <RowBetween>
                  <ButtonError
                    onClick={() => {
                      expertMode ? onAdd() : setShowConfirm(true)
                    }}
                    disabled={!enoughApprove ? !approveTxConfirmed : false}
                    error={!isValid && !!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B]}
                  >
                    <Text fontSize={20} fontWeight={500}>
                      {enoughApprove ? 'Supply' : bntSupplyTxt}
                    </Text>
                  </ButtonError>
                </RowBetween>
              </AutoColumn>
            )}
          </AutoColumn>
          <br />
          <br />
          <AutoColumn gap={'md'}>
            <ColumnCenter>
              <BlueCard>
                <AutoColumn gap="10px">
                  <TYPE.link fontWeight={400} color={'primaryText1'}>
                    Many features are currently being added refactored and polished.
                  </TYPE.link>
                  <TYPE.link fontWeight={600} color={'primaryText1'}>
                    Use at your own risk.
                  </TYPE.link>
                </AutoColumn>
              </BlueCard>
            </ColumnCenter>
          </AutoColumn>
        </Wrapper>
      </AppBody>
    </>
  )
}
