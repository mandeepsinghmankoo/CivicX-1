function Button({
    children,
    type = 'button',
    bgColor = 'bg-[#045c65]',
    textColor = 'text-white',
    hoverColor = 'hover:bg-[#067a85]',
    className = '',
    ...props
})
{
    return (
       <button className={`px-4 py-2 rounded-2xl ${bgColor} ${textColor} ${hoverColor} transition-colors duration-300 ${className}`}{...props}>
            {children}
       </button>
    )
}

export default Button;