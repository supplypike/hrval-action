import os from "os";
import path from "path";
import crypto from "crypto";
import * as exec from "@actions/exec";

import { yq } from "./utils";

export class Release {
  // eslint-disable-next-line no-unused-vars
  constructor(private releasePath: string) {}

  public async isHelmRelease() {
    return (await this.getValue("kind")) === "HelmRelease";
  }

  public async getChart(currentRepo: string): Promise<string> {
    const chartPath = await this.getValue("spec.chart.path");
    const gitRepo = await this.getValue("spec.chart.git");
    const gitRef = await this.getValue("spec.chart.ref");

    console.log({ chartPath, gitRepo, gitRef });

    if (!chartPath) {
      return await this.download();
    }

    if (gitRepo?.includes(currentRepo)) {
      return chartPath;
    }

    return await this.clone();
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

    await exec.exec(`helm repo add ${repoName} ${repo}`);
    await exec.exec(`helm repo update`);
    await exec.exec(
      `helm fetch --version ${version} --untar ${repoName}/${name} --untardir ${dir}`
    );

    return path.join(os.tmpdir(), name);
  }

  private async clone() {
    throw new Error("NOT YET IMPLEMENTED");
    // eslint-disable-next-line no-unreachable
    return "";
  }

  private getValue(p: string): Promise<string | undefined> {
    return yq(this.releasePath, p);
  }
}
