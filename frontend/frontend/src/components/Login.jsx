import { useState, useEffect } from 'react'
import authService from '../appwrite/auth';
import { useDispatch } from 'react-redux';
import { login as authLogin } from '../store/authSlice'
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom'
import { Button, Input, Logo, LoadingSpinner } from './Index'
import { useForm } from 'react-hook-form'


function Login() {
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { register, handleSubmit } = useForm();
    const [isVisible, setIsVisible] = useState(false)

    // Animation effect when component mounts
    useEffect(() => {
        setIsVisible(true)
    }, [])

    const login = async (data) => {
        setError("");
        setIsLoading(true);
        try {
            const session = await authService.login(data)
            if (session) {
                const userData = await authService.getCurrentUser()
                if (userData) {
                    dispatch(authLogin({ userData }))
                    navigate('/')
                }
            }
        } catch (error) {
            setError(error.message)
        } finally {
            setIsLoading(false);
        }
    }
    return (
        <section className='relative h-screen flex items-center justify-center overflow-hidden bg-gradient-to-tl from-[#0b2a2d] to-[#020d0e]'>
            <div
                className="absolute inset-0 z-0"
                style={{
                    backgroundImage: 'url(/bg-home.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'brightness(0.3)',
                }}
            ></div>
            <div 
                className={`flex items-center justify-center w-full z-10 px-4 sm:px-6 md:px-2 transition-all duration-800 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            >
                <div className="w-full max-w-lg bg-[#121212]/80 rounded-3xl shadow-3xl backdrop-blur-md border border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-[0_0_19px_rgba(0,255,255,0.45)]">
                    <div className="flex flex-col md:flex-row">
                        {/* Left side - Logo/Branding */}
                        <div className="w-full p-4 sm:p-6 md:p-8">
                            <div className="mb-4 sm:mb-6 flex justify-center">
                                <div className="transform transition-all duration-500 hover:scale-110">
                                    <Logo width="120px" />
                                </div>
                            </div>
                            <h2 className="text-center text-xl sm:text-2xl font-bold text-green-100 mb-2">Log in to your account</h2>
                            <p className="mt-2 text-center text-gray-400 text-sm sm:text-base">
                                Don&apos;t have any account?&nbsp;
                                <Link
                                    to="/signup"
                                    className="font-medium text-[#29757c] hover:text-[#52999f] transition-colors"
                                >
                                    Sign Up
                                </Link>
                            </p>
                            {error && (
                                <div className="bg-red-900/30 border border-red-500 text-red-300 px-4 py-2 rounded-lg my-4 animate-pulse">
                                    {error}
                                </div>
                            )}
                            <form onSubmit={handleSubmit(login)} className='mt-6 space-y-4 text-green-100'>
                                <Input
                                    label="Email"
                                    placeholder="Enter your email"
                                    type="email"
                                    darkMode={true}
                                    {...register("email", {
                                        required: true,
                                        validate: {
                                            matchPatern: (value) => /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(value) ||
                                                "Email address must be a valid address",
                                        }
                                    })}
                                />
                                <Input
                                    label="Password"
                                    type="password"
                                    placeholder="Enter your password"
                                    darkMode={true}
                                    {...register("password", {
                                        required: true,
                                    })}
                                />
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-[#29757c] text-white text-lg font-bold py-3 rounded-lg hover:bg-[#52999f] transition-all duration-300 transform hover:scale-[1.02] mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Logging in...
                                        </div>
                                    ) : (
                                        'Log in'
                                    )}
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Login
