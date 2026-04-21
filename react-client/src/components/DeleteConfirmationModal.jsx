import React from 'react';
import '../assets/DeleteConfirmationModal.css';
import { apiFetch } from '../services/ApiService';

const DeleteConfirmationModal = ({ isOpen, songName, songId, onConfirm, onCancel, onError }) => {
    if (!isOpen || !songName) return null;

    const handleConfirm = async () => {
        try {
            await apiFetch(`http://localhost:8081/api/v1.0/songs/${songId}`, {
                method: "DELETE"
            });
            onConfirm();
        } catch (err) {
            onCancel();
            onError(err.message);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>Confirmar eliminación</h3>
                <p>¿Estás seguro de que deseas eliminar la canción <strong>{songName}</strong>?</p>
                <div className="modal-actions">
                    <button className="btn-cancel" onClick={onCancel}>Cancelar</button>
                    <button className="btn-confirm" onClick={handleConfirm} disabled={!songName}>
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;
