import './index.css'
import {BrowserRouter as Router, Route,Routes} from 'react-router-dom'
import Join from './components/Join'
import Chat from './components/Chat'
import Choose from './components/Choose'
import ChatPTP from './components/ChatPTP'
function App() {
  return (
    <>
      <Router>
        <Routes>
        <Route path="/" exact element={<Choose/>}/>
        <Route path="/chat" element={<Chat/>}/>
        <Route path="/chatP2P" element={<ChatPTP/>}/>
        </Routes>
      </Router>
    </>
  )
}

export default App
