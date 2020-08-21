import os from "os";
import path from "path";
import crypto from "crypto";

import { yq, execWithOutput } from "./utils";

export class Release {
  private helm: (...args: string[]) => Promise<string>;
  private gitToken: string;
  private releasePath: string;

  constructor(
    releasePath: string,
    gitToken: string,
    helm: (...args: string[]) => Promise<string>
  ) {
    this.releasePath = releasePath;
    this.gitToken = gitToken;
    this.helm = helm;
  }

  public async isHelmRelease(): Promise<boolean> {
    return (await this.getValue("kind")) === "HelmRelease";
  }

  public async getChart(currentRepo: string): Promise<string> {
    const chartPath = await this.getValue<string>("spec.chart.path");
    const gitRepo = await this.getValue<string>("spec.chart.git");

    if (!chartPath) {
      return await this.download();
    }

    if (!gitRepo) {
      return chartPath;
    }

    if (gitRepo?.includes(currentRepo)) {
      return chartPath;
    }

    return await this.clone(gitRepo);
  }

  public async isRepoChart(): Promise<boolean> {
    const p = await this.getValue<string>("spec.chart.path");
    return (p ?? "").length > 0;
  }

  public async getNamespace(): Promise<string | undefined> {
    return this.getValue<string>("metadata.namespace");
  }

  public async getName(): Promise<string | undefined> {
    return this.getValue<string>("metadata.name");
  }

  public async getValues(): Promise<any> {
    return this.getValue<unknown>("spec.values");
  }

  /**
   * downloads a chart from a helm repo
   */
  private async download(): Promise<string> {
    const repo = await this.getValue<string>("spec.chart.repository");
    const name = await this.getValue<string>("spec.chart.name");
    const version = await this.getValue<string>("spec.chart.version");

    if (!name || !repo || !version) {
      throw new Error(`Invalid release ${this.releasePath}`);
    }

    const dir = os.tmpdir();
    const repoName = crypto.createHash("md5").update(name).digest("hex");

    await this.helm("repo", "add", repoName, repo);
    await this.helm("repo", "update");
    await this.helm(
      "fetch",
      "--version",
      version,
      "--untar",
      `${repoName}/${name}`,
      "--untardir",
      dir
    );

    return path.join(dir, name);
  }

  private async clone(url: string) {
    const ref = (await this.getValue<string>("spec.chart.ref")) ?? "master";

    const chartPath = await this.getValue<string>("spec.chart.path");

    const dir = await execWithOutput("./src/clone.sh", [
      url,
      ref,
      this.gitToken,
    ]);

    return path.join(dir, chartPath ?? "");
  }

  private async getValue<T>(p: string): Promise<T> {
    return (await yq(this.releasePath, p)) as T;
  }
}
