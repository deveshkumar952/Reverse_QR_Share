import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const PageContainer = styled.div`
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
`;

const Card = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 3rem 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  text-align: center;
`;

const Title = styled.h1`
  color: #333;
  margin-bottom: 1rem;
  font-size: 2.5rem;
  font-weight: 700;
`;

const Subtitle = styled.p`
  color: #666;
  margin-bottom: 3rem;
  font-size: 1.2rem;
  line-height: 1.6;
`;

const ButtonContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
`;

const ActionCard = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  background: linear-gradient(135deg, ${props => props.gradient});
  color: white;
  text-decoration: none;
  border-radius: 12px;
  transition: all 0.3s ease;
  border: 2px solid transparent;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
    border-color: rgba(255, 255, 255, 0.3);
  }
`;

const ActionIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const ActionTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
`;

const ActionDescription = styled.p`
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.9;
  text-align: center;
  line-height: 1.5;
`;

const HowItWorks = styled.div`
  text-align: left;
`;

const StepsContainer = styled.div`
  display: grid;
  gap: 1.5rem;
  margin-top: 2rem;
`;

const Step = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
`;

const StepNumber = styled.div`
  background: #4CAF50;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.9rem;
  flex-shrink: 0;
`;

const StepContent = styled.div`
  flex: 1;
`;

const StepTitle = styled.h4`
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1rem;
`;

const StepDescription = styled.p`
  margin: 0;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.5;
`;

const HomePage = () => {
  return (
    <PageContainer>
      <Card>
        <Title>🔄 Reverse QR File Share</Title>
        <Subtitle>
          Share files instantly between devices using QR codes. 
          No accounts, no apps, just scan and transfer!
        </Subtitle>

        <ButtonContainer>
          <ActionCard to="/receive" gradient="#4CAF50 0%, #45a049 100%">
            <ActionIcon>📥</ActionIcon>
            <ActionTitle>Receive Files</ActionTitle>
            <ActionDescription>
              Generate a QR code that others can scan to send files directly to your device
            </ActionDescription>
          </ActionCard>

          <ActionCard 
            to="#" 
            gradient="#2196F3 0%, #1976D2 100%"
            onClick={(e) => {
              e.preventDefault();
              alert('Scan a QR code from someone who wants to receive files!');
            }}
          >
            <ActionIcon>📤</ActionIcon>
            <ActionTitle>Send Files</ActionTitle>
            <ActionDescription>
              Scan someone's QR code to upload files directly to their device
            </ActionDescription>
          </ActionCard>
        </ButtonContainer>

        <HowItWorks>
          <h2 style={{ color: '#333', marginBottom: '1rem' }}>How it works</h2>

          <StepsContainer>
            <Step>
              <StepNumber>1</StepNumber>
              <StepContent>
                <StepTitle>Receiver creates session</StepTitle>
                <StepDescription>
                  The person who wants to receive files clicks "Receive Files" and gets a unique QR code
                </StepDescription>
              </StepContent>
            </Step>

            <Step>
              <StepNumber>2</StepNumber>
              <StepContent>
                <StepTitle>Sender scans QR code</StepTitle>
                <StepDescription>
                  The person with files scans the QR code using their phone's camera or QR scanner
                </StepDescription>
              </StepContent>
            </Step>

            <Step>
              <StepNumber>3</StepNumber>
              <StepContent>
                <StepTitle>Upload files</StepTitle>
                <StepDescription>
                  The sender selects and uploads files through their web browser
                </StepDescription>
              </StepContent>
            </Step>

            <Step>
              <StepNumber>4</StepNumber>
              <StepContent>
                <StepTitle>Automatic download</StepTitle>
                <StepDescription>
                  Files automatically appear on the receiver's device and can be downloaded instantly
                </StepDescription>
              </StepContent>
            </Step>
          </StepsContainer>
        </HowItWorks>
      </Card>
    </PageContainer>
  );
};

export default HomePage;
