import React, { useEffect, useState } from 'react';

const Notification = ({ message, isVisible, onClose }) => {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, 10000); // 10 seconds
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    return (
        <div
            className={`fixed top-0 right-[0px] mt-4 p-4 bg-green-500 text-white rounded-l-lg shadow-lg transition-transform transform ${
                isVisible ? 'translate-x-0' : 'translate-x-full'
            }`}
        >
            {message}
        </div>
    );
};

export default Notification;