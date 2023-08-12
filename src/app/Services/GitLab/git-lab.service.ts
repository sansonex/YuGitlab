import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {SettingsService} from "../Settings/settings.service";
import {map, Observable} from "rxjs";


export interface CreateReleaseRequest {
  sourceBranchName: string;
}

export interface MergeRequest {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  description: string;
  state: string;
  created_at: string;
  updated_at: string;
  target_branch: string;
  source_branch: string;
  upvotes: number;
  downvotes: number;
}

export interface Environment {
  name: string;

  pipelines: any;

  selectedPipeline: any;

  jobs: any;
}


@Injectable({
  providedIn: 'root'
})
export class GitLabService {
  HEADER: HttpHeaders = new HttpHeaders();

  constructor(private httpClient: HttpClient, private settingsService: SettingsService) {
    this.settingsService.settingsSubject.subscribe((settings: any) => {
      this.HEADER = new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.authToken}`
      });
    });
  }

  getMergeRequests() {
    return this.httpClient.get(`https://gitlab.com/api/v4/projects/${this.settingsService.getSettings().projectId}/merge_requests?state=opened`, {headers: this.HEADER});
  }

  getJobs(pipelineId: any) {
    return this.httpClient.get(`https://gitlab.com/api/v4/projects/${this.settingsService.getSettings().projectId}/pipelines/${pipelineId}/jobs`, {headers: this.HEADER});
  }

  getEnvironmentPipelines(environment: any) {
    return this.httpClient.get(`https://gitlab.com/api/v4/projects/${this.settingsService.getSettings().projectId}/pipelines`, {headers: this.HEADER})
      .pipe(map((response: any) => {
        if (environment === 'QUA') {
          return response.filter((p: any) => p.ref.includes('release'));
        }
        return [];
      }))
  }

  searchBranchByNames(branchName: any): Promise<any> {
    return this.httpClient.get(`https://gitlab.com/api/v4/projects/${this.settingsService.getSettings().projectId}/repository/branches?search=${branchName}`, {headers: this.HEADER}).toPromise();
  }

  async createRelease(releaseRequest: CreateReleaseRequest) {
    console.log(releaseRequest);
    // get curDate in format YYYY-MM-DD-HH-mm
    const curDate = new Date();
    const curDateStr = curDate.getFullYear() + '-' + (curDate.getMonth() + 1) + '-' + curDate.getDate() + '-' + curDate.getHours() + '-' + curDate.getMinutes();

    var branches = await this.searchBranchByNames(`release/${releaseRequest.sourceBranchName.split('/')[1]}`);
    const version = branches.length + 1;

    const branchName = `release/${releaseRequest.sourceBranchName.split('/')[1]}/V${version}`;

    return this.httpClient.post(`https://gitlab.com/api/v4/projects/${this.settingsService.getSettings().projectId}/repository/branches?branch=${branchName}&ref=${releaseRequest.sourceBranchName}`, {}, {headers: this.HEADER})
  }
}
