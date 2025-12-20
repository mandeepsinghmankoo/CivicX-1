import Icon from '/NavIcon.png?url'

function Logo(){
    return (
        <img src={Icon} alt="Logo" 
        className='w-24 sm:w-32 md:w-40 h-auto'
        />
    )
}

export default Logo