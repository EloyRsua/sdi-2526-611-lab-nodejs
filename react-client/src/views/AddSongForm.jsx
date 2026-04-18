import { useState } from "react";
import { apiFetch } from "../services/ApiService.js";
import "../assets/AddSongForm.css";
const AddSongForm = ({ onSongAdded }) => {
    const [title, setTitle] = useState("");
    const [kind, setKind] = useState("");
    const [price, setPrice] = useState("");
    const [error, setError] = useState("");
    const handleSubmit = (e) => {
        e.preventDefault();
        setError("");
        if (!title || !kind || !price) {
            setError("Todos los campos son obligatorios");
            return;
        }
        apiFetch("http://localhost:8081/api/v1.0/songs", {
            method: "POST",
            body: JSON.stringify({
                title,
                kind,
                price
            })
        })
            .then(() => {
                setTitle("");
                setKind("");
                setPrice("");
                if (onSongAdded) {
                    onSongAdded();
                }
            })
            .catch((err) => {
                setError(err.message);
            });
    };
    return (
        <div className="add-song-container">
            <h2>Añadir canción</h2>
            {error && <div className="error">{error}</div>}
            <form onSubmit={handleSubmit} className="add-song-form">
                <input
                    type="text"
                    placeholder="Título"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Género"
                    value={kind}
                    onChange={(e) => setKind(e.target.value)}
                />
                <input
                    type="number"
                    placeholder="Precio"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                />
                <button type="submit">Añadir</button>
            </form>
        </div>
    );
};
export default AddSongForm;