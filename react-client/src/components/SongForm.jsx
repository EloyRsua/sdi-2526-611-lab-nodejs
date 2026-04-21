import { useState } from "react";
import { apiFetch } from "../services/ApiService.js";
import SongToast from "./SongToast";
import "../assets/AddSongForm.css";

const SongForm = ({ onSongAdded }) => {
    const [title, setTitle] = useState("");
    const [kind, setKind] = useState("");
    const [price, setPrice] = useState("");
    const [toastMessage, setToastMessage] = useState("");

    const validate = () => {
        return title.trim() !== "" && kind.trim() !== "" && price.toString().trim() !== "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setToastMessage("");
        try {
            await apiFetch("http://localhost:8081/api/v1.0/songs", {
                method: "POST",
                body: JSON.stringify({
                    title,
                    kind,
                    price
                })
            });
            setTitle("");
            setKind("");
            setPrice("");
            if (onSongAdded) onSongAdded();
        } catch (err) {
            setToastMessage(err.message);
        }
    };

    return (
        <div className="add-song-container">
            <h2>Añadir canción</h2>
            <SongToast message={toastMessage} onClose={() => setToastMessage("")} />
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
                <button type="submit" disabled={!validate()}>Añadir</button>
            </form>
        </div>
    );
};

export default SongForm;
