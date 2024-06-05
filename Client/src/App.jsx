import { useState } from 'react'

import './index.css'
import {BrowserRouter as Router, Route,Routes} from 'react-router-dom'
import Join from './components/Join'
import Chat from './components/Chat'
function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Router>
        <Routes>
        <Route path="/" exact element={<Join/>}/>
        <Route path="/chat" element={<Chat/>}/>
        </Routes>
      </Router>
    </>
  )
}

export default App
