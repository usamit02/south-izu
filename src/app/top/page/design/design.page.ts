import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-design',
  templateUrl: './design.page.html',
  styleUrls: ['./design.page.scss'],
})
export class DesignPage implements OnInit {
  darkmode: boolean;
  enterkey: boolean;
  installed: boolean;
  deferredPrompt;
  constructor() { }

  ngOnInit() {
    this.darkmode = localStorage.getItem('theme') === "dark" ? true : false;
    this.enterkey = localStorage.getItem('enterkey') === "true" ? true : false;
    window.addEventListener('beforeinstallprompt', (e) => {// Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();// Stash the event so it can be triggered later on the button event.
      this.deferredPrompt = e;// Update UI by showing a button to notify the user they can add to home screen   
      this.installed = true;
    });
    //button click event to show the promt 
    window.addEventListener('appinstalled', (event) => {
      alert('ホーム画面に追加しました。');
    });
    if (window.matchMedia('(display-mode: standalone)').matches) {
      alert('display-mode is standalone');
    }
  }
  change(item) {
    if (item === "darkmode") {
      document.body.classList.toggle('dark', this.darkmode);
      let theme = this.darkmode ? "dark" : "normal";
      localStorage.setItem("theme", theme);
    } else {
      localStorage.setItem(item, this[item]);
    }
  }
  addHome() {
    debugger
    // hide our user interface that shows our button
    // Show the prompt
    this.deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    this.deferredPrompt.userChoice
      .then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          alert('User accepted the prompt');
        } else {
          alert('User dismissed the prompt');
        }
        this.deferredPrompt = null;
      });
  };
}
