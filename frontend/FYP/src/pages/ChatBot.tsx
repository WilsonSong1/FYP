import { 
    IonContent, 
    IonHeader, 
    IonList, 
    IonPage, 
    IonTitle, 
    IonToolbar,
    IonFooter,
    IonItem, 
    IonInput,
    IonText,
    IonButton 
} from '@ionic/react';
import React, {useState, useRef, useEffect} from "react";
import { useHistory } from "react-router";

import './ChatBot.css';

const Home: React.FC = () => {
  const history = useHistory();
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<{user: String; ai: string}[]>([]);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const sendMessage = async() =>{
    if(!message.trim()) return;

  const userMessage = message;
  setMessage("");

  //Place "..." while AI is generating response
  setChat((prev) => [...prev, {user: userMessage, ai: "..."}]);

  try{
      const response = await fetch("http://127.0.0.1:8000/chat", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ message: userMessage }),
  })

  const data = await response.json();

  //Replace "..." with AI generated reply
 setChat((prev) =>
  prev.map((entry, idx) =>
    idx === prev.length - 1
      ?{...entry, ai: data.reply || "Error: no response"}
      : entry)
    );
    } catch (err) {
      console.error(err);
      setChat((prev) =>
        prev.map((entry, idx) =>
          idx === prev.length - 1
            ? {...entry, ai: "Could not reach server."}
            : entry
        )
      );
    }
  };

  //Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth"});
  }), [(chat)];

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButton
            fill="clear" size="large" onClick={() => history.push("/home")}> Home </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="chat-container">
          {chat.map((entry, idx) => (
            <React.Fragment key={idx}>
              <div className="message-row user-row">
                <div className="message-bubble user-bubble">
                  <IonText className="message-author">You</IonText>
                  <p className="message-text">{entry.user}</p>
                </div>
              </div>

              <div className="message-row ai-row">
                <div className="message-bubble ai-bubble">
                  <IonText className="message-author">AI Tutor</IonText>
                  <p className="message-text">{entry.ai}</p>
                </div>
              </div>
            </React.Fragment>
          ))}
          <div ref={chatEndRef} />
        </div>
      </IonContent>

      <IonFooter>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
        >
          <IonItem className="input-bar" lines="none">
            <IonInput
              placeholder="Type your message..."
              value={message}
              onIonChange={(e) => setMessage(e.detail.value || "")}
            />
            <IonButton type="submit">Send</IonButton>
          </IonItem>
        </form>
      </IonFooter>
    </IonPage>
  );
};

export default Home;
