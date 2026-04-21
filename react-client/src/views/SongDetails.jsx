import { useEffect, useState } from "react";
import { apiFetch } from "../services/ApiService.js";
import "../assets/SongDetails.css";
import Portada from "../assets/logo.svg";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import SongToast from "../components/SongToast";

const SongDetails = ({ songId, onBack, onDeleted }) => {
    const [song, setSong] = useState(null);
    const [error, setError] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState("");

    useEffect(() => {
        if (!songId) return;
        apiFetch(`http://localhost:8081/api/v1.0/songs/${songId}`)
            .then(data => {
                setSong(data?.song);
            })
            .catch(err => {
                setError(err.message);
            })
    }, [songId]);

    const handleDeleteClick = () => {
        setIsModalOpen(true);
    };

    if (error) return <div className="error">{error}</div>;
    if (!song) return <p>Cargando canción...</p>;
    return (
        <div className="song-details">
            <SongToast message={toastMessage} onClose={() => setToastMessage("")} />
            <DeleteConfirmationModal
                isOpen={isModalOpen}
                songName={song.title}
                songId={songId}
                onConfirm={() => {
                    setIsModalOpen(false);
                    if (onDeleted) onDeleted();
                }}
                onCancel={() => setIsModalOpen(false)}
                onError={(msg) => setToastMessage(msg)}
            />
            <img src={Portada} alt="Portada de la canción" />
            <div className="song-info">
                <h2>{song.title}</h2>
                <p><strong>Autor:</strong> {song.author}</p>
                <p><strong>Género:</strong> {song.kind}</p>
                <p className="precio">{song.price} €</p>
                <div className="song-actions">
                    <button className="delete" onClick={handleDeleteClick}>
                        Eliminar
                    </button>
                    <button className="back" onClick={onBack}>
                        Volver
                    </button>
                </div>
            </div>
        </div>
    );
};
export default SongDetails;
