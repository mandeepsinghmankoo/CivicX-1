import { useDispatch } from 'react-redux'
import authService from '../appwrite/auth'  
import { logout } from '../store/authSlice'

function Logout() {
    const dispatch = useDispatch()
    const logoutHandler = () =>{
        authService.logout().then(()=>{
            dispatch(logout())
        })
    }
  return (
    <button className='block w-full text-left px-4 py-2 text-white hover:bg-red-600 transition-colors'
    onClick={logoutHandler}>
        LogOut
    </button>
  )
}

export default Logout
