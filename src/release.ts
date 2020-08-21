import os from "os";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import * as git from "nodegit";

import { yq } from "./utils";
import { Helm } from "./tools";

export class Release {
  private helm: Helm;
  private gitToken: string;
  private releasePath: string;

  constructor(releasePath: string, gitToken: string, helm: Helm) {
    this.releasePath = releasePath;
    this.gitToken = gitToken;
    this.helm = helm;
  }

  public async isHelmRelease(): Promise<boolean> {
    return (await this.getValue("kind")) === "HelmRelease";
  }

  public async getChart(currentRepo: string): Promise<string> {
    const chartPath = await this.getValue("spec.chart.path");
    const gitRepo = await this.getValue("spec.chart.git");

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
    const p = await this.getValue("spec.chart.path");
    return (p ?? "").length > 0;
  }

  public async getNamespace(): Promise<string | undefined> {
    return this.getValue("metadata.namespace");
  }

  public async getName(): Promise<string | undefined> {
    return this.getValue("metadata.name");
  }

  public async getValues(): Promise<any> {
    return this.getValue("spec.values");
  }

  /**
   * downloads a chart from a helm repo
   */
  private async download(): Promise<string> {
    const repo = await this.getValue("spec.chart.repository");
    const name = await this.getValue("spec.chart.name");
    const version = await this.getValue("spec.chart.version");

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
    const ref = (await this.getValue("spec.chart.ref")) ?? "master";
    const dir = os.tmpdir();

    const repo = await git.Clone.clone(url, dir, {
      fetchOpts: {
        credentials: () => git.Cred.userpassPlaintextNew("", this.gitToken),
      },
    });
    const gitRef = await repo.getReference(ref);
    await repo.checkoutRef(gitRef);

    const chartPath = await this.getValue("spec.chart.path");

    return path.join(dir, chartPath ?? "");
  }

  private getValue(p: string): Promise<string | undefined> {
    return yq(this.releasePath, p);
  }
}
