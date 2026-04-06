'use client';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * LoadingButton - A button that automatically disables and grays out on click
 * to prevent double submissions. Works with both sync and async onClick handlers.
 * 
 * Props:
 *  - onClick: async function to call on click (if type != 'submit')
 *  - className: button classes
 *  - disabled: external disabled state
 *  - type: 'button' | 'submit' (default 'button')
 *  - loading: external loading state override
 *  - showSpinner: show spinner icon (default true)
 *  - children: button content
 */
export default function LoadingButton({
    onClick,
    className = '',
    disabled = false,
    type = 'button',
    loading: externalLoading,
    showSpinner = true,
    children,
    ...props
}) {
    const [internalLoading, setInternalLoading] = useState(false);
    const isLoading = externalLoading !== undefined ? externalLoading : internalLoading;

    const handleClick = async (e) => {
        if (isLoading || disabled) return;
        if (type === 'submit') return; // Let form handle submit
        if (!onClick) return;

        setInternalLoading(true);
        try {
            await onClick(e);
        } finally {
            setInternalLoading(false);
        }
    };

    return (
        <button
            type={type}
            disabled={isLoading || disabled}
            onClick={handleClick}
            className={`transition-all ${isLoading || disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''} ${className}`}
            {...props}
        >
            {isLoading && showSpinner ? (
                <span className="flex items-center gap-2 justify-center">
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    {children}
                </span>
            ) : children}
        </button>
    );
}
