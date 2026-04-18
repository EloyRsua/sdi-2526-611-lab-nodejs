import "../assets/Card.css";
const Card = ({ titulo, autor, precio, kind, imagen,onClick }) => {
    return (
        <div className="card" onClick={onClick}>
            <img src={imagen} alt={titulo} className="card-img" />
            <h3>{titulo}</h3>
            <p className="autor">{autor}</p>
            <p className="tipo">{kind}</p>
            <p className="precio">{precio} €</p>
        </div>
    );
};
export default Card;
