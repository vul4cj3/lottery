import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase, AngularFireList } from '@angular/fire/database';
import { CardsService } from './shoutotsu/cards.service';
import { CardItem } from './shoutotsu/carditem';
import { map, reduce } from 'rxjs/operators';
import { CheckboxControlValueAccessor } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'lottery';

  cards;
  hasFlippedCard = false;
  lockBoard = false;
  firstCard;
  secondCard;
  modal1;
  modal2;

  prizemsg = '';

  constructor(private cardsservice: CardsService, private db: AngularFireDatabase) {

  }

  ngOnInit(): void {
    this.cards = document.querySelectorAll('.memory-card');
    this.modal1 = document.getElementById('popup') as HTMLElement;
    this.modal2 = document.getElementById('popup2') as HTMLElement;
    // this.cards.forEach(card => card.addEventListener('click', this.flipCard));

    if (localStorage.getItem('twitterAC') != undefined) {
      this.shuffle();
    } else {
      this.modal2.classList.add('show');
    }
  }

  scrollSec = (id: string) => {
    const sec = document.getElementById(id);

    sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  flipCard(e): void {
    if (this.lockBoard) { return; }
    if (e === this.firstCard) { return; }

    const tempcard = e as HTMLElement;
    if (tempcard.id.indexOf(';lock') >= 0) { return; }
    tempcard.classList.add('flip');

    if (!this.hasFlippedCard) {
      // first click
      this.hasFlippedCard = true;
      this.firstCard = tempcard;
      // this.firstCard.removeEventListener('click', this.flipCard);

      // update
      // tslint:disable-next-line: max-line-length
      localStorage.setItem('fcardkey', this.firstCard.id + ';lock');
      this.updatecard(this.firstCard.id, { winner: localStorage.getItem('twitterAC'), enable: false, update: this.getnowDate() });

      return;
    }

    // second click
    this.secondCard = tempcard;
    // this.secondCard.removeEventListener('click', this.flipCard(e));
    // update
    // tslint:disable-next-line: max-line-length
    localStorage.setItem('scardkey', this.secondCard.id + ';lock');
    this.updatecard(this.secondCard.id, { winner: localStorage.getItem('twitterAC'), enable: false, update: this.getnowDate() });

  }

  updatecard(key, value): void {
    this.cardsservice.updateCard(key, value);
  }

  getcard(): void {
    const childData = [];
    let num = 0;

    this.cardsservice.getCards().subscribe(res => {
      let over = 14;
      res.forEach(item => {
        childData[num] = item.key + (item.val.enable == false ? ';lock' : '');

        if (item.val.enable == false) {
          over--;
        }

        num++;
      });

      // game over
      if (over === 0) {
        this.lockBoard = true;
        this.modal1.classList.add('show');

        localStorage.setItem('lotteryend', 'yes');
      }
      else {
        num = 0;

        this.cards.forEach(card => {
          card.id = childData[num];

          if (childData[num].indexOf(';lock') >= 0) {
            card.classList.add('lock');
          }
          num++;
        });
      }

      // defense F5 action firstcard is already by fliped situation
      // if (localStorage.getItem('fcardkey') != undefined && localStorage.getItem('scardkey') == undefined) {
      //   const fcard = document.getElementById(localStorage.getItem('fcardkey'));
      //   fcard.classList.remove('lock');
      //   fcard.classList.add('flip');
      // }

    });

  }

  congrats(): void {

    this.db.list('/items', ref => {
      return ref.orderByChild('update').limitToLast(1);
    }).valueChanges(['child_added']).subscribe(snapshot => {
      const item = snapshot as any;
      if (item.length > 1) {
        if (item[0].winner == localStorage.getItem('twitterAC')) {
          if (localStorage.getItem('fcardkey') !== null && localStorage.getItem('scardkey') !== null) {
            this.lockBoard = true;

            localStorage.setItem('lotteryend', 'yes');

            this.prizemsg = this.prizemsg + '&' + item[0].prize;

            this.modal1.classList.add('show');

          } else {
            this.prizemsg = item[0].prize;
          }

        } else {
          const lockcard = document.getElementById(item[0].key);
          if (lockcard != null) {
            lockcard.classList.add('lock');
            lockcard.id = lockcard.id + ';lock';
          }
        }
      }

      this.chkBoard();

    });
  }

  chkBoard(): void {
    let over = 14;
    this.cardsservice.getCards().subscribe(res => {
      res.forEach(item => {

        if (item.val.enable == false) {
          over--;
        }
      });

      if (over === 0) {
        this.lockBoard = true;
        this.modal1.classList.add('show');

        localStorage.setItem('lotteryend', 'yes');
      }
    });
  }

  resetBoard(): void {
    [this.hasFlippedCard, this.lockBoard] = [false, false];
    [this.firstCard, this.secondCard] = [null, null];
  }

  getnowDate(): string {
    const today = new Date();
    const ms = String(today.getMilliseconds()).padStart(2, '0');
    const ss = String(today.getSeconds()).padStart(2, '0');
    const mm = String(today.getMinutes()).padStart(2, '0');
    const HH = String(today.getHours()).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const MM = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();

    return yyyy + '/' + MM + '/' + dd + ' ' + HH + ':' + mm + ':' + ss + ':' + ms;
  }

  shuffle(): void {
    const isChoise = localStorage.getItem('lotteryend');
    if (isChoise === 'yes') {
      this.lockBoard = true;
      this.cards.forEach(card => { card.classList.add('lock'); });
    } else {
      const promise = new Promise((resolve, reject) => {
        this.cards.forEach(card => {
          const randomPos = Math.floor(Math.random() * 14);
          const item = card as HTMLElement;
          item.style.order = randomPos.toString();
        });

        this.congrats();
        resolve('success');
      });

      promise.then((val) => {
        this.getcard();
      });
    }
  }

  setName(): void {
    const val = document.getElementById('twitterID') as HTMLInputElement;
    if (val.value == '') { return alert('ID can not empty!!'); }
    localStorage.setItem('twitterAC', val.value);

    this.modal2.classList.remove('show');

    const promise = new Promise((resolve, reject) => {
      let over = 14;
      this.cardsservice.getCards().subscribe(res => {
        res.forEach(item => {

          if (item.val.enable == false) {
            over--;
          }
        });

        if (over === 0) {
          this.lockBoard = true;
          localStorage.setItem('lotteryend', 'yes');
        }
        resolve('success');
      });

    });

    promise.then((val) => {
      this.shuffle();
    });
  }

}
