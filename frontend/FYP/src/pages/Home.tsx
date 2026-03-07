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
import { useHistory } from "react-router";
import "./Home.css";

const Home: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage className="home-page">
      <IonHeader>
        <IonToolbar className="home-toolbar">
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
              <IonButton className="home-button" onClick={() => history.push("/login")}>
                Login
              </IonButton>

              <IonButton className="home-button" onClick={() => history.push("/chatbot")}>
                Chat Bot
              </IonButton>

              <IonButton className="home-button" onClick={() => history.push("/quiz")}>
                MCQ Quiz
              </IonButton>

              <IonButton
                className="home-button"
                color="secondary"
                onClick={() => history.push("/signup")}
              >
                Sign Up
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default Home;