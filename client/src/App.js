import React from 'react';
import { Routes, Route } from 'react-router-dom';
import styled from 'styled-components';
import HomePage from './pages/HomePage';
import ReceivePage from './pages/ReceivePage';
import SendPage from './pages/SendPage';
import Header from './components/Header';

const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

function App() {
  return (
    <AppContainer>
      <Header />
      <MainContent>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/receive" element={<ReceivePage />} />
          <Route path="/send/:sessionId" element={<SendPage />} />
        </Routes>
      </MainContent>
    </AppContainer>
  );
}

export default App;
