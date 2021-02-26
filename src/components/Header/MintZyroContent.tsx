import React, { useEffect, useState } from 'react'
import { X } from 'react-feather'
import styled from 'styled-components'
import tokenLogo from '../../assets/images/zyrologo.png'
import { useActiveWeb3React } from '../../hooks'
import { TYPE, UniTokenAnimated } from '../../theme'
import { AutoColumn } from '../Column'
import { RowBetween } from '../Row'
import { Break, CardBGImage, CardNoise, CardSection, DataCard } from '../earn/styled'
import { ZToken, ZTokenAmount } from '../../zilliqa/ztoken'
import { baseUrl, CurrentChainId, ZYRO_ADDRESS } from '../../zilliqa/constant'
import { ButtonPrimary } from '../Button'
import { Text } from 'rebass'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
`

const ModalUpper = styled(DataCard)`
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  background: radial-gradient(76.02% 75.41% at 1.84% 0%, #ff007a 0%, #021d43 100%);
  padding: 0.5rem;
`

const StyledClose = styled(X)`
  position: absolute;
  right: 16px;
  top: 16px;

  :hover {
    cursor: pointer;
  }
`

/**
 * Content for balance stats modal
 */
export default function MintZyroContent({ setShowUniBalanceModal }: { setShowUniBalanceModal: any }) {
  const { account } = useActiveWeb3React()
  const ztoken = new ZToken(CurrentChainId, ZYRO_ADDRESS, 8, 'zyro', 'zyro')
  const zeroZyro = new ZTokenAmount(ztoken, '0')
  const [totalClaimed, setTotalClaimed] = useState(zeroZyro)
  const [dailyClaimed, setDailyClaimed] = useState(zeroZyro)
  const [canClaimed, setCanClaimed] = useState(false)

  useEffect(() => {
    fetch(baseUrl + '/info/account/mint/liguidity/' + account, {
      method: 'GET',
      headers: {
        'Content-Security-Policy': 'upgrade-insecure-requests',
        accept: 'application/json'
      }
    })
      .then(resp => {
        return resp.json()
      })
      .then(obj => {
        console.log(obj)
        setTotalClaimed(new ZTokenAmount(ztoken, obj.value))
      })
  }, [account])

  useEffect(() => {
    fetch(baseUrl + '/claim/amount/' + account + '/' + 0, {
      method: 'GET',
      headers: {
        'Content-Security-Policy': 'upgrade-insecure-requests'
      }
    })
      .then(resp => {
        return resp.json()
      })
      .then(obj => {
        console.log(obj)
        setDailyClaimed(new ZTokenAmount(ztoken, obj.amount.Value))
      })
  }, [account])

  const handleClaimTransfer = () => {
    fetch(baseUrl + '/claim/transfer/' + account + '/' + 0, {
      method: 'GET',
      headers: {
        'Content-Security-Policy': 'upgrade-insecure-requests'
      }
    }).then(resp => {
      alert('claimed successfully!')
      setCanClaimed(true)
      console.log(resp.body)
    })
  }

  return (
    <ContentWrapper gap="lg">
      <ModalUpper>
        <CardBGImage />
        <CardNoise />
        <CardSection gap="md">
          <RowBetween>
            <TYPE.white color="white">Claim Your Zyro</TYPE.white>
            <StyledClose stroke="white" onClick={() => setShowUniBalanceModal(false)} />
          </RowBetween>
        </CardSection>
        <Break />
        {account && (
          <>
            <CardSection gap="sm">
              <AutoColumn gap="md" justify="center">
                <UniTokenAnimated width="48px" src={tokenLogo} />{' '}
                <TYPE.white fontSize={48} fontWeight={600} color="white">
                  {dailyClaimed?.toFixed(2, { groupSeparator: ',' })}
                </TYPE.white>
              </AutoColumn>
              <AutoColumn gap="md">
                <RowBetween>
                  <TYPE.white color="white">Total:</TYPE.white>
                  <TYPE.white color="white">{totalClaimed?.toFixed(2, { groupSeparator: ',' })}</TYPE.white>
                </RowBetween>
              </AutoColumn>
            </CardSection>
            <Break />
          </>
        )}
        <CardSection gap="sm">
          <AutoColumn gap="md">
            <ButtonPrimary disabled={canClaimed} style={{ margin: '20px 0 0 0' }} onClick={handleClaimTransfer}>
              <Text fontWeight={500} fontSize={20}>
                Claim
              </Text>
            </ButtonPrimary>
          </AutoColumn>
        </CardSection>
      </ModalUpper>
    </ContentWrapper>
  )
}
