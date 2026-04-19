import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonText,
  IonGrid,
  IonRow,
  IonCol
} from "@ionic/react";
import { useEffect, useState } from "react";
import { useHistory } from "react-router";
import "./Home.css";

const Home: React.FC = () => {
  const history = useHistory();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setIsLoggedIn(false);
        return;
      }

      try {
        const response = await fetch("http://127.0.0.1:8000/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          localStorage.removeItem("token");
          localStorage.removeItem("username");
          setIsLoggedIn(false);
          return;
        }

        const data = await response.json();
        localStorage.setItem("username", data.username);
        setIsLoggedIn(true);
      } catch {
        setIsLoggedIn(false);
      }
    };

    checkAuth();
  }, []);

  const handleProfileClick = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      history.push("/signup");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        history.push("/signup");
        return;
      }

      const data = await response.json();
      localStorage.setItem("username", data.username);
    } catch {
      history.push("/signup");
      return;
    }

    history.push("/profile");
  };

  return (
    <IonPage className="home-page">
      <IonHeader>
        <IonToolbar className="home-toolbar">
          <IonButton slot="end" fill="clear" onClick={handleProfileClick}>
            Profile
          </IonButton>
          <IonTitle className="ion-text-center">Home</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding home-content">
        <IonGrid className="home-grid">
          <IonRow className="ion-text-center">
            <IonCol size="12">
              <IonText>
                <h2>Welcome to the App!</h2>
              </IonText>
            </IonCol>
          </IonRow>

          <IonRow className="home-buttons-row ion-justify-content-center">
            <IonCol size="12" sizeMd="6" className="home-buttons-col">
              {!isLoggedIn && (
                <IonButton className="home-button" onClick={() => history.push("/login")}>
                  Login
                </IonButton>
              )}

              <IonButton className="home-button" onClick={() => history.push("/chatbot")}>
                Chat Bot
              </IonButton>

              <IonButton className="home-button" onClick={() => history.push("/quiz")}>
                MCQ Quiz
              </IonButton>

              {!isLoggedIn && (
                <IonButton
                  className="home-button"
                  color="secondary"
                  onClick={() => history.push("/signup")}
                >
                  Sign Up
                </IonButton>
              )}
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default Home;