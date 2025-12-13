import React, { useState, useEffect } from 'react'
import authService from '../appwrite/auth'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../store/authSlice'
import { useForm } from 'react-hook-form'
import { useDispatch } from 'react-redux'
import { Button, Input, Logo, LoadingSpinner } from './Index'

function Signup() {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const { register, handleSubmit, watch } = useForm()
    const [error, setError] = useState()
    const [isLoading, setIsLoading] = useState(false)
    const [isVisible, setIsVisible] = useState(false)

    // Animation effect when component mounts
    useEffect(() => {
        setIsVisible(true)
    }, [])

    const create = async (data) => {
        setError("")
        setIsLoading(true);
        try {
            // Combine all signup details into Appwrite call
            const userData = await authService.createAccount({
                name: data.name,
                email: data.email,
                password: data.password,
                role: data.role,
                organization: data.organization || ""
            })

            if (userData) {
                const currentUser = await authService.getCurrentUser()
                if (currentUser) {
                    dispatch(login({ userData: currentUser }))
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
            {/* Background */}
            <div
                className="absolute inset-0 z-0"
                style={{
                    backgroundImage: 'url(/bg-home.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'brightness(0.3)',
                }}
            ></div>
            
            {/* Card */}
            <div 
                className={`flex items-center justify-center w-full z-10 px-4 sm:px-6 md:px-2 transition-all duration-800 transform  ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            >
                <div className="w-full max-w-6xl bg-[#121212]/80 rounded-3xl shadow-3xl backdrop-blur-md border border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-[0_0_19px_rgba(0,255,255,0.45)]">
                    <div className="flex flex-row h-full">
                        {/* Left side - Image/Branding */}
                        <div className="hidden md:flex md:w-1/3 bg-gradient-to-br from-[#020d0e] to-[#0b2a2d] p-8 flex-col justify-center items-center">
                            <div className="mb-6 transform transition-all duration-500 hover:scale-110">
                                <Logo width="120px" />
                            </div>
                            <p className="text-gray-300 text-center mb-6">Empowering citizens to transform communities through collaborative civic engagement.</p>
                            <div className="w-full max-w-xs bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                                <p className="text-gray-200 text-sm italic">"CivicX has transformed how our community addresses local issues. The platform's transparency and ease of use make civic participation accessible to everyone."</p>
                                <p className="text-right text-gray-400 text-xs mt-2">- Community Leader</p>
                            </div>
                        </div>
                        
                        {/* Right side - Form */}
                        <div className="w-full md:w-2/3 p-4 sm:p-6 md:p-8 transition-all duration-500">
                            <div className="mb-4 text-center">
                                <h2 className="text-xl sm:text-2xl font-bold text-green-100">
                                    Create Your Account
                                </h2>
                                <p className="mt-2 text-green-100 text-sm sm:text-base">
                                    Already have an account?{" "}
                                    <Link
                                        to="/login"
                                        className="font-medium text-[#29757c] hover:text-[#52999f] transition-colors"
                                    >
                                        Log In
                                    </Link>
                                </p>
                            </div>

                            {error && (
                                <div className="bg-red-900/30 border border-red-500 text-red-300 px-4 py-2 rounded-lg mb-4 animate-pulse">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit(create)} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Full Name */}
                                    <div className="col-span-2 sm:col-span-1 text-green-100">
                                        <Input
                                            label="Full Name"
                                            placeholder="Enter your full name"
                                            darkMode={true}
                                            {...register("name", { required: true })}
                                        />
                                    </div>

                                    {/* Email */}
                                    <div className="col-span-2 sm:col-span-1 text-green-100">
                                        <Input
                                            label="Email"
                                            placeholder="Enter your email"
                                            type="email"
                                            darkMode={true}
                                            {...register("email", {
                                                required: true,
                                                validate: {
                                                    matchPattern: (value) =>
                                                        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(value) ||
                                                        "Email address must be valid",
                                                },
                                            })}
                                        />
                                    </div>

                                    {/* Password */}
                                    <div className="col-span-2 sm:col-span-1 text-green-100">
                                        <Input
                                            label="Password"
                                            type="password"
                                            placeholder="Enter your password"
                                            darkMode={true}
                                            {...register("password", { required: true, minLength: 8 })}
                                        />
                                    </div>

                                    {/* Confirm Password */}
                                    <div className="col-span-2 sm:col-span-1 text-green-100">
                                        <Input
                                            label="Confirm Password"
                                            type="password"
                                            placeholder="Re-enter your password"
                                            darkMode={true}
                                            {...register("confirmPassword", {
                                                required: true,
                                                validate: (value) =>
                                                    value === watch("password") || "Passwords do not match",
                                            })}
                                        />
                                    </div>

                                    {/* Role Selection */}
                                    <div className="col-span-2 sm:col-span-1 ">
                                        <label className="block text-sm font-medium text-green-100 mb-1">Role</label>
                                        <select
                                            {...register("role")}
                                            className="w-full px-3 py-2 bg-[#052123] border border-gray-700 rounded-lg focus:ring focus:ring-indigo-500 text-white transition-all duration-300"
                                        >
                                            <option value="citizen">Citizen</option>
                                            <option value="official">Official</option>
                                        </select>
                                    </div>

                                    {/* Organization - only if Official */}
                                    {watch("role") === "official" && (
                                        <div className="col-span-2 sm:col-span-1 text-green-100">
                                            <Input
                                                label="Organization"
                                                placeholder="Enter your organization"
                                                darkMode={true}
                                                {...register("organization", { required: true })}
                                            />
                                        </div>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-[#29757c] text-white text-lg font-bold py-3 rounded-lg hover:bg-[#52999f] transition-all duration-300 transform hover:scale-[1.02] mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Creating Account...
                                        </div>
                                    ) : (
                                        'Sign Up'
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

export default Signup
