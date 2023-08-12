import {Injectable} from '@angular/core';
import {Subject} from "rxjs";

export interface Settings {
  projectId: any;
  authToken: any;
}

@Injectable({
  providedIn: 'root'
})

export class SettingsService {

  constructor() {
    this.loadSettings();
  }

  public settingsSubject: Subject<Settings>
    = new Subject<Settings>();

  saveSettings(Settings: Settings) {
    localStorage.setItem('projectId', Settings.projectId);
    localStorage.setItem('authToken', Settings.authToken);
    this.settingsSubject.next(Settings);
  }

  loadSettings() {
    let settings: Settings = {
      projectId: localStorage.getItem('projectId'),
      authToken: localStorage.getItem('authToken')
    }
    this.settingsSubject.next(settings);
  }

  getSettings() {
    let settings: Settings = {
      projectId: localStorage.getItem('projectId'),
      authToken: localStorage.getItem('authToken')
    }
    return settings;
  }
}
