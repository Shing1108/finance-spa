// src/components/GoogleLoginButton.jsx
import { useRef } from "react";

export default function GoogleLoginButton({ onSuccess }) {
  const buttonRef = useRef();

  function handleGoogle() {
    if (!window.google) {
      alert("Google 登入元件尚未載入");
      return;
    }
    window.google.accounts.id.initialize({
      client_id: "你的GoogleClientID.apps.googleusercontent.com",
      callback: (response) => {
        onSuccess && onSuccess(response.credential);
      },
    });
    window.google.accounts.id.prompt();
  }

  return (
    <button className="btn btn-primary" onClick={handleGoogle} ref={buttonRef}>
      <i className="fab fa-google"></i> 使用Google帳戶登入
    </button>
  );
}