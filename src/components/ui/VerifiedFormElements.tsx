
import { AlertCircle, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

const inputClasses = (error: any, hasRightIcon: boolean = false) => `
    block w-full rounded-xl border bg-white shadow-sm transition-all duration-200
    py-3 px-4 text-sm font-medium text-gray-900 placeholder-gray-400
    focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none
    ${hasRightIcon ? 'pr-11' : ''}
    ${error
        ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
        : 'border-gray-200 hover:border-gray-300'
    }
`;

const labelClasses = "block text-sm font-semibold text-gray-700 mb-1.5 ml-0.5";
const errorClasses = "mt-1.5 text-xs text-red-500 font-medium ml-1 flex items-center animate-in slide-in-from-top-1";

export function FormInput({ label, register, name, error, className = "", required = false, type = "text", placeholder, ...props }: any) {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
        <div className={`space-y-0.5 ${className}`}>
            <label className={labelClasses}>
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative group">
                <input
                    {...register(name)}
                    type={inputType}
                    placeholder={placeholder}
                    {...props}
                    className={inputClasses(error, isPassword)}
                />

                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center justify-center text-gray-400 hover:text-primary-600 transition-colors focus:outline-none"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
            </div>
            {error && (
                <p className={errorClasses}>
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {error.message}
                </p>
            )}
        </div>
    );
}

export function FormSelect({ label, register, name, error, options, placeholder = "Pilih...", required = false }: any) {
    return (
        <div className="space-y-0.5">
            <label className={labelClasses}>
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                <select
                    {...register(name)}
                    className={`${inputClasses(error, true)} appearance-none cursor-pointer`}
                >
                    <option value="">{placeholder}</option>
                    {options.map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
                <div className="absolute inset-y-0 right-0 px-3 flex items-center pointer-events-none text-gray-400">
                    <ChevronDown className="w-4 h-4" />
                </div>
            </div>
            {error && (
                <p className={errorClasses}>
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {error.message}
                </p>
            )}
        </div>
    );
}
