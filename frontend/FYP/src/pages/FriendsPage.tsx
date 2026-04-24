import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonList,
  IonText,
  IonIcon,
  IonPopover,
} from "@ionic/react";
import { useEffect, useState } from "react";
import { ellipsisVertical } from "ionicons/icons";
import "./PageTheme.css";

type IncomingRequest = {
  request_id: number;
  from_username: string;
  created_at?: string | null;
};

const FriendsPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [friends, setFriends] = useState<string[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [menuEvent, setMenuEvent] = useState<Event | undefined>(undefined);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const getToken = () => localStorage.getItem("token");

  const loadFriendsData = async () => {
    const token = getToken();
    if (!token) {
      setError("You need to log in first");
      return;
    }

    try {
      const [friendsResponse, requestsResponse] = await Promise.all([
        fetch("http://127.0.0.1:8000/friends/list", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://127.0.0.1:8000/friends/requests", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const friendsData = await friendsResponse.json();
      const requestsData = await requestsResponse.json();

      if (!friendsResponse.ok) {
        throw new Error(friendsData.detail || "Failed to load friends list");
      }

      if (!requestsResponse.ok) {
        throw new Error(requestsData.detail || "Failed to load friend requests");
      }

      setFriends(friendsData.friends || []);
      setIncomingRequests(requestsData.requests || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load friends data");
    }
  };

  useEffect(() => {
    loadFriendsData();
  }, []);

  const sendFriendRequest = async () => {
    const token = getToken();
    if (!token) {
      setError("You need to log in first");
      return;
    }

    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }

    setError("");
    setMessage("");

    try {
      const response = await fetch("http://127.0.0.1:8000/friends/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username: username.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not send friend request");
      }

      setMessage(data.message || "Friend request sent");
      setUsername("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send friend request");
    }
  };

  const acceptFriendRequest = async (requestId: number) => {
    const token = getToken();
    if (!token) {
      setError("You need to log in first");
      return;
    }

    setError("");
    setMessage("");

    try {
      const response = await fetch(`http://127.0.0.1:8000/friends/requests/${requestId}/accept`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Could not accept friend request");
      }

      setMessage(data.message || "Friend request accepted");
      await loadFriendsData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not accept friend request");
    }
  };

  const unfriend = async (friendUsername: string) => {
    const token = getToken();
    if (!token) {
      setError("You need to log in first");
      return;
    }

    setError("");
    setMessage("");

    try {
      const response = await fetch(`http://127.0.0.1:8000/friends/${encodeURIComponent(friendUsername)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Could not unfriend user");
      }

      setMessage(data.message || "Unfriended successfully");
      setSelectedFriend(null);
      setMenuEvent(undefined);
      await loadFriendsData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not unfriend user");
    }
  };

  const openFriendMenu = (event: React.MouseEvent, friend: string) => {
    setSelectedFriend(friend);
    setMenuEvent(event.nativeEvent);
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
            routerLink="/home"
            routerDirection="back"
          >
            Back
          </IonButton>
          <IonTitle className="ion-text-center">Friends</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding light-content">
        <IonItem className="light-item">
          <IonLabel position="stacked">Find user by username</IonLabel>
          <IonInput
            value={username}
            onIonChange={(e) => setUsername(e.detail.value || "")}
            placeholder="Enter username"
          />
        </IonItem>

        <IonButton className="ion-margin-top light-primary-button" expand="block" onClick={sendFriendRequest}>
          Add Friend
        </IonButton>

        {error && (
          <IonText color="danger">
            <p>{error}</p>
          </IonText>
        )}

        {message && (
          <IonText color="success">
            <p>{message}</p>
          </IonText>
        )}

        <h3>Incoming Friend Requests</h3>
        {incomingRequests.length === 0 ? (
          <p>No incoming requests</p>
        ) : (
          <IonList>
            {incomingRequests.map((request) => (
              <IonItem key={request.request_id} className="light-item">
                <IonLabel>
                  <h2>{request.from_username}</h2>
                </IonLabel>
                <IonButton slot="end" onClick={() => acceptFriendRequest(request.request_id)}>
                  Accept
                </IonButton>
              </IonItem>
            ))}
          </IonList>
        )}

        <h3>Your Friends</h3>
        {friends.length === 0 ? (
          <p>No friends yet</p>
        ) : (
          <IonList>
            {friends.map((friend) => (
              <IonItem key={friend} className="light-item">
                <IonLabel>{friend}</IonLabel>
                <IonButton
                  slot="end"
                  fill="clear"
                  onClick={(event) => openFriendMenu(event, friend)}
                >
                  <IonIcon icon={ellipsisVertical} />
                </IonButton>
              </IonItem>
            ))}
          </IonList>
        )}

        <IonPopover
          isOpen={!!menuEvent}
          event={menuEvent}
          onDidDismiss={() => {
            setMenuEvent(undefined);
            setSelectedFriend(null);
          }}
        >
          <IonList>
            <IonItem
              button
              detail={false}
              onClick={() => selectedFriend && unfriend(selectedFriend)}
            >
              <IonLabel color="danger">Unfriend</IonLabel>
            </IonItem>
          </IonList>
        </IonPopover>
      </IonContent>
    </IonPage>
  );
};

export default FriendsPage;
