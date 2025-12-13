import React, { useId } from 'react'

const Input = React.forwardRef(function Input({
    label,
    type = 'text',
    className = '',
    darkMode = false,
    ...props
}, ref) {
    const id = useId()
    const baseClass = "flex px-3 py-2 rounded-2xl outline-none duration-200 w-full text-sm sm:text-base";
    const lightClass = "bg-white text-black focus:bg-gray-50 border border-gray-200";
    const darkClass = "bg-gray-800 text-white focus:bg-gray-700 border border-gray-700";

    const inputClass = `${baseClass} ${darkMode ? darkClass : lightClass} ${className}`.trim();

    return (
        <div className='w-full'>
            {label && <label
                className='inline-block mb-1 pl-1'
                htmlFor={id}
            >
                {label}
            </label>}
            <input
                type={type}
                className={inputClass}
                ref={ref}
                {...props}
                id={id}
            />
        </div>
    )
})
export default Input
