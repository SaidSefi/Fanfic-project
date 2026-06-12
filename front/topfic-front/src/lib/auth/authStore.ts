import type { UserData } from "@/lib/auth/types";

type State = {
  accessToken: string | null;
  user: UserData | null;
};

type Subscriber = (state: State) => void;

let state: State = {
  accessToken: (() => {
    try {
      return localStorage.getItem("access_token");
    } catch {
      return null;
    }
  })(),
  user: (() => {
    try {
      const raw = localStorage.getItem("user_data");
      return raw ? (JSON.parse(raw) as UserData) : null;
    } catch {
      return null;
    }
  })(),
};

const subscribers: Subscriber[] = [];

function notify() {
  subscribers.forEach((s) => {
    try {
      s(state);
    } catch (e) {
      console.error("authStore subscriber error", e);
    }
  });
}

export function getAuthState(): State {
  return state;
}

export function subscribe(cb: Subscriber): () => void {
  subscribers.push(cb);
  try {
    cb(state);
  } catch {}
  return () => {
    const i = subscribers.indexOf(cb);
    if (i !== -1) subscribers.splice(i, 1);
  };
}

export function setAccessToken(token: string | null) {
  state = { ...state, accessToken: token };
  try {
    if (token) localStorage.setItem("access_token", token);
    else localStorage.removeItem("access_token");
  } catch {}
  notify();
}

export function setUser(user: UserData | null) {
  state = { ...state, user };
  try {
    if (user) localStorage.setItem("user_data", JSON.stringify(user));
    else localStorage.removeItem("user_data");
  } catch {}
  notify();
}
