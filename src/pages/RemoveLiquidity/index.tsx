import React, { useCallback, useContext, useEffect, useState } from 'react'
import { ArrowDown, Plus } from 'react-feather'
import { RouteComponentProps } from 'react-router'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { ButtonConfirmed, ButtonError, ButtonLight, ButtonPrimary } from '../../components/Button'
import { LightCard } from '../../components/Card'
import { AutoColumn, ColumnCenter } from '../../components/Column'
import TransactionConfirmationModal, { ConfirmationModalContent } from '../../components/TransactionConfirmationModal'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import DoubleCurrencyLogo from '../../components/DoubleLogo'
import { AddRemoveTabs } from '../../components/NavigationTabs'
import Row, { RowBetween, RowFixed } from '../../components/Row'

import Slider from '../../components/Slider'
import CurrencyLogo from '../../components/CurrencyLogo'
import { useActiveWeb3React } from '../../hooks'
import { TYPE } from '../../theme'
import { currencyId } from '../../utils/currencyId'
import useDebouncedChangeHandler from '../../utils/useDebouncedChangeHandler'
import AppBody from '../AppBody'
import { MaxButton, Wrapper } from '../Pool/styleds'
import { Dots } from '../../components/swap/styleds'
import { useBurnActionHandlers, useBurnInfo, useBurnState } from '../../state/burn/hooks'
import { Field } from '../../state/burn/actions'
import { useWalletModalToggle } from '../../state/application/hooks'
import { useUserSlippageTolerance } from '../../state/user/hooks'
import { useCurrency, ZCurrency } from '../../zilliqa/ztoken'
import { Percent } from '../../zilliqa/percent'
import { useZilliqaState } from '../../state/zilliqa/rootReducer'
import { CurrentChainId, requestStatus, Rounding } from '../../zilliqa/constant'
import { zilliqa, ZLPT } from '../../zilliqa'
import { toQA, toTokenQA } from '../../zilliqa/utils'
import { useRouterActions } from '../../hooks/useApproveCallback'
import { ROUTER_ADDRESS } from '../../constants'
import BN from 'bn.js'
import Long from 'long'

