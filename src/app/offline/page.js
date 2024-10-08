// src\app\offline\page.js
"use client"
export default function Offline() {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
                <h1 className="text-4xl font-bold mb-4">You&apos;re Offline</h1>
                <p className="text-xl mb-8">Please check your internet connection and try again.</p>
                <button 
                    onClick={() => window.location.reload()} 
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }
