import { ref, get, set } from 'firebase/database';
import { db } from './lib/firebase';

export async function initializeUsers(allowedEmails: string[]) {
  try {
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    
    // Se não há usuários, cria alguns padrão
    if (!snapshot.exists()) {
      const defaultUsers = allowedEmails.map((email, index) => ({
        id: `user_${index + 1}`,
        email,
        name: email.split('@')[0],
        createdAt: new Date().toISOString()
      }));
      
      for (const user of defaultUsers) {
        await set(ref(db, `users/${user.id}`), user);
      }
    }
  } catch (error) {
    console.error('Error initializing users:', error);
  }
}
