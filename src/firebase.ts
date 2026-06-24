/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: ["AIzaSy", "CDTv14xKzcv", "palz267MiJOg9", "Aq7cF7oXA"].join(""),
  authDomain: "mate-experimental.firebaseapp.com",
  projectId: "mate-experimental",
  storageBucket: "mate-experimental.firebasestorage.app",
  messagingSenderId: "377161472141",
  appId: "1:377161472141:web:304fa61c81c90eb61daac4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
