import React, { useCallback, useEffect, useState } from 'react'
import { Text } from 'rebass'
import { ButtonConfirmed, ButtonError, ButtonLight } from '../../components/Button'
import Column, { AutoColumn } from '../../components/Column'
import { AutoRow, RowBetween } from '../../components/Row'
import { BottomGrouping, Wrapper } from '../../components/swap/styleds'
import ProgressSteps from '../../components/ProgressSteps'

import { useActiveWeb3React } from '../../hooks'
import { useWalletModalToggle } from '../../state/application/hooks'
import { LinkStyledButton } from '../../theme'
import AppBody from '../AppBody'
import { JSBI } from '@uniswap/sdk'
import MessageConfirmationModal from '../../components/MessageConfirmationModal'
import { useCurrencyBalance, ZToken, ZTokenAmount } from '../../zilliqa/ztoken'
import { useApproveActions } from '../../hooks/useApproveCallback'
import Loader from '../../components/Loader'
import axios from 'axios'
import { useZilliqaState } from '../../state/zilliqa/rootReducer'
import CommonInputPanel from '../../components/CommonInputPanel'
import { ADJUSTED_APPROVE_AMOUNT, requestStatus, ZChainId } from '../../zilliqa/constant'

export const TEN = JSBI.BigInt(10)

export default function Convert() {
  const { account } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()

  // for zilliqa testnet
  // const zyroAddress = '0xf5c063dd27da67e5884aa8a68072873e0df5c2e8'
  // for zilliqa mainnet
  const zyroAddress = '0xe61839a9463c75a6082ea2fd0e6b24dfd5de605c'
  const zyro = new ZToken(ZChainId.MAINNET, zyroAddress, 8, 'ZYRO', 'zyro')
  const zyroBalance = useCurrencyBalance(zyro, account ?? '')
  const [approveAmount, setApproveAmount] = useState('0')
  const amount = JSBI.add(JSBI.BigInt(approveAmount), JSBI.exponentiate(TEN, JSBI.BigInt(zyro.decimals + 2)))
  const testAmount = new ZTokenAmount(zyro, amount)
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)
  const { authorizeToken } = useApproveActions()
  const { authorizeTokenStatus } = useZilliqaState()

  const approveCallBack = async () => {
    authorizeToken(zyroAddress, JSBI.ADD(ADJUSTED_APPROVE_AMOUNT, testAmount?.numerator).toString(10))
  }
  const changeApproveAmount = (e: any) => {
    setApproveAmount(e)
  }

  // const setConverted = async () => {
  //   const options = {
  //     headers: { 'content-type': 'application/x-www-form-urlencoded' },
  //     data: { address: 123, value: 123 },
  //     url: '/claim/converted'
  //   }
  //   return axios(options)
  // }
  // const options = {
  //   crossDomain: true
  // }
  axios.defaults.baseURL = 'https://api.zyro.finance'
  // axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded'
  axios.defaults.headers.get['Content-Security-Policy'] = 'upgrade-insecure-requests'
  useEffect(() => {
    axios.get('/claim/converted').then(resp => {
      const value = resp.data
      setApproveAmount(value)
    })
  }, [])
  const handleConvert = () => {
    axios.get('/claim/convert').then(resp => {
      const value = resp.data
      console.log(value)
      value.forEach((v: any) => alert(v.Zil + '==' + v.Converted))
    })
  }

  const [showConfirm, setShowConfirm] = useState(false)
  const handleConfirmDismiss = useCallback(() => {
    setShowConfirm(false)
  }, [showConfirm])

  useEffect(() => {
    if (authorizeTokenStatus === requestStatus.PENDING) {
      setApprovalSubmitted(true)
    }
  }, [authorizeTokenStatus, approvalSubmitted])

  return (
    <>
      <AppBody>
        <MessageConfirmationModal isOpen={showConfirm} onDismiss={handleConfirmDismiss} />
        <Wrapper id="swap-page">
          <AutoColumn gap={'md'}>
            <>
              <CommonInputPanel
                placeHolder="approved amount"
                id="recipient"
                value={testAmount.toExact() ?? ''}
                onChange={changeApproveAmount}
              />
            </>
          </AutoColumn>
          <BottomGrouping>
            {!account ? (
              <ButtonLight onClick={toggleWalletModal}>Connect Wallet</ButtonLight>
            ) : (
              <RowBetween>
                <ButtonConfirmed
                  onClick={approveCallBack}
                  disabled={approvalSubmitted}
                  width="48%"
                  altDisabledStyle={authorizeTokenStatus === requestStatus.PENDING} // show solid button while waiting
                  confirmed={authorizeTokenStatus === requestStatus.SUCCEED}
                >
                  {authorizeTokenStatus === requestStatus.PENDING ? (
                    <AutoRow gap="6px" justify="center">
                      Approving <Loader stroke="white" />
                    </AutoRow>
                  ) : approvalSubmitted && authorizeTokenStatus === requestStatus.SUCCEED ? (
                    'Submitted'
                  ) : (
                    'Approve ' + zyro?.symbol ?? ''
                  )}
                </ButtonConfirmed>
                <ButtonError
                  onClick={() => {
                    handleConvert()
                  }}
                  width="48%"
                  id="swap-button"
                  error={false}
                >
                  <Text fontSize={16} fontWeight={500}>
                    Transfer
                  </Text>
                </ButtonError>
              </RowBetween>
            )}
            <Column style={{ marginTop: '1rem' }}>
              <ProgressSteps steps={[authorizeTokenStatus === requestStatus.SUCCEED]} />
            </Column>
            <Column style={{ marginTop: '1rem' }}>
              <AutoRow justify="space-between" style={{ padding: '0 1rem' }}>
                <LinkStyledButton id="remove-recipient-button">
                  Your Available ZYRO: {zyroBalance?.toExact() ?? '0'}
                </LinkStyledButton>
              </AutoRow>
            </Column>
          </BottomGrouping>
        </Wrapper>
      </AppBody>
    </>
  )
}
