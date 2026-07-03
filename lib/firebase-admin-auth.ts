import './firebase-admin'; // Ensure firebase is initialized
import { getAuth } from 'firebase-admin/auth';
import { getApps } from 'firebase-admin/app';

export const auth = getApps().length ? getAuth() : null;
