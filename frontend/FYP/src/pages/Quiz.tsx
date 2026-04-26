import React from "react";
import { useIonRouter } from "@ionic/react";
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
  // Used to move to other quiz pages.
  const ionRouter = useIonRouter();

  return (
    <IonPage className="light-page">
      <IonHeader>
        <IonToolbar className="light-toolbar">
          <IonButton
            slot="start"
            className="light-link-button"
            fill="clear"
            size="large"
            routerLink="/home"
            routerDirection="back"
          >
            Home
          </IonButton>
          <IonTitle className="ion-text-center">Quiz Generator</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding light-content">
        <IonButton
          className="quiz-option-button"
          // Open the text-based quiz generator.
          onClick={() => ionRouter.push("/quiz/generate")}
        >
          Generate quiz
        </IonButton>

        <IonButton
          className="quiz-option-button ion-margin-top"
          // Open the image-based quiz generator.
          onClick={() => ionRouter.push("/quiz/image")}
        >
          Generate quiz from image
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Quiz;
