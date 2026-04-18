import './assets/App.css';
import { useState } from "react";
import Login from "./views/Login";
import MainPage from "./views/MainPage";
function App() {
    const [logged, setLogged] = useState(
        !!localStorage.getItem("token")
    );
    return (
        <>
            {!logged ? (
                <Login onLogin={() => setLogged(true)} />
            ) : (
                <MainPage />
            )}
        </>
    );
}
export default App;
