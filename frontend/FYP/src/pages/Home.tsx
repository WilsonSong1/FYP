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

const Home: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Welcome</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow className="ion-text-center">
            <IonCol size="12">
              <IonText>
                <h2>Welcome to the App!</h2>
              </IonText>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol>
              <IonButton expand="block" onClick={() => history.push("/login")}>
                Login
              </IonButton>

              <IonButton expand="block" onClick={() => history.push("/chatbot")}>
                Chat Bot
              </IonButton>

              <IonButton expand="block" onClick={() => history.push("/quiz")}>
                MCQ Quiz
              </IonButton>

              <IonButton
                expand="block"
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