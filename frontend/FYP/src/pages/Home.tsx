import { IonContent, IonHeader, IonList, IonPage, IonTitle, IonToolbar, IonItem, IonInput, IonButton } from '@ionic/react';
import React, {useState} from "react";

import './Home.css';

const Home: React.FC = () => {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<{user: String; ai: string}[]>([]);

  const sendMessage = async() =>{
    if(!message.trim()) return;

  const userMessage = message;
  setMessage("");

  const response = await fetch("http://127.0.0.1:8000/chat", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ message: userMessage }),
  })

  const data = await response.json();

  setChat([...chat, {user: userMessage, ai: data.reply}]);
}
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Chat Room</IonTitle>
        </IonToolbar> 
      </IonHeader>
      <IonContent className="ion-padding">
            <IonList>
              {chat.map((entry, idx) => (
            <IonItem key={idx}>
              <div>
                <p><b>You:</b> {entry.user}</p>
                <p><b>AI:</b> {entry.ai}</p>
              </div>
            </IonItem>
          ))}
            </IonList>
            <IonInput
          placeholder="Type your message..."
          value={message}
          onIonChange={(e) => setMessage(e.detail.value!)}
        />
        <IonButton expand="block" onClick={sendMessage}>Send</IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Home;
