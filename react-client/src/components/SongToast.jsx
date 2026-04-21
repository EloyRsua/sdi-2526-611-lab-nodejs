import React from 'react';
import '../assets/SongToast.css';

const SongToast = ({ message, onClose }) => {
    if (!message) return null;

    return (
        <div className="song-toast">
            <div className="song-toast-content">
                <span>{message}</span>
                <button className="song-toast-close" onClick={onClose}>&times;</button>
            </div>
        </div>
    );
};

export default SongToast;
