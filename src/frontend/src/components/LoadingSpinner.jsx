import React from 'react';

const LoadingSpinner = ({ message = "Loading..." }) => {
    return (
        <div className="flex flex-col items-center justify-center p-16">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-algo-blue"></div>
            <p className="mt-8 text-gray-300 font-medium text-lg tracking-wide">{message}</p>
        </div>
    );
};

export default LoadingSpinner;
