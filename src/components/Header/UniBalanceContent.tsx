import React from 'react'
import { X } from 'react-feather'
import styled from 'styled-components'
import tokenLogo from '../../assets/images/zyrologo.png'
import { useActiveWeb3React } from '../../hooks'
import { TYPE, UniTokenAnimated } from '../../theme'
import { AutoColumn } from '../Column'
import { RowBetween } from '../Row'
import { Break, CardBGImage, CardNoise, CardSection, DataCard } from '../earn/styled'
import { useTokenBalance, ZTokenAmount } from '../../zilliqa/ztoken'
import { CurrentChainId } from '../../zilliqa/constant'
import { ZLPT } from '../../zilliqa'

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
export default function UniBalanceContent({ setShowUniBalanceModal }: { setShowUniBalanceModal: any }) {
  const { account } = useActiveWeb3React()
  const zlpt = ZLPT[CurrentChainId]

  const total = useTokenBalance(zlpt, account ?? '')
  const uniBalance: ZTokenAmount | undefined = total
  // const totalSupply: ZTokenAmount = total ?? ZERO_AMOUNT
  // const uniPrice = new Price(ZLPT, ZIL, '100', '100')
  // const blockTimestamp = useCurrentBlockTimestamp()
  // const unclaimedUni = useTokenBalance(useMerkleDistributorContract()?.address, uni)
  // const circulation: TokenAmount | undefined = useMemo(
  //   () =>
  //     blockTimestamp && uni && chainId === ChainId.MAINNET
  //       ? computeUniCirculation(uni, blockTimestamp, unclaimedUni)
  //       : totalSupply,
  //   [blockTimestamp, chainId, totalSupply, unclaimedUni, uni]
  // )

  return (
    <ContentWrapper gap="lg">
      <ModalUpper>
        <CardBGImage />
        <CardNoise />
        <CardSection gap="md">
          <RowBetween>
            <TYPE.white color="white">Your ZLPT Breakdown</TYPE.white>
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
                  {total?.toFixed(2, { groupSeparator: ',' })}
                </TYPE.white>
              </AutoColumn>
              <AutoColumn gap="md">
                <RowBetween>
                  <TYPE.white color="white">Balance:</TYPE.white>
                  <TYPE.white color="white">{uniBalance?.toFixed(2, { groupSeparator: ',' })}</TYPE.white>
                </RowBetween>
              </AutoColumn>
            </CardSection>
            <Break />
          </>
        )}
        <CardSection gap="sm">
          <AutoColumn gap="md">
            {/*<RowBetween>*/}
            {/*  <TYPE.white color="white">Total Supply</TYPE.white>*/}
            {/*  <TYPE.white color="white">{totalSupply?.toFixed(0, { groupSeparator: ',' })}</TYPE.white>*/}
            {/*</RowBetween>*/}
            ZLPT is a certificate of the liquidity you provide in a certain pool. The amount of zLPT represents the share of liquidity you have in a pool.
            {/*{zlpt && zlpt.chainId === ZChainId.MAINNET ? (*/}
            {/*  <ExternalLink href={`https://swap.zyro.finance/451.html`}>View ZLPT Analytics</ExternalLink>*/}
            {/*) : null}*/}
          </AutoColumn>
        </CardSection>
      </ModalUpper>
    </ContentWrapper>
  )
}
