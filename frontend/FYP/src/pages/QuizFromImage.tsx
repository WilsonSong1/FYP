import React from "react";
import { useHistory } from "react-router";
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from "@ionic/react";
import "./PageTheme.css";

const QuizFromImage: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage className="light-page">
      <IonHeader>
        <IonToolbar className="light-toolbar">
          <IonButton
            slot="start"
            className="light-link-button"
            fill="clear"
            size="large"
            onClick={() => history.push("/home")}
          >
            Home
          </IonButton>
          <IonTitle className="ion-text-center">Generate Quiz From Image</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding light-content" />
    </IonPage>
  );
};

export default QuizFromImage;
