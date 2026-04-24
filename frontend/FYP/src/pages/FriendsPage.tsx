import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
} from "@ionic/react";
import "./PageTheme.css";

const FriendsPage: React.FC = () => {
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
            Back
          </IonButton>
          <IonTitle className="ion-text-center">Friends</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding light-content" />
    </IonPage>
  );
};

export default FriendsPage;
