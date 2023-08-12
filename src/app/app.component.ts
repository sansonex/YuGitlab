import {Component, OnInit} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {SettingsService} from "./Services/Settings/settings.service";
import {Environment, GitLabService, MergeRequest} from "./Services/GitLab/git-lab.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'yu-gitlab';
  mergeRequests: MergeRequest[] = [];
  environments = ['QUA'];

  MRSelected: any;

  timeoutId: any;

  environment: Environment = {
    name: '',
    pipelines: [],
    selectedPipeline: null,
    jobs: []
  };

  progressBar: any = {
    mode: 'buffer',
    value: 0,
    color: 'primary'
  }

  projectId: any;
  authToken: any;

  public onRelease: boolean = false;

  constructor(private httpClient: HttpClient,
              private settingsService: SettingsService,
              private gitLabService: GitLabService) {
    this.settingsService = settingsService;
  }

  ngOnInit(): void {
    this.settingsService.settingsSubject.subscribe((settings: any) => {
      this.projectId = settings.projectId;
      this.authToken = settings.authToken;
    });
    this.settingsService.loadSettings();

    this.getMergeRequests();
  }

  saveSettings() {
    this.settingsService.saveSettings({
      projectId: this.projectId,
      authToken: this.authToken
    });
  }

  trackByFunction(index: any, item: any) {
    return item.id;
  }

  getJobs(pipelineId: any) {
    this.gitLabService.getJobs(pipelineId).subscribe((data: any) => {
      this.environment.jobs = data.reverse();
    });
  }

  private setPipeline(pipeline: any) {
    this.environment.selectedPipeline = pipeline;

    this.getJobs(pipeline.id);
  }

  private setPipelines(pipelines: any) {
    this.environment.pipelines = pipelines;
    if (pipelines.length == 0) {
      this.setSuccessStatus();
      return;
    }
    if (this.timeoutId)
      clearTimeout(this.timeoutId);

    this.setPipeline(pipelines[0]);

    switch (this.environment.selectedPipeline.status) {
      case 'running':
        this.setRunningStatus();
        this.timeoutId = setTimeout(() => {
          this.getEnvironmentPipelines();
        }, 5000);
        break;
      case 'success':
        this.setSuccessStatus();
        break;
      case 'failed':
        this.setFailedStatus();
        break;
      case 'canceled':
        let lastPipelineWithStatusSuccess = pipelines.find((p: any) => p.status == 'success');
        if (lastPipelineWithStatusSuccess) {
          this.environment.pipelines = [lastPipelineWithStatusSuccess];
          this.setPipeline(lastPipelineWithStatusSuccess);

          this.setSuccessStatus();
        } else {
          this.setFailedStatus();
        }
        break;
      default:
        this.setSuccessStatus();
    }
  }

  getEnvironmentPipelines() {
    this.gitLabService.getEnvironmentPipelines(this.environment.name).subscribe((pipelines: any) => {
      this.setPipelines(pipelines);
    });
  }

  getStatusColor(status: any) {
    switch (status) {
      case 'success':
        return 'green';
      case 'failed':
        return 'red';
      case 'running':
        return 'blue';
      case 'created':
        return 'yellow';
      default:
        return 'red';
    }
  }

  release() {
    const mr = this.mergeRequests.find(mr => mr.id == this.MRSelected);
    const ref = `${mr?.source_branch}`;

    this.gitLabService.createRelease({sourceBranchName: ref}).then(() => {
      this.onRelease = true;

      if (this.timeoutId)
        clearTimeout(this.timeoutId);

      this.timeoutId = setTimeout(() => {
        this.getEnvironmentPipelines();
      }, 5000);
    });
  }

  private getMergeRequests() {
    this.gitLabService.getMergeRequests().subscribe((data: any) => {
      this.mergeRequests = data;
    });
  }

  private setRunningStatus() {
    this.progressBar.mode = 'indeterminate';
    this.progressBar.value = 0;
    this.progressBar.color = 'primary';
    this.onRelease = true;
  }

  private setSuccessStatus() {
    this.progressBar.mode = 'determinate';
    this.progressBar.value = 100;
    this.progressBar.color = 'primary';
    this.onRelease = false;
  }

  private setFailedStatus() {
    this.progressBar.mode = 'determinate';
    this.progressBar.value = 0;
    this.progressBar.color = 'warn';
    this.onRelease = false;
  }
}
