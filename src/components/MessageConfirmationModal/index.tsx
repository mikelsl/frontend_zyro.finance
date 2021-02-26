import React from 'react'
import styled from 'styled-components'
import Modal from '../Modal'
import { Text } from 'rebass'
import { TYPE } from '../../theme'
import { AutoColumn, ColumnCenter } from '../Column'
import { BlueCard } from '../Card'
import { ButtonPrimary } from '../Button'

const Wrapper = styled.div`
  width: 100%;
`
const Section = styled(AutoColumn)`
  padding: 24px;
`

function MessageContent({ onDismiss }: { onDismiss: () => void }) {
  return (
    <Wrapper>
      <Section>
        <ColumnCenter>
          <BlueCard>
            <AutoColumn gap="10px">
              <TYPE.link fontWeight={400} color={'primaryText1'}>
                you have successfully converted zyro from erc20 to zrc2, your new zrc2 token will be sent to the address
                you registered at
              </TYPE.link>
              <TYPE.link fontWeight={600} color={'primaryText1'}>
                12:00pm (noon)
              </TYPE.link>
            </AutoColumn>
          </BlueCard>
        </ColumnCenter>
        <ButtonPrimary onClick={onDismiss} style={{ margin: '20px 0 0 0' }}>
          <Text fontWeight={500} fontSize={20}>
            Close
          </Text>
        </ButtonPrimary>
      </Section>
    </Wrapper>
  )
}

interface ConfirmationModalProps {
  isOpen: boolean
  onDismiss: () => void
}

export default function MessageConfirmationModal({ isOpen, onDismiss }: ConfirmationModalProps) {
  // confirmation screen
  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90}>
      <MessageContent onDismiss={onDismiss} />
    </Modal>
  )
}
