import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  getDocs,
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Lead, LeadStage, Order, Interaction } from './types';

export const LeadService = {
  create: async (uid: string, lead: Omit<Lead, 'id' | 'uid' | 'createdAt' | 'updatedAt'>) => {
    try {
      const now = new Date().toISOString();
      return await addDoc(collection(db, 'leads'), {
        ...lead,
        uid,
        createdAt: now,
        updatedAt: now,
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'leads');
    }
  },

  update: async (leadId: string, data: Partial<Lead>) => {
    try {
      const ref = doc(db, 'leads', leadId);
      await updateDoc(ref, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `leads/${leadId}`);
    }
  },

  subscribeAll: (uid: string, callback: (leads: Lead[]) => void) => {
    const q = query(
      collection(db, 'leads'), 
      where('uid', '==', uid),
      orderBy('updatedAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const leads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
      callback(leads);
    }, (e) => handleFirestoreError(e, OperationType.LIST, 'leads'));
  }
};

export const OrderService = {
  create: async (uid: string, order: Omit<Order, 'id' | 'uid' | 'createdAt'>) => {
    try {
      return await addDoc(collection(db, 'orders'), {
        ...order,
        uid,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'orders');
    }
  },

  update: async (orderId: string, data: Partial<Order>) => {
    try {
      const ref = doc(db, 'orders', orderId);
      await updateDoc(ref, data);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `orders/${orderId}`);
    }
  },

  subscribeByLead: (leadId: string, callback: (orders: Order[]) => void) => {
    const q = query(collection(db, 'orders'), where('leadId', '==', leadId), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      callback(orders);
    }, (e) => handleFirestoreError(e, OperationType.LIST, `orders?leadId=${leadId}`));
  },

  subscribeAll: (uid: string, callback: (orders: Order[]) => void) => {
    const q = query(collection(db, 'orders'), where('uid', '==', uid), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      callback(orders);
    }, (e) => handleFirestoreError(e, OperationType.LIST, 'orders'));
  }
};

export const InteractionService = {
  log: async (uid: string, interaction: Omit<Interaction, 'id' | 'uid' | 'timestamp'>) => {
    try {
      return await addDoc(collection(db, 'interactions'), {
        ...interaction,
        uid,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'interactions');
    }
  },

  subscribeByLead: (leadId: string, callback: (interactions: Interaction[]) => void) => {
    const q = query(collection(db, 'interactions'), where('leadId', '==', leadId), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const interactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Interaction));
      callback(interactions);
    }, (e) => handleFirestoreError(e, OperationType.LIST, 'interactions'));
  }
};
