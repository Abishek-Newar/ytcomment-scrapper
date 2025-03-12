import {BrowserRouter,Routes,Route} from "react-router-dom"
import YoutubeScrapper from "./pages/YoutubeScrapper"
import Wp from "./pages/Wp"

function App() {
  return(
    <BrowserRouter>
    <Routes>
      <Route path="/ytscrapper" element={<YoutubeScrapper/>} />
      <Route path="/" element={<Wp/>} />
    </Routes>
    </BrowserRouter>
  )
}

export default App
