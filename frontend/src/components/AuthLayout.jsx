import { useNavigate} from "react-router-dom"
import {useState,  useEffect } from "react"   
import { useSelector } from "react-redux"

function AuthLayout({children, authentication = true}) {
        const navigate = useNavigate()
        const [loader, setLoader ] = useState(true)
        const authStatus = useSelector(state => state.auth.status)

            useEffect(()=>{
                if (authentication && !authStatus) {
                    navigate('/login', { replace: true })
                } else if (!authentication && authStatus) {
                    navigate('/', { replace: true })
                } else {
                    setLoader(false)
                }
            },[authStatus, navigate, authentication])
        
  return loader ? 
  <h1>Loading... </h1> : <>{children}</>
            
}

export default AuthLayout
