import { Injectable } from '@angular/core';
import firebase from 'firebase';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { first, switchMap } from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user$: Observable<any>;

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private router: Router
  ) {
    this.user$ = this.afAuth.authState.pipe(
      switchMap((user) => {
        if (user) {
          return this.afs.doc<any>(`users/${user.uid}`).valueChanges();
        } else {
          return of(null);
        }
      })
    );
   }

   getUser(): Promise<any> {
     return this.user$.pipe(first()).toPromise();
   }

   async googleSignin(): Promise<any> {
    const provider = new firebase.auth.GoogleAuthProvider();
    const credential = await this.afAuth.signInWithPopup(provider);
    return this.updateUserData(credential.user);
  }

  async signOut(): Promise<boolean> {
    await this.afAuth.signOut();
    return this.router.navigate(['/']);
  }

  private updateUserData({ uid, email, photoURL, displayName}: any): Promise<any> {
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(
      `users/${uid}`
    );

    const data: any = {
      uid,
      email,
      photoURL,
      displayName,
    };

    return userRef.set(data, { merge: true });
  }
}
