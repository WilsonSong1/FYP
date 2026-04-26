import { 
    IonContent, 
    IonHeader, 
    IonPage, 
    IonTitle, 
    IonToolbar,
    IonFooter,
    IonItem, 
    IonInput,
    IonText,
    IonButton,
    IonIcon,
  IonToast,
} from '@ionic/react';
import React, {useState, useRef, useEffect} from "react";
import { ellipsisVertical } from "ionicons/icons";

import './ChatBot.css';
import "./PageTheme.css";

const Home: React.FC = () => {
  // See if a user token exists.
  const isSignedIn = Boolean(localStorage.getItem("token"));
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<{user: String; ai: string}[]>([]);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const [activeMessage, setActiveMessage] = useState<string>("");
  const [activeMenuIndex, setActiveMenuIndex] = useState<number | null>(null);
  const [copyToastOpen, setCopyToastOpen] = useState(false);
  const [saveToastOpen, setSaveToastOpen] = useState(false);
  const [saveToastMessage, setSaveToastMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);


  const openMessageMenu = (index: number, aiMessage: string) => {
    // Open or close the menu for this message.
    setActiveMenuIndex((currentIndex) => (currentIndex === index ? null : index));
    setActiveMessage(aiMessage);
  };

  const copyMessage = async () => {
    try {
      // Copy the selected AI message.
      await navigator.clipboard.writeText(activeMessage);
      setCopyToastOpen(true);
    } catch (error) {
      console.error("Could not copy message:", error);
    } finally {
      setActiveMenuIndex(null);
    }
  };

  const saveMessage = async () => {
    try {
      // User must be signed in to save text.
      const token = localStorage.getItem("token");
      if (!token) {
        setSaveToastMessage("You must be signed in to save text");
        setSaveToastOpen(true);
        return;
      }

      const response = await fetch("http://127.0.0.1:8000/save-text-to-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ text: activeMessage }),
      });

      if (response.ok) {
        // Show a success or fail message.
        setSaveToastMessage("Text saved to profile successfully!");
      } else {
        setSaveToastMessage("Failed to save text");
      }
      setSaveToastOpen(true);
    } catch (error) {
      console.error("Could not save message:", error);
      setSaveToastMessage("Error saving text");
      setSaveToastOpen(true);
    } finally {
      setActiveMenuIndex(null);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const uploadPDF = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      // Add file name to chat
      setChat((prev) => [...prev, { user: `Uploaded: ${selectedFile.name}`, ai: "..." }]);

      const response = await fetch("http://127.0.0.1:8000/summarise-pdf", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        // Format the AI response with summary and key points
        const summaryText = `Summary:\n${data.summary}\n\nKey Points:\n${
          Array.isArray(data.key_points)
            ? data.key_points.map((point: string) => `• ${point}`).join("\n")
            : "No key points available"
        }`;

        setChat((prev) =>
          prev.map((entry, idx) =>
            idx === prev.length - 1
              ? { ...entry, ai: summaryText }
              : entry
          )
        );
      } else {
        setChat((prev) =>
          prev.map((entry, idx) =>
            idx === prev.length - 1
              ? { ...entry, ai: `Error: ${data.detail || "Could not process PDF"}` }
              : entry
          )
        );
      }
    } catch (error) {
      console.error("Error uploading PDF:", error);
      setChat((prev) =>
        prev.map((entry, idx) =>
          idx === prev.length - 1
            ? { ...entry, ai: "Could not reach server." }
            : entry
        )
      );
    } finally {
      setUploading(false);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Close the menu when clicking outside.
      if (!target.closest(".ai-bubble-wrapper")) {
        setActiveMenuIndex(null);
      }
    };

    document.addEventListener("mousedown", handleDocumentClick);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, []);

  const sendMessage = async() =>{
    // Skip empty messages.
    if(!message.trim()) return;

  const userMessage = message;
  setMessage("");

  // Place "..." while AI is generating response
  setChat((prev) => [...prev, {user: userMessage, ai: "..."}]);

  try{
      // Send the message to the backend.
      const response = await fetch("http://127.0.0.1:8000/chat", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ message: userMessage }),
  })

  const data = await response.json();

  // Replace "..." with AI generated reply
 setChat((prev) =>
  prev.map((entry, idx) =>
    idx === prev.length - 1
      ?{...entry, ai: data.reply || "Error: no response"}
      : entry)
    );
    } catch (err) {
      console.error(err);
      // Show an error message if request fails.
      setChat((prev) =>
        prev.map((entry, idx) =>
          idx === prev.length - 1
            ? {...entry, ai: "Could not reach server."}
            : entry
        )
      );
    }
  };

  // Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth"});
  }, [chat]);

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
          <IonTitle className="ion-text-center">Chat Bot</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding light-content">
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
                <div className="message-bubble ai-bubble ai-bubble-wrapper">
                  <IonText className="message-author">AI Tutor</IonText>
                  <p className="message-text">{entry.ai}</p>
                  <IonButton
                    className="ai-menu-button"
                    fill="clear"
                    size="small"
                    onClick={() => openMessageMenu(idx, entry.ai)}
                    aria-label="Open message options"
                  >
                    <IonIcon icon={ellipsisVertical} />
                  </IonButton>

                  {activeMenuIndex === idx && (
                    <div className="message-actions-menu" role="menu" aria-label="Message options">
                      {isSignedIn && (
                        <button
                          type="button"
                          className="message-actions-menu-item"
                          onClick={saveMessage}
                        >
                          Save this text to profile
                        </button>
                      )}
                      <button
                        type="button"
                        className="message-actions-menu-item"
                        onClick={copyMessage}
                      >
                        Copy text
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </React.Fragment>
          ))}
          <div ref={chatEndRef} />
        </div>
      </IonContent>

      <IonToast
        isOpen={copyToastOpen}
        message="Text copied to clipboard"
        duration={2000}
        onDidDismiss={() => setCopyToastOpen(false)}
        position="bottom"
        color="dark"
      />

      <IonToast
        isOpen={saveToastOpen}
        message={saveToastMessage}
        duration={2000}
        onDidDismiss={() => setSaveToastOpen(false)}
        position="bottom"
        color="dark"
      />

      <IonFooter>
        <div style={{ padding: "10px" }}>
          {selectedFile && (
            <div style={{ marginBottom: "10px", padding: "10px", borderRadius: "4px" }}>
              <div style={{ fontSize: "14px", marginBottom: "5px" }}>
                {selectedFile.name}
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <IonButton
                  size="small"
                  color="primary"
                  onClick={uploadPDF}
                  disabled={uploading}
                >
                  {uploading ? "Uploading..." : "Summarise PDF"}
                </IonButton>
                <IonButton
                  size="small"
                  color="danger"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                >
                  Cancel
                </IonButton>
              </div>
            </div>
          )}
        </div>
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
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
            <IonButton
              className="light-primary-button"
              onClick={(e) => {
                e.preventDefault();
                fileInputRef.current?.click();
              }}
              fill="clear"
              size="large"
            >
              📎
            </IonButton>
            <IonButton className="light-primary-button" type="submit">Send</IonButton>
          </IonItem>
        </form>
      </IonFooter>
    </IonPage>
  );
};

export default Home;
