import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import firebase from 'firebase/app';
import { map, switchMap } from 'rxjs/operators';
import { Observable, combineLatest, of } from 'rxjs';

const _chatsCollection = 'chats';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  constructor(
    private afs: AngularFirestore,
    private auth: AuthService,
    private router: Router
  ) {
    console.log("loading chat service");
  }

  get(chatId: string): Observable<any> {
    return this.afs
      .collection<any>(_chatsCollection)
      .doc(chatId)
      .snapshotChanges()
      .pipe(
        map(doc => {
          return {
            id: doc.payload.id,
            ...doc.payload.data()
          }
        })
      );
  }

  async create(): Promise<boolean> {
    const { uid } = await this.auth.getUser();

    const data = {
      uid,
      createdAt: Date.now(),
      count: 0,
      messages: []
    }

    const docRef = await this.afs.collection(_chatsCollection).add(data);

    return this.router.navigate(['chats', docRef.id]);
  }

  async sendMessage(chatId: string, content: string) : Promise<any> {
    const { uid } = await this.auth.getUser();

    const data = {
      uid,
      createdAt: Date.now(),
      content
    }

    if (uid) {
      const ref = this.afs.collection(_chatsCollection).doc(chatId);
      return ref.update({
        messages: firebase.firestore.FieldValue.arrayUnion(data)
      });
    }
  }

  getUserChats() {
    return this.auth.user$.pipe(
      switchMap(user => {
        return this.afs
          .collection(_chatsCollection, ref => ref.where('uid', '==', user.uid))
          .snapshotChanges()
          .pipe(
            map(actions => {
              return actions.map(a => {
                const data: any = a.payload.doc.data();
                const id = a.payload.doc.id;
                return { id, ...data };
              });
            })
          );
      })
    );
  }

  joinUsers(chat$: Observable<any>) {
    let chat: any;
    const joinKeys: any = {};

    return chat$.pipe(
      switchMap(c => {
        // Unique User IDs
        chat = c;
        const uids = Array.from(new Set(c.messages.map((v:any) => v.uid)));

        // Firestore User Doc Reads
        const userDocs = uids.map(u =>
          this.afs.doc(`users/${u}`).valueChanges()
        );

        return userDocs.length ? combineLatest(userDocs) : of([]);
      }),
      map((arr:any[]) => {
        arr.forEach(v => (joinKeys[(<any>v).uid] = v));
        chat.messages = chat.messages.map((v:any) => {
          return { ...v, user: joinKeys[v.uid] };
        });

        return chat;
      })
    );
  }

}
