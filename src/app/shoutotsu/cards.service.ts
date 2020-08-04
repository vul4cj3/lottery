import { Injectable } from '@angular/core';
import { AngularFireDatabase, AngularFireList, AngularFireObject } from '@angular/fire/database';
import { Observable } from 'rxjs';
import { CardItem } from './carditem';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CardsService {

  private dbPath = '/';
  cardsRef: AngularFireList<any>;
  items$: Observable<any[]>;

  constructor(private db: AngularFireDatabase) {
    this.cardsRef = db.list('/items');
  }

  createCard(item: CardItem): void {
    this.cardsRef.push(item);
  }

  updateCard(key: string, value: any): Promise<void> {
    return this.cardsRef.update(key, value);
  }

  documentToDomainObject = _ => {
    const object = { key: _.payload.key, val: _.payload.val() };
    return object;
  }

  getCards(): Observable<any[]> {
    this.items$ = this.db.list('/items').snapshotChanges()
      .pipe(map(actions => actions.map(this.documentToDomainObject)));

    return this.items$;
  }

  cardchange(): any {
    this.db.list('/items', ref => {
      return ref.orderByChild('update').limitToLast(1);
    });
    return null;
  }

}
