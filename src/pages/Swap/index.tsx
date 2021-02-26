import React, { useCallback, useContext, useEffect, useState } from 'react'
import { ArrowDown } from 'react-feather'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import AddressInputPanel from '../../components/AddressInputPanel'
import { ButtonConfirmed, ButtonError, ButtonLight } from '../../components/Button'
import Card, { BlueCard } from '../../components/Card'
import Column, { AutoColumn, ColumnCenter } from '../../components/Column'
import ConfirmSwapModal from '../../components/swap/ConfirmSwapModal'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import { SwapPoolTabs } from '../../components/NavigationTabs'
import { AutoRow, RowBetween } from '../../components/Row'
import { ArrowWrapper, BottomGrouping, SwapCallbackError, Wrapper } from '../../components/swap/styleds'
import TradePrice from '../../components/swap/TradePrice'
import ProgressSteps from '../../components/ProgressSteps'
import { useToggleSettingsMenu, useWalletModalToggle } from '../../state/application/hooks'
import { Field } from '../../state/swap/actions'
import { useSwapActionHandlers, useSwapCurrencyInfo, useSwapState } from '../../state/swap/hooks'
import { useExpertModeManager, useUserSlippageTolerance } from '../../state/user/hooks'
import { ExternalRedLink, LinkStyledButton, TYPE } from '../../theme'
import AppBody from '../AppBody'
import { ClickableText } from '../Pool/styleds'
import Loader from '../../components/Loader'
import { ZCurrency, ZCurrencyAmount, ZTokenAmount } from '../../zilliqa/ztoken'
import { maxAmountSpend, toQA, toTokenQA } from '../../zilliqa/utils'
import { JSBI } from '@uniswap/sdk'
import { Price } from '../../zilliqa/price'
import { useZilliqaState } from '../../state/zilliqa/rootReducer'
import { useActiveWeb3React } from '../../hooks'
import { useApproveActions } from '../../hooks/useApproveCallback'
import { useSwapActions } from '../../hooks/useSwapCallback'
import { INITIAL_ALLOWED_SLIPPAGE, requestStatus, ZERO } from '../../zilliqa/constant'
import { ROUTER_ADDRESS } from '../../constants'
import BN from 'bn.js'
import Long from 'long'
import { zilliqa } from '../../zilliqa'

