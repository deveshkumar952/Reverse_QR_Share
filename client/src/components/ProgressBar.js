import React from 'react';
import styled from 'styled-components';

const ProgressContainer = styled.div`
  width: 100%;
  margin: 1rem 0;
`;

const ProgressBarContainer = styled.div`
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
`;

const ProgressBarFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #45a049);
  border-radius: 4px;
  transition: width 0.3s ease;
  width: ${props => props.progress}%;
`;

const ProgressText = styled.div`
  text-align: center;
  font-size: 0.9rem;
  color: #333;
  font-weight: 500;
`;

const ProgressBar = ({ progress = 0, text = null }) => {
  return (
    <ProgressContainer>
      <ProgressBarContainer>
        <ProgressBarFill progress={Math.min(100, Math.max(0, progress))} />
      </ProgressBarContainer>
      <ProgressText>
        {text || `${Math.round(progress)}% complete`}
      </ProgressText>
    </ProgressContainer>
  );
};

export default ProgressBar;
