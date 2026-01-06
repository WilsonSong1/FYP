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
  IonList,
  IonItem,
  IonRadioGroup,
  IonRadio,
  IonLabel
} from "@ionic/react";

interface Question {
  question: string;
    options: { [key: string]: string };
    correct_answer: string;
}

const Quiz: React.FC = () => {
    const [topic, setTopic] = useState("");
    const [level, setLevel] = useState("");
    const [questions, setQuestions] = useState<Question[]>([]);
        const [answers, setAnswers] = useState<{ [key: number]: string }>({});

    const generateQuiz = async () => {
        const res = await fetch("http://127.0.0.1:8000/generate-quiz", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ topic, level })
        });
        const data = await res.json();
        setQuestions(data.questions);
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Quiz Generator</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <IonInput
                    placeholder="Enter Quiz Topic"
                    value={topic}
                    onIonChange={(e) => setTopic(e.detail.value!)}
                />
                <IonSelect
                    placeholder="Select education level"
                    value={level}
                    onIonChange={(e) => setLevel(e.detail.value!)}
                >
                    <IonSelectOption value="Primary School">Primary School</IonSelectOption>
                    <IonSelectOption value="Secondary School">Secondary School</IonSelectOption>
                    <IonSelectOption value="University">University</IonSelectOption>
                </IonSelect>

                <IonButton expand="block" onClick={generateQuiz}>
                    Generate Quiz
                </IonButton>

                <IonList>
                    {questions.map((q, i) => (
                        <IonItem key={i}>
                            <IonLabel>
                                <h2>
                                    {i + 1}. {q.question}
                                </h2>
                                <IonRadioGroup
                                    value={answers[i]}
                                    onIonChange={(e) =>
                                        setAnswers({ ...answers, [i]: e.detail.value })
                                    }
                                >
                                    {Object.entries(q.options).map(([key, opt]) => (
                                        <IonItem key={key}>
                                            <IonRadio value={key} />
                                            <IonLabel>{opt}</IonLabel>
                                        </IonItem>
                                    ))}
                                </IonRadioGroup>
                            </IonLabel>
                        </IonItem>
                    ))}
                </IonList>
            </IonContent>
        </IonPage>
    );
};

export default Quiz;
