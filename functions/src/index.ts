/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

// Example: HTTP function
export const helloWorld = functions.https.onRequest((request, response) => {
  response.send("Hello from Biomo Review!");
});

// TODO: Add more functions as needed for:
// - Sending email notifications
// - Processing screenshots
// - Generating public access tokens
// - Scheduled cleanups
