import React, { useId } from 'react'

const Input = React.forwardRef(function Input({
    label,
    type = 'text',
    className = '',
    ...props
}, ref) {
    const id = useId()
    return (
        <div className='w-full'>
            {label && <label
                className='inline-block mb-1 pl-1'
                htmlFor={id}
            >
                {label}
            </label>}
                <input
                type = {type}
                className={`flex px-3 py-2 rounded-2xl bg-white text-black outline-none focus:bg-gray-50 duration-200 border border-gray-200 w-full text-sm sm:text-base ${className}`}
                ref = {ref}
                {...props}
                id=  {id}
                />
        </div>
    )
})
export default Input
