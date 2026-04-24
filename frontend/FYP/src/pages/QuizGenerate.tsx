import React, { useState } from "react";
import { useIonRouter } from "@ionic/react";
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
  IonLabel,
  IonSpinner,
} from "@ionic/react";
import "./PageTheme.css";

interface Question {
  question: string;
  options: { [key: string]: string };
  correct_answer: string;
}

const QuizGenerate: React.FC = () => {
  const ionRouter = useIonRouter();
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<
    { correct: boolean; userAnswer: string; correctAnswer: string }[]
  >([]);
  const [loading, setLoading] = useState(false);

  const generateQuiz = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, level }),
      });
      const data = await res.json();
      setQuestions(data.questions);
      setAnswers({});
      setSubmitted(false);
      setScore(0);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const submitQuiz = () => {
    if (Object.keys(answers).length !== questions.length) {
      alert("Please answer all questions before submitting!");
      return;
    }

    let correctCount = 0;
    const quizResults = questions.map((q, i) => {
      const userAnswer = answers[i];
      const isCorrect = userAnswer === q.correct_answer;
      if (isCorrect) correctCount++;
      return {
        correct: isCorrect,
        userAnswer: q.options[userAnswer] || "Not answered",
        correctAnswer: q.options[q.correct_answer],
      };
    });

    setScore(correctCount);
    setResults(quizResults);
    setSubmitted(true);
  };

  const resetQuiz = () => {
    setTopic("");
    setLevel("");
    setQuestions([]);
    setAnswers({});
    setSubmitted(false);
    setScore(0);
    setResults([]);
  };

  return (
    <IonPage className="light-page">
      <IonHeader>
        <IonToolbar className="light-toolbar">
          <IonButton
            slot="start"
            className="light-link-button"
            fill="clear"
            size="large"
            onClick={() => ionRouter.push("/home")}
          >
            Home
          </IonButton>
          <IonTitle className="ion-text-center">Generate Quiz</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding light-content">
        {!submitted && (
          <>
            <IonInput
              className="light-item"
              placeholder="Enter Quiz Topic"
              value={topic}
              onIonChange={(e) => setTopic(e.detail.value!)}
            />
            <IonSelect
              className="light-item"
              placeholder="Select education level"
              value={level}
              onIonChange={(e) => setLevel(e.detail.value!)}
            >
              <IonSelectOption value="Primary School">Primary School</IonSelectOption>
              <IonSelectOption value="Secondary School">Secondary School</IonSelectOption>
              <IonSelectOption value="University">University</IonSelectOption>
            </IonSelect>

            <IonButton
              className="light-primary-button"
              expand="block"
              onClick={generateQuiz}
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate Quiz"}
            </IonButton>

            {loading && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  marginTop: "40px",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                <IonSpinner name="circles" color="primary" />
                <p style={{ fontSize: "16px", fontWeight: "500" }}>
                  Generating your quiz...
                </p>
              </div>
            )}

            {questions.length > 0 && !loading && (
              <>
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
                <IonButton
                  className="light-primary-button"
                  expand="block"
                  onClick={submitQuiz}
                >
                  Submit Quiz
                </IonButton>
              </>
            )}
          </>
        )}

        {submitted && (
          <>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <h1>Quiz Results</h1>
              <h2
                style={{ color: score / questions.length >= 0.7 ? "green" : "red" }}
              >
                Score: {score} / {questions.length}
              </h2>
              <p>{((score / questions.length) * 100).toFixed(1)}%</p>
            </div>

            <IonList>
              {questions.map((q, i) => (
                <IonItem
                  key={i}
                  style={{
                    borderLeft: `5px solid ${results[i].correct ? "green" : "red"}`,
                    paddingLeft: "10px",
                  }}
                >
                  <IonLabel>
                    <h2>
                      {i + 1}. {q.question}
                    </h2>
                    <p>
                      <strong>Your answer:</strong> {results[i].userAnswer}
                    </p>
                    {!results[i].correct && (
                      <p style={{ color: "green" }}>
                        <strong>Correct answer:</strong> {results[i].correctAnswer}
                      </p>
                    )}
                    <p
                      style={{
                        marginTop: "10px",
                        fontWeight: "bold",
                        color: results[i].correct ? "green" : "red",
                      }}
                    >
                      {results[i].correct ? "Correct" : "Incorrect"}
                    </p>
                  </IonLabel>
                </IonItem>
              ))}
            </IonList>

            <IonButton className="light-primary-button" expand="block" onClick={resetQuiz}>
              Take Another Quiz
            </IonButton>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default QuizGenerate;