export default function Swap() {
  const { account } = useActiveWeb3React()
  const theme = useContext(ThemeContext)
  const toggleWalletModal = useWalletModalToggle()
  const toggleSettings = useToggleSettingsMenu()
  const [isExpertMode] = useExpertModeManager()
  const [allowedSlippage] = useUserSlippageTolerance()
  const [showInverted, setShowInverted] = useState<boolean>(false)
  const [txHash, setTxHash] = useState<string | undefined>(undefined)
  const [currencySymbolInput, setCurrencySymbolInput] = useState<ZCurrency | null>(null)
  const [currencySymbolOutput, setCurrencySymboloutput] = useState<ZCurrency | null>(null)

  const {
    approveAuxTZStatus,
    approveAuxZTStatus,
    approveAuxZTId,
    approveAuxTZId,
    tokenToZilSwapStatus,
    tokenToZilSwapId,
    zilToTokenSwapStatus,
    zilToTokenSwapId
  } = useZilliqaState()
  // swap state
  const {
    independentField,
    typedValue,
    [Field.INPUT]: { currencyId: inputCurrencyId },
    [Field.OUTPUT]: { currencyId: outputCurrencyId },
    recipient
  } = useSwapState()
  const { onSwitchTokens, onCurrencySelection, onUserInput, onChangeRecipient } = useSwapActionHandlers()
  const [{ showConfirm, tradeToConfirm, swapErrorMessage, attemptingTxn }, setSwapState] = useState<{
    showConfirm: boolean
    tradeToConfirm: any
    attemptingTxn: boolean
    swapErrorMessage: string | undefined
  }>({
    showConfirm: false,
    tradeToConfirm: undefined,
    attemptingTxn: false,
    swapErrorMessage: undefined
  })
  const {
    currencyBalances,
    currencies,
    inputAmount,
    enoughApprove,
    slippageAdjustedAmounts,
    token,
    isExactIn
  } = useSwapCurrencyInfo()
  const [bntSupplyTxt, setBntSupplyTxt] = useState('Not Approved')

  const maxAmountInput: ZCurrencyAmount | undefined = maxAmountSpend(currencyBalances[Field.INPUT])
  const atMaxAmountInput = slippageAdjustedAmounts
    ? Boolean(maxAmountInput && slippageAdjustedAmounts[Field.INPUT]?.equalTo(maxAmountInput))
    : false
  const dependentField = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT
  const outputAmount = slippageAdjustedAmounts ? slippageAdjustedAmounts[Field.OUTPUT] : undefined
  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: slippageAdjustedAmounts[dependentField]?.toExact()
  }
  const price =
    slippageAdjustedAmounts[independentField] &&
    slippageAdjustedAmounts[dependentField] &&
    !JSBI.equal(slippageAdjustedAmounts[dependentField]?.raw ?? ZERO, ZERO) &&
    !JSBI.equal(slippageAdjustedAmounts[independentField]?.raw ?? ZERO, ZERO)
      ? new Price(
          slippageAdjustedAmounts[Field.OUTPUT]?.currency as ZCurrency,
          slippageAdjustedAmounts[Field.INPUT]?.currency as ZCurrency,
          slippageAdjustedAmounts[Field.OUTPUT]?.raw as JSBI,
          slippageAdjustedAmounts[Field.INPUT]?.raw as JSBI
        )
      : undefined

  const txParams = {
    version: 0,
    toAddr: ROUTER_ADDRESS,
    amount: new BN(0),
    gasPrice: new BN(10000),
    gasLimit: Long.fromNumber(50000)
  }
  const tx = zilliqa.transactions.new(txParams, false, false)

  const { approveAuxTZ, approveAuxZT } = useApproveActions()
  const approveStatus = inputAmount instanceof ZTokenAmount ? approveAuxTZStatus : approveAuxZTStatus
  const [approveTxConfirmed, setApproveTxConfirmed] = useState(false)
  const showApproveFlow = true
  const approveTokenAmount = '240282366920938463463374607431768211455'
  const approveCallBack = async () => {
    if (inputAmount instanceof ZTokenAmount) {
      // const inputAmountString = toTokenQA(inputAmount.toSignificant(6), inputAmount.token).toString(10)
      approveAuxTZ(inputCurrencyId ?? '', approveTokenAmount)
    } else {
      if (outputAmount !== undefined) {
        approveAuxZT(outputCurrencyId ?? '', approveTokenAmount)
      }
    }
    setBntSupplyTxt('Waiting Approve Confirmed')
  }
  useEffect(() => {
    if (approveAuxTZId) {
      tx.confirm(approveAuxTZId, 100, 2000)
        .then(() => {
          setBntSupplyTxt('Swap')
          setApproveTxConfirmed(true)
        })
        .catch(() => {
          alert('approve failed')
        })
    }
    if (approveAuxZTId) {
      tx.confirm(approveAuxZTId, 100, 2000)
        .then(() => {
          setBntSupplyTxt('Swap')
          setApproveTxConfirmed(true)
        })
        .catch(() => {
          alert('approve failed')
        })
    }
  }, [approveAuxTZStatus, approveAuxTZId, approveAuxZTStatus, approveAuxZTId])

  const { tokenToZilSwap, tokenToZilSwapOutput, zilToTokenSwap, zilToTokenSwapOutput } = useSwapActions()
  const handleSwap = useCallback(() => {
    if (inputCurrencyId === undefined && outputCurrencyId === undefined) return
    setSwapState({
      showConfirm,
      tradeToConfirm,
      attemptingTxn: true,
      swapErrorMessage
    })
    if (inputAmount instanceof ZTokenAmount) {
      if (outputAmount !== undefined) {
        const inputAmountString = toTokenQA(inputAmount.toSignificant(12), inputAmount.token).toString(10)
        const outputAmountString = toQA(outputAmount.toSignificant(12)).toString(10)
        if (isExactIn) {
          tokenToZilSwap(inputCurrencyId ?? '', inputAmountString, outputAmountString)
        } else {
          tokenToZilSwapOutput(inputCurrencyId ?? '', inputAmountString, outputAmountString)
        }
      }
    } else {
      if (outputAmount !== undefined) {
        const outputAmountString = toTokenQA(
          outputAmount.toSignificant(12),
          (outputAmount as ZTokenAmount).token
        ).toString(10)
        const inputAmountString = toQA(inputAmount.toSignificant(12)).toString(10)
        if (isExactIn) {
          zilToTokenSwap(outputCurrencyId ?? '', inputAmountString, outputAmountString)
        } else {
          zilToTokenSwapOutput(outputCurrencyId ?? '', inputAmountString, outputAmountString)
        }
      }
    }
  }, [tokenToZilSwap, zilToTokenSwap, inputCurrencyId, inputAmount, outputAmount])
  useEffect(() => {
    if (tokenToZilSwapId) {
      setTxHash(tokenToZilSwapId)
      tx.confirm(tokenToZilSwapId, 100, 2000)
        .then(() => {
          setSwapState({
            showConfirm,
            tradeToConfirm,
            attemptingTxn: false,
            swapErrorMessage: 'swap tx confirmed'
          })
        })
        .catch(() => {
          setSwapState({
            showConfirm,
            tradeToConfirm,
            attemptingTxn: false,
            swapErrorMessage: 'swap failed'
          })
        })
    }
    if (zilToTokenSwapId) {
      setTxHash(zilToTokenSwapId)
      tx.confirm(zilToTokenSwapId, 100, 2000)
        .then(() => {
          setSwapState({
            showConfirm,
            tradeToConfirm,
            attemptingTxn: false,
            swapErrorMessage
          })
        })
        .catch(() => {
          setSwapState({
            showConfirm,
            tradeToConfirm,
            attemptingTxn: false,
            swapErrorMessage: 'swap failed'
          })
        })
    }
  }, [tokenToZilSwapStatus, tokenToZilSwapId, zilToTokenSwapStatus, zilToTokenSwapId])

  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(Field.INPUT, value)
    },
    [onUserInput]
  )
  const handleMaxInput = useCallback(() => {
    maxAmountInput && onUserInput(Field.INPUT, maxAmountInput.toExact())
  }, [maxAmountInput, onUserInput])
  const handleTypeOutput = useCallback(
    (value: string) => {
      onUserInput(Field.OUTPUT, value)
    },
    [onUserInput]
  )
  const handleInputSelect = useCallback(
    inputCurrency => {
      onCurrencySelection(Field.INPUT, inputCurrency)
      setCurrencySymbolInput(inputCurrency)
    },
    [onCurrencySelection]
  )
  const handleOutputSelect = useCallback(
    outputCurrency => {
      onCurrencySelection(Field.OUTPUT, outputCurrency)
      setCurrencySymboloutput(outputCurrency)
    },
    [onCurrencySelection]
  )
  const handleConfirmDismiss = useCallback(() => {
    if (txHash) {
      onUserInput(Field.INPUT, '')
    }
    setTxHash(undefined)
    setSwapState({ showConfirm: false, tradeToConfirm, attemptingTxn: false, swapErrorMessage })
  }, [attemptingTxn, onUserInput, swapErrorMessage, tradeToConfirm, txHash])

  const handleAcceptChanges = useCallback(() => {
    setSwapState({ tradeToConfirm: undefined, swapErrorMessage, attemptingTxn, showConfirm })
  }, [attemptingTxn, showConfirm, swapErrorMessage])

  return (
    <>
      <AppBody>
        <SwapPoolTabs active={'swap'} />
        <Wrapper id="swap-page">
          <ConfirmSwapModal
            slippageAdjustedAmounts={slippageAdjustedAmounts}
            isOpen={showConfirm}
            isExactIn={isExactIn}
            onAcceptChanges={handleAcceptChanges}
            attemptingTxn={attemptingTxn}
            txHash={txHash}
            recipient={recipient}
            onConfirm={handleSwap}
            swapErrorMessage={swapErrorMessage}
            onDismiss={handleConfirmDismiss}
          />
          <AutoColumn gap={'md'}>
            <CurrencyInputPanel
              label={independentField === Field.OUTPUT ? 'From (estimated)' : 'From'}
              value={formattedAmounts[Field.INPUT] ?? ''}
              showMaxButton={!atMaxAmountInput}
              currency={currencies[Field.INPUT]}
              onUserInput={handleTypeInput}
              onMax={handleMaxInput}
              onCurrencySelect={handleInputSelect}
              otherCurrency={currencySymbolOutput}
              id="swap-currency-input"
            />
            <AutoColumn justify="space-between">
              <AutoRow justify={isExpertMode ? 'space-between' : 'center'} style={{ padding: '0 1rem' }}>
                <ArrowWrapper clickable>
                  <ArrowDown
                    size="16"
                    onClick={() => {
                      onSwitchTokens()
                    }}
                    color={currencySymbolInput && currencySymbolOutput ? theme.primary1 : theme.text2}
                  />
                </ArrowWrapper>
                {recipient === null && isExpertMode ? (
                  <LinkStyledButton id="add-recipient-button" onClick={() => onChangeRecipient('')}>
                    + Add a send (optional)
                  </LinkStyledButton>
                ) : null}
              </AutoRow>
            </AutoColumn>
            <CurrencyInputPanel
              label={independentField === Field.INPUT ? 'To (estimated)' : 'To'}
              value={formattedAmounts[Field.OUTPUT] ?? ''}
              onUserInput={handleTypeOutput}
              showMaxButton={false}
              currency={currencies[Field.OUTPUT]}
              onCurrencySelect={handleOutputSelect}
              otherCurrency={currencySymbolInput}
              id="swap-currency-output"
            />
            {recipient !== null ? (
              <>
                <AutoRow justify="space-between" style={{ padding: '0 1rem' }}>
                  <ArrowWrapper clickable={false}>
                    <ArrowDown size="16" color={theme.text2} />
                  </ArrowWrapper>
                  <LinkStyledButton id="remove-recipient-button" onClick={() => onChangeRecipient(null)}>
                    - Remove send
                  </LinkStyledButton>
                </AutoRow>
                <AddressInputPanel id="recipient" value={recipient} onChange={onChangeRecipient} />
              </>
            ) : null}

            {
              <Card padding={'.25rem .75rem 0 .75rem'} borderRadius={'20px'}>
                <AutoColumn gap="4px">
                  <RowBetween align="center">
                    <Text fontWeight={500} fontSize={14} color={theme.text2}>
                      Price
                    </Text>
                    <TradePrice price={price} showInverted={showInverted} setShowInverted={setShowInverted} />
                  </RowBetween>
                  {allowedSlippage !== INITIAL_ALLOWED_SLIPPAGE && (
                    <RowBetween align="center">
                      <ClickableText fontWeight={500} fontSize={14} color={theme.text2} onClick={toggleSettings}>
                        Slippage Tolerance
                      </ClickableText>
                      <ClickableText fontWeight={500} fontSize={14} color={theme.text2} onClick={toggleSettings}>
                        {allowedSlippage / 100}%
                      </ClickableText>
                    </RowBetween>
                  )}
                </AutoColumn>
              </Card>
            }
          </AutoColumn>
          <BottomGrouping>
            {!account ? (
              <ButtonLight onClick={toggleWalletModal}>Connect Wallet</ButtonLight>
            ) : (
              <RowBetween>
                {!enoughApprove && (
                  <ButtonConfirmed
                    onClick={approveCallBack}
                    width="48%"
                    altDisabledStyle={enoughApprove} // show solid button while waiting
                    confirmed={approveTxConfirmed}
                  >
                    {approveStatus === requestStatus.PENDING ? (
                      <AutoRow gap="6px" justify="center">
                        Approving <Loader stroke="white" />
                      </AutoRow>
                    ) : approveTxConfirmed ? (
                      'Approved'
                    ) : (
                      'Approve ' + (token?.symbol ?? '')
                    )}
                  </ButtonConfirmed>
                )}
                <ButtonError
                  onClick={() => {
                    if (isExpertMode) {
                      handleSwap()
                    } else {
                      setSwapState({
                        tradeToConfirm: undefined,
                        attemptingTxn: false,
                        swapErrorMessage: undefined,
                        showConfirm: true
                      })
                    }
                  }}
                  width={enoughApprove ? '100%' : '48%'}
                  id="swap-button"
                  disabled={!enoughApprove ? !approveTxConfirmed : false}
                  error={false}
                >
                  <Text fontSize={16} fontWeight={500}>
                    {enoughApprove ? 'Swap' : bntSupplyTxt}
                  </Text>
                </ButtonError>
              </RowBetween>
            )}
            {showApproveFlow && (
              <Column style={{ marginTop: '1rem' }}>
                <ProgressSteps steps={[enoughApprove]} />
              </Column>
            )}
            {swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
          </BottomGrouping>
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
                  <TYPE.link fontWeight={800} color={'red2'}>
                    Any Question please read{' '}
                    <ExternalRedLink href="https://steemit.com/zillqa/@zyro.finance/zyro-mining-faq">
                      FAQ
                    </ExternalRedLink>
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
