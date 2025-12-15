import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import authService from './appwrite/auth'
import { login, logout } from './store/authSlice'
import { Footer } from './components/Index'
import { Header } from './components/Index'
import { Outlet } from 'react-router-dom'
import { useNotifications } from './hooks/useNotifications'
import './App.css';

function App() {
    const [loading, setLoading] = useState(true);
    const dispatch = useDispatch();
    useNotifications(); // Initialize notifications

    useEffect(() => {
        authService.getCurrentUser()
            .then((userData) => {
                if (userData) {
                    dispatch(login({ userData }));
                } else {
                    dispatch(logout());
                }
            })
            .finally(() => {
                setLoading(false);
            })
    }, [])

    return !loading ? (
        <div className='min-h-screen flex flex-wrap content-between bg-gradient-to-tl from-[#0b2a2d] to-[#020d0e] w-full overflow-x-hidden'>
            <div className='w-full block'>
                <Header />
                <main className='w-full'>
                    <Outlet />
                </main>
                <Footer />
            </div>
        </div>
    ) : null
}

export default App;