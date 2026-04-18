import Header from "../components/Header";
import Footer from "../components/Footer";
import CardComponent from "../components/CardComponent";
import "../assets/MainPage.css"
const MainPage = () => {
    return (
        <div className="page">
            <Header />
            <main className="content">
                <CardComponent />
            </main>
            <Footer />
        </div>
    );
};
export default MainPage;
