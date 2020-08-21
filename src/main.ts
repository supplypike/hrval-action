import * as core from "@actions/core";
import { hrval, Validatable } from "./hrval";

async function run(): Promise<void> {
  try {
    const helmRelease = core.getInput("helmRelease");
    const ignoreValues =
      core.getInput("ignoreValues") === "true" ? true : false;
    const kubeVersion = core.getInput("kubernetesVersion");

    const v: Validatable = {
      helmRelease,
      ignoreValues,
      kubeVersion,
      currentRepo: process.env.GITHUB_REPOSITORY ?? "",
      gitToken: process.env.GITHUB_TOKEN ?? "",
    };

    const numFilesTested = await hrval(v);
    core.setOutput("numFilesTested", numFilesTested);
  } catch (error) {
    core.setFailed(error.message);
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
run();
