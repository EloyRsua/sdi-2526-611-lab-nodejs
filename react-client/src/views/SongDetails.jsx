import { useEffect, useState } from "react";
import { apiFetch } from "../services/ApiService.js";
import "../assets/SongDetails.css";
import Portada from "../assets/logo.svg";
const SongDetails = ({ songId, onBack, onDeleted }) => {
    const [song, setSong] = useState(null);
    const [error, setError] = useState("");
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
    const handleDelete = () => {
        if (!window.confirm("¿Seguro que quieres eliminar esta canción?")) return;
        apiFetch(`http://localhost:8081/api/v1.0/songs/${songId}`, {
            method: "DELETE"
        })
            .then(() => {
                if (onDeleted) onDeleted();
            })
            .catch(err => {
                setError(err.message);
            });
    };
    if (error) return <div className="error">{error}</div>;
    if (!song) return <p>Cargando canción...</p>;
    return (
        <div className="song-details">
            <img src={Portada} alt="Portada de la canción" />
            <div className="song-info">
                <h2>{song.title}</h2>
                <p><strong>Autor:</strong> {song.author}</p>
                <p><strong>Género:</strong> {song.kind}</p>
                <p className="precio">{song.price} €</p>
                <div className="song-actions">
                    <button className="delete" onClick={handleDelete}>
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
