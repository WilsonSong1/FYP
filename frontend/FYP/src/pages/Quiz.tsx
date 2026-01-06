import React from "react";
import { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonInput,
  IonButton,
  IonSelect,
  IonSelectOption,
} from "@ionic/react";

interface Question {
  question: string;
  options: string[];
  correct_answer: number;
}

const Quiz: React.FC = () => {
    const [topic, setTopic] = useState("");
    const [level, setLevel] = useState("");

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>
                        Quiz Generator
                    </IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <IonInput
                    placeholder="Enter Quiz Topic"
                    value={topic}
                    onIonChange={e => setTopic(e.detail.value!)}
                />
                <IonSelect
                    placeholder="Select education level"
                    value={level}
                    onIonChange={e => setLevel(e.detail.value!)}
                >
                    <IonSelectOption value="Primary School">Primary School</IonSelectOption>
                    <IonSelectOption value="Secondary School">Secondary School</IonSelectOption>
                    <IonSelectOption value="University">University</IonSelectOption>
                </IonSelect>    
            </IonContent>
        </IonPage>
    );
};

export default Quiz;
