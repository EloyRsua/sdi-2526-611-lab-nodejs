import { useEffect, useState } from "react";
import "../assets/CardComponent.css";
import Card from "./Card.jsx";
import { apiFetch } from "../services/ApiService.js";
import Portada from "../assets/logo.svg";
const CardComponent = () => {
    const [songs, setSongs] = useState([]);
    const loadSongs = () => {
        apiFetch("http://localhost:8081/api/v1.0/songs")
            .then(data => {
                setSongs(Array.isArray(data?.songs) ? data.songs : []);
            })
            .catch(() => {
                setSongs([]);
            });
    };
    useEffect(() => {
        loadSongs();
    }, [])

    return (
        <div>
            <div className="controls">
                <button onClick={loadSongs}>Actualizar</button>
            </div>
            <div className="card-container">
                {songs.length === 0 ? (
                    <p>No hay canciones</p>
                ) : (
                    songs.map(song => (
                        <Card
                            key={song._id}
                            titulo={song.title}
                            autor={song.author}
                            precio={song.price}
                            imagen={Portada}
                        />
                    ))
                )}
            </div>
        </div>
    );
};
export default CardComponent;