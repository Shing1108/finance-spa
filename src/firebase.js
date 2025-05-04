// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 請把下方內容換成你的 Firebase 專案設定
const firebaseConfig = {
    apiKey: "AIzaSyAaqadmDSgQ-huvY7uNNrPtjFSOl93jVEE",
    authDomain: "finance-d8f9e.firebaseapp.com",
    databaseURL: "https://finance-d8f9e-default-rtdb.firebaseio.com",
    projectId: "finance-d8f9e",
    storageBucket: "finance-d8f9e.firebasestorage.app",
    messagingSenderId: "122645255279",
    appId: "1:122645255279:web:25d577b6365c819ffbe99a",
    measurementId: "G-ZCGNG1DRJS"
};

const app = initializeApp(firebaseConfig); // 必須先初始化

// 下面 export 都必須在 app 初始化之後
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const firestore = getFirestore(app);