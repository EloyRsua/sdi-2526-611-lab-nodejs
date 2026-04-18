import "../assets/Header.css";
const Header = ({ onChangeView }) => {
    return (
        <header className="header">
            <h1>Tienda de Música</h1>
            <nav className="nav">
                <button onClick={() => onChangeView("songs")}>
                    Tienda
                </button>
                <button onClick={() => onChangeView("add")}>
                    Añadir canción
                </button>
                <button onClick={() => {localStorage.removeItem("token"); window.location.reload();}}>
                    Cerrar Sesión
                </button>
            </nav>
        </header>
    );
};
export default Header;