export default function RemoveLiquidity({
  history,
  match: {
    params: { currencyIdA, currencyIdB }
  }
}: RouteComponentProps<{ currencyIdA: string; currencyIdB: string }>) {
  const { account } = useActiveWeb3React()
  const theme = useContext(ThemeContext)
  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()
  const [allowedSlippage] = useUserSlippageTolerance()

  const currencyA = useCurrency(currencyIdA)
  const currencyB = useCurrency(currencyIdB)
  const tokenAddress = currencyIdA === 'ZIL' ? currencyIdB : currencyIdA

  // burn state
  const { approveAuxLMStatus, approveAuxLMId, removeLiquidityStatus, removeLiquidityId } = useZilliqaState()
  const { independentField, typedValue } = useBurnState()
  const { onUserInput: _onUserInput } = useBurnActionHandlers()

  const { parsedAmounts, error, tokenField, enoughApprove } = useBurnInfo(
    currencyA ?? undefined,
    currencyB ?? undefined
  )
  const isValid = !error
  const zilField = tokenField === Field.CURRENCY_A ? Field.CURRENCY_B : Field.CURRENCY_A
  const approval = approveAuxLMStatus

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState(false) // clicked confirm
  const showDetailed = false

  // txn values
  const [txHash, setTxHash] = useState<string | undefined>(undefined)

  const formattedAmounts = {
    [Field.LIQUIDITY_PERCENT]: parsedAmounts[Field.LIQUIDITY_PERCENT].equalTo('0')
      ? '0'
      : parsedAmounts[Field.LIQUIDITY_PERCENT].lessThan(new Percent('1', '100'))
      ? '<1'
      : parsedAmounts[Field.LIQUIDITY_PERCENT].toFixed(0),
    [Field.LIQUIDITY]:
      independentField === Field.LIQUIDITY ? typedValue : parsedAmounts[Field.LIQUIDITY]?.toSignificant(12) ?? '',
    [Field.CURRENCY_A]:
      independentField === Field.CURRENCY_A ? typedValue : parsedAmounts[Field.CURRENCY_A]?.toSignificant(12) ?? '',
    [Field.CURRENCY_B]:
      independentField === Field.CURRENCY_B ? typedValue : parsedAmounts[Field.CURRENCY_B]?.toSignificant(12) ?? ''
  }

  const atMaxAmount = parsedAmounts[Field.LIQUIDITY_PERCENT]?.equalTo(new Percent('1'))

  // wrapped onUserInput to clear signatures
  const onUserInput = useCallback(
    (field: Field, typedValue: string) => {
      return _onUserInput(field, typedValue)
    },
    [_onUserInput]
  )

  const onLiquidityInput = useCallback((typedValue: string): void => onUserInput(Field.LIQUIDITY, typedValue), [
    onUserInput
  ])
  const onCurrencyAInput = useCallback((typedValue: string): void => onUserInput(Field.CURRENCY_A, typedValue), [
    onUserInput
  ])
  const onCurrencyBInput = useCallback((typedValue: string): void => onUserInput(Field.CURRENCY_B, typedValue), [
    onUserInput
  ])

  const { approveAuxLM } = useRouterActions()
  const { removeLiquidity } = useRouterActions()

  const [approveTxConfirmed, setApproveTxConfirmed] = useState(false)
  const [bntSupplyTxt, setBntSupplyTxt] = useState('Not Approved')
  const tokenAmount = parsedAmounts[tokenField]?.toSignificant(12, { groupSeparator: '' }, Rounding.ROUND_DOWN)
  const approveTokenAmount = '240282366920938463463374607431768211455'
  const tokenAmountString = toTokenQA(tokenAmount ?? '0', ZLPT[CurrentChainId]).toString(10)
  const handleApprove = () => {
    if (currencyA === undefined || currencyB === undefined) return
    approveAuxLM(tokenAddress, approveTokenAmount, true)
    setBntSupplyTxt('Waiting Approve confirmed')
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
          setBntSupplyTxt('Remove')
          setApproveTxConfirmed(true)
        })
        .catch(() => {
          alert('approve failed')
        })
    }
  }, [approveAuxLMStatus, approveAuxLMId])

  // tx sending
  const liqAmountString = toTokenQA(
    parsedAmounts[Field.LIQUIDITY]?.toSignificant(12, { groupSeparator: '' }, Rounding.ROUND_DOWN) ?? '0',
    ZLPT[CurrentChainId]
  ).toString(10)
  const zilAmountString = toQA(
    parsedAmounts[zilField]?.toSignificant(12, { groupSeparator: '' }, Rounding.ROUND_DOWN) ?? '0'
  ).toString(10)

  async function onRemove() {
    if (currencyA === undefined || currencyB === undefined) return
    account !== null &&
      account !== undefined &&
      removeLiquidity(tokenAddress, liqAmountString, zilAmountString, tokenAmountString, account)
    setAttemptingTxn(true)
  }
  useEffect(() => {
    if (removeLiquidityId) {
      setTxHash(removeLiquidityId)
      tx.confirm(removeLiquidityId, 100, 2000)
        .then(() => {
          setAttemptingTxn(false)
        })
        .catch(e => console.log(e))
    }
  }, [removeLiquidityStatus, removeLiquidityId])

  const pendingText = `Removing ${parsedAmounts[Field.CURRENCY_A]?.toSignificant(12)} ${
    currencyA?.symbol
  } and ${parsedAmounts[Field.CURRENCY_B]?.toSignificant(12)} ${currencyB?.symbol}`

  const liquidityPercentChangeCallback = useCallback(
    (value: number) => {
      onUserInput(Field.LIQUIDITY_PERCENT, value.toString())
    },
    [onUserInput]
  )
  const handleSelectCurrencyA = useCallback(
    (currency: ZCurrency) => {
      if (currencyIdB && currencyId(currency) === currencyIdB) {
        history.push(`/remove/${currencyId(currency)}/${currencyIdA}`)
      } else {
        history.push(`/remove/${currencyId(currency)}/${currencyIdB}`)
      }
    },
    [currencyIdA, currencyIdB, history]
  )
  const handleSelectCurrencyB = useCallback(
    (currency: ZCurrency) => {
      if (currencyIdA && currencyId(currency) === currencyIdA) {
        history.push(`/remove/${currencyIdB}/${currencyId(currency)}`)
      } else {
        history.push(`/remove/${currencyIdA}/${currencyId(currency)}`)
      }
    },
    [currencyIdA, currencyIdB, history]
  )

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onUserInput(Field.LIQUIDITY_PERCENT, '0')
    }
    setTxHash(undefined)
    setAttemptingTxn(false)
  }, [onUserInput, txHash])

  const [innerLiquidityPercentage, setInnerLiquidityPercentage] = useDebouncedChangeHandler(
    Number.parseInt(parsedAmounts[Field.LIQUIDITY_PERCENT].toFixed(2)),
    liquidityPercentChangeCallback
  )

  function modalHeader() {
    return (
      <AutoColumn gap={'md'} style={{ marginTop: '20px' }}>
        <RowBetween align="flex-end">
          <Text fontSize={24} fontWeight={500}>
            {parsedAmounts[Field.CURRENCY_A]?.toSignificant(12)}
          </Text>
          <RowFixed gap="4px">
            <CurrencyLogo currency={currencyA} size={'24px'} />
            <Text fontSize={24} fontWeight={500} style={{ marginLeft: '10px' }}>
              {currencyA?.symbol}
            </Text>
          </RowFixed>
        </RowBetween>
        <RowFixed>
          <Plus size="16" color={theme.text2} />
        </RowFixed>
        <RowBetween align="flex-end">
          <Text fontSize={24} fontWeight={500}>
            {parsedAmounts[Field.CURRENCY_B]?.toSignificant(12)}
          </Text>
          <RowFixed gap="4px">
            <CurrencyLogo currency={currencyB} size={'24px'} />
            <Text fontSize={24} fontWeight={500} style={{ marginLeft: '10px' }}>
              {currencyB?.symbol}
            </Text>
          </RowFixed>
        </RowBetween>

        <TYPE.italic fontSize={12} color={theme.text2} textAlign="left" padding={'12px 0 0 0'}>
          {`Output is estimated. If the price changes by more than ${allowedSlippage /
            100}% your transaction will revert.`}
        </TYPE.italic>
      </AutoColumn>
    )
  }

  function modalBottom() {
    return (
      <>
        <RowBetween>
          <Text color={theme.text2} fontWeight={500} fontSize={16}>
            {currencyA?.symbol + '/' + currencyB?.symbol} Burned
          </Text>
          <RowFixed>
            <DoubleCurrencyLogo currency0={currencyA} currency1={currencyB} margin={true} />
            <Text fontWeight={500} fontSize={16}>
              {parsedAmounts[Field.LIQUIDITY]?.toSignificant(12)}
            </Text>
          </RowFixed>
        </RowBetween>
        <ButtonPrimary onClick={onRemove}>
          <Text fontWeight={500} fontSize={20}>
            {'Confirm'}
          </Text>
        </ButtonPrimary>
      </>
    )
  }

  return (
    <>
      <AppBody>
        <AddRemoveTabs creating={false} adding={false} />
        <Wrapper>
          <TransactionConfirmationModal
            isOpen={showConfirm}
            onDismiss={handleDismissConfirmation}
            attemptingTxn={attemptingTxn}
            hash={txHash ? txHash : ''}
            content={() => (
              <ConfirmationModalContent
                title={'You will receive'}
                onDismiss={handleDismissConfirmation}
                topContent={modalHeader}
                bottomContent={modalBottom}
              />
            )}
            pendingText={pendingText}
          />
          <AutoColumn gap="md">
            <LightCard>
              <AutoColumn gap="20px">
                <RowBetween>
                  <Text fontWeight={500}>{formattedAmounts[Field.LIQUIDITY]}</Text>
                </RowBetween>
                <Row style={{ alignItems: 'flex-end' }}>
                  <Text fontSize={72} fontWeight={500}>
                    {formattedAmounts[Field.LIQUIDITY_PERCENT]}%
                  </Text>
                </Row>
                {!showDetailed && (
                  <>
                    <Slider value={innerLiquidityPercentage} onChange={setInnerLiquidityPercentage} />
                    <RowBetween>
                      <MaxButton onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '25')} width="20%">
                        25%
                      </MaxButton>
                      <MaxButton onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '50')} width="20%">
                        50%
                      </MaxButton>
                      <MaxButton onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '75')} width="20%">
                        75%
                      </MaxButton>
                      <MaxButton onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '100')} width="20%">
                        Max
                      </MaxButton>
                    </RowBetween>
                  </>
                )}
              </AutoColumn>
            </LightCard>
            {!showDetailed && (
              <>
                <ColumnCenter>
                  <ArrowDown size="16" color={theme.text2} />
                </ColumnCenter>
                <LightCard>
                  <AutoColumn gap="10px">
                    <RowBetween>
                      <Text fontSize={24} fontWeight={500}>
                        {formattedAmounts[Field.CURRENCY_A] || '-'}
                      </Text>
                      <RowFixed>
                        <CurrencyLogo currency={currencyA} style={{ marginRight: '12px' }} />
                        <Text fontSize={24} fontWeight={500} id="remove-liquidity-tokena-symbol">
                          {currencyA?.symbol}
                        </Text>
                      </RowFixed>
                    </RowBetween>
                    <RowBetween>
                      <Text fontSize={24} fontWeight={500}>
                        {formattedAmounts[Field.CURRENCY_B] || '-'}
                      </Text>
                      <RowFixed>
                        <CurrencyLogo currency={currencyB} style={{ marginRight: '12px' }} />
                        <Text fontSize={24} fontWeight={500} id="remove-liquidity-tokenb-symbol">
                          {currencyB?.symbol}
                        </Text>
                      </RowFixed>
                    </RowBetween>
                  </AutoColumn>
                </LightCard>
              </>
            )}

            {showDetailed && (
              <>
                <CurrencyInputPanel
                  value={formattedAmounts[Field.LIQUIDITY]}
                  onUserInput={onLiquidityInput}
                  onMax={() => {
                    onUserInput(Field.LIQUIDITY_PERCENT, '100')
                  }}
                  showMaxButton={!atMaxAmount}
                  disableCurrencySelect
                  currency={ZLPT[CurrentChainId]}
                  id="liquidity-amount"
                />
                <ColumnCenter>
                  <ArrowDown size="16" color={theme.text2} />
                </ColumnCenter>
                <CurrencyInputPanel
                  hideBalance={true}
                  value={formattedAmounts[Field.CURRENCY_A]}
                  onUserInput={onCurrencyAInput}
                  onMax={() => onUserInput(Field.LIQUIDITY_PERCENT, '100')}
                  showMaxButton={!atMaxAmount}
                  currency={currencyA}
                  label={'Output'}
                  onCurrencySelect={handleSelectCurrencyA}
                  id="remove-liquidity-tokena"
                />
                <ColumnCenter>
                  <Plus size="16" color={theme.text2} />
                </ColumnCenter>
                <CurrencyInputPanel
                  hideBalance={true}
                  value={formattedAmounts[Field.CURRENCY_B]}
                  onUserInput={onCurrencyBInput}
                  onMax={() => onUserInput(Field.LIQUIDITY_PERCENT, '100')}
                  showMaxButton={!atMaxAmount}
                  currency={currencyB}
                  label={'Output'}
                  onCurrencySelect={handleSelectCurrencyB}
                  id="remove-liquidity-tokenb"
                />
              </>
            )}
            <div style={{ position: 'relative' }}>
              {!account ? (
                <ButtonLight onClick={toggleWalletModal}>Connect Wallet</ButtonLight>
              ) : (
                <RowBetween>
                  {!enoughApprove && (
                    <ButtonConfirmed
                      onClick={handleApprove}
                      confirmed={approval === requestStatus.SUCCEED}
                      disabled={approval !== requestStatus.FAILED && approval !== undefined}
                      mr="0.5rem"
                      fontWeight={500}
                      fontSize={16}
                    >
                      {approval === requestStatus.PENDING ? <Dots>Approving</Dots> : 'Approve ZYRO'}
                    </ButtonConfirmed>
                  )}
                  <ButtonError
                    onClick={() => {
                      setShowConfirm(true)
                    }}
                    disabled={!enoughApprove ? !approveTxConfirmed : false}
                    error={!isValid && !!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B]}
                  >
                    <Text fontSize={16} fontWeight={500}>
                      {enoughApprove ? 'Remove' : bntSupplyTxt}
                    </Text>
                  </ButtonError>
                </RowBetween>
              )}
            </div>
          </AutoColumn>
        </Wrapper>
      </AppBody>
    </>
  )
}
