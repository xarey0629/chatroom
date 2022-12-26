import styled from 'styled-components';
import { useEffect } from 'react';
// import { BrowserRouter } from "react-router-dom";
import { ChatRoom } from './ChatRoom';
import SignIn from './SignIn';
import { useChat } from '../Hooks/useChat';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 500px;
  margin: auto;
`;

function App() {
  const {status, signedIn} = useChat();

  return (
    <Wrapper>
      {signedIn?<ChatRoom/>:<SignIn/>}
    </Wrapper>
  )
}

export default App;
