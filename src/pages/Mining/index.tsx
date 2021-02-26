import React, { useEffect } from 'react'
import { AutoColumn } from '../../components/Column'
import styled from 'styled-components'
import { TYPE, ExternalLink } from '../../theme'
import { RowBetween } from '../../components/Row'
import { Link } from 'react-router-dom'

import { Button } from 'rebass/styled-components'
import { darken } from 'polished'
import { CardSection, DataCard, CardNoise, CardBGImage } from '../../components/earn/styled'
import Loader from '../../components/Loader'
import axios from 'axios'

const PageWrapper = styled(AutoColumn)``

const TopSection = styled(AutoColumn)`
  max-width: 640px;
  width: 100%;
`

const Proposal = styled(Button)`
  padding: 0.75rem 1rem;
  width: 100%;
  margin-top: 1rem;
  border-radius: 12px;
  display: grid;
  grid-template-columns: 48px 1fr 120px;
  align-items: center;
  text-align: left;
  outline: none;
  cursor: pointer;
  color: ${({ theme }) => theme.text1};
  text-decoration: none;
  background-color: ${({ theme }) => theme.bg1};
  &:focus {
    background-color: ${({ theme }) => darken(0.05, theme.bg1)};
  }
  &:hover {
    background-color: ${({ theme }) => darken(0.05, theme.bg1)};
  }
`

const ProposalTitle = styled.span`
  font-weight: 600;
`

const VoteCard = styled(DataCard)`
  background: radial-gradient(76.02% 75.41% at 1.84% 0%, #27ae60 0%, #000000 100%);
  overflow: hidden;
`

const WrapSmall = styled(RowBetween)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-wrap: wrap;
  
  `};
`

const EmptyProposals = styled.div`
  border: 1px solid ${({ theme }) => theme.text4};
  padding: 16px 12px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`

export default function Mining() {
  // const account = useActiveWeb3React()

  // user data
  let availableEvents: string[] = []

  axios.defaults.baseURL = 'http://3.134.112.224:8999'
  axios.defaults.headers.get['Content-Security-Policy'] = 'upgrade-insecure-requests'
  useEffect(() => {
    axios.get('/mining/events/0').then(resp => {
      const content: string = resp.data
      availableEvents = content.split('\n')
    })
  }, [])

  return (
    <PageWrapper gap="lg" justify="center">
      <TopSection gap="md">
        <VoteCard>
          <CardBGImage />
          <CardNoise />
          <CardSection>
            <AutoColumn gap="md">
              <RowBetween>
                <TYPE.white fontWeight={600}>Zyro Mining For Trade And Liquidity</TYPE.white>
              </RowBetween>
              <RowBetween>
                <TYPE.white fontSize={14}>
                  Whenever you trade or provide liquidity in zyro.finance,you will be given a incentive with zyro.
                </TYPE.white>
              </RowBetween>
              <ExternalLink
                style={{ color: 'white', textDecoration: 'underline' }}
                href="https://zyro.finance"
                target="_blank"
              >
                <TYPE.white fontSize={14}>Read more about zyro mining</TYPE.white>
              </ExternalLink>
            </AutoColumn>
          </CardSection>
          <CardBGImage />
          <CardNoise />
        </VoteCard>
      </TopSection>
      <TopSection gap="2px">
        <WrapSmall>
          <TYPE.mediumHeader style={{ margin: '0.5rem 0' }}>Records</TYPE.mediumHeader>
          {<Loader />}
        </WrapSmall>
        {availableEvents?.length === 0 && (
          <EmptyProposals>
            <TYPE.body style={{ marginBottom: '8px' }}>No records found.</TYPE.body>
            <TYPE.subHeader>
              <i>mining records will appear here.</i>
            </TYPE.subHeader>
          </EmptyProposals>
        )}
        {availableEvents?.map((p: string, i) => {
          return (
            <Proposal as={Link} to={'/mining/events/'} key={i}>
              <ProposalTitle>p</ProposalTitle>
            </Proposal>
          )
        })}
      </TopSection>
      <TYPE.subHeader color="text3">生态挖矿75%，其中交易挖矿25%，提供流通性挖矿25%，节点挖矿25%</TYPE.subHeader>
    </PageWrapper>
  )
}
