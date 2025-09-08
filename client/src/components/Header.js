import React from 'react';
import styled from 'styled-components';
import { Link, useLocation } from 'react-router-dom';

const HeaderContainer = styled.header`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem 2rem;
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled(Link)`
  font-size: 1.8rem;
  font-weight: bold;
  color: white;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    color: #f0f0f0;
  }
`;

const Nav = styled.nav`
  display: flex;
  gap: 1rem;
`;

const NavLink = styled(Link)`
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  ${props => props.active && `
    background: rgba(255, 255, 255, 0.2);
    color: white;
  `}
`;

const QRIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zM3 15h6v6H3v-6zm2 2v2h2v-2H5zM15 3h6v6h-6V3zm2 2v2h2V5h-2zM15 15h2v2h-2v-2zM17 17h2v2h-2v-2zM19 15h2v2h-2v-2zM15 19h2v2h-2v-2zM17 21h2v2h-2v-2zM19 19h2v2h-2v-2zM11 3h2v2h-2V3zM11 5h2v2h-2V5zM11 7h2v2h-2V7zM11 11h2v2h-2v-2zM11 13h2v2h-2v-2zM3 11h2v2H3v-2zM5 11h2v2H5v-2zM7 11h2v2H7v-2z"/>
  </svg>
);

const Header = () => {
  const location = useLocation();

  return (
    <HeaderContainer>
      <HeaderContent>
        <Logo to="/">
          <QRIcon />
          Reverse QR Share
        </Logo>
        <Nav>
          <NavLink to="/" active={location.pathname === '/'}>
            Home
          </NavLink>
          <NavLink to="/receive" active={location.pathname === '/receive'}>
            Receive Files
          </NavLink>
        </Nav>
      </HeaderContent>
    </HeaderContainer>
  );
};

export default Header;
