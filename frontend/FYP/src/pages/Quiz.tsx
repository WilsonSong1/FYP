import React from "react";
import { useHistory } from "react-router";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
} from "@ionic/react";
import "./PageTheme.css";

const Quiz: React.FC = () => {
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
          <IonTitle className="ion-text-center">Quiz Generator</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding light-content">
        <IonButton
          className="quiz-option-button"
          onClick={() => history.push("/quiz/generate")}
        >
          Generate quiz
        </IonButton>

        <IonButton
          className="quiz-option-button ion-margin-top"
          onClick={() => history.push("/quiz/image")}
        >
          Generate quiz from image
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Quiz;
