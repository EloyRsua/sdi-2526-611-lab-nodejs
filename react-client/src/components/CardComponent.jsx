import "../assets/CardComponent.css";
import Card from "./Card.jsx";
const CardComponent = () => {
    return (
        <div className="card-container">
            <Card
                titulo="La vereda de la puerta de atras"
                autor="Extremoduro"
                precio="18€"
            />
            <Card
                titulo="Dulce Introducción al Caos"
                autor="Extremoduro"
                precio="18€"
            />
        </div>
    );
};
export default CardComponent;