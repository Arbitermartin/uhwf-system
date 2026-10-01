import { Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Home from './pages/public/Home'
import About from './pages/public/About'
import Contact from './pages/public/Contact'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ComingSoon from './pages/public/ComingSoon'

function App() {
  return (
    <Routes>
      {/* Auth pages: no navbar/footer */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />

        {/* Placeholders until we build these pages */}
        <Route path="/land" element={<ComingSoon />} />
        <Route path="/wildlife" element={<ComingSoon />} />
        <Route path="/network" element={<ComingSoon />} />
        <Route path="/services/community" element={<ComingSoon />} />
        <Route path="/services/innovations" element={<ComingSoon />} />
        <Route path="/team" element={<ComingSoon />} />
        <Route path="/video-gallery" element={<ComingSoon />} />
        <Route path="/career" element={<ComingSoon />} />
        <Route path="/login" element={<ComingSoon />} />
        <Route path="/register" element={<ComingSoon />} />
        <Route path="/news/:id" element={<ComingSoon />} />
        <Route path="/help" element={<ComingSoon />} />
        <Route path="/ict" element={<ComingSoon />} />
      </Route>
    </Routes>
  )
}

export default App