
import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import MaintenanceBanner from '../components/MaintenanceBanner'

const MainLayout = () => {
    return (
        <div className="flex min-h-screen flex-col">
            <MaintenanceBanner />
            <Navbar />
            <main className="flex-1">
                <Outlet />
            </main>
            <Footer />
        </div>
    )
}

export default MainLayout
