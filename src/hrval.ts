import * as core from "@actions/core";
import globby from "globby";
import * as path from "path";
import { promises as fs } from "fs";

import { isFile, execWithOutput } from "./utils";
import { Release } from "./release";
import os from "os";
import { exec } from "@actions/exec";

interface Validatable {
  helmRelease: string;
  currentRepo: string;
  ignoreValues: boolean;
  kubeVersion: string;
  gitToken: string;
}

export async function hrval(v: Validatable): Promise<boolean> {
  if (await isFile(v.helmRelease)) {
    return await validate(v);
  }
  return await validateAll(v);
}

async function validateAll({
  helmRelease,
  ...other
}: Validatable): Promise<boolean> {
  const paths = await globby([
    path.join(helmRelease, `/**/*.yml`),
    path.join(helmRelease, `/**/*.yaml`),
  ]);

  for await (const p of paths) {
    const valid = await validate({
      helmRelease: p,
      ...other,
    });

    if (!valid) {
      return false;
    }
  }

  return true;
}

export async function validate(
  {
    helmRelease,
    currentRepo,
    ignoreValues,
    kubeVersion,
    gitToken,
  }: Validatable,
  // dep injection
  kubeval: (...args: string[]) => Promise<number> = (...args) =>
    exec("kubeval", args),
  helm: (...args: string[]) => Promise<string> = (...args) =>
    execWithOutput("helm", args)
): Promise<boolean> {
  const r = new Release(helmRelease, gitToken, helm);

  if (!(await r.isHelmRelease())) {
    core.info(`${helmRelease} is not HelmRelease`);
    return true;
  }

  const namespace = await r.getNamespace();
  const releaseName = await r.getName();
  const dir = os.tmpdir();
  const releaseFile = path.join(dir, `${releaseName}.release.yaml`);
  const valuesFile = path.join(`${releaseName}.values.yaml`);

  try {
    const chartDir = await r.getChart(currentRepo);

    if (!namespace) {
      core.error("missing metadata.namespace");
      return false;
    }

    if (!releaseName) {
      core.error("missing metadata.name");
      return false;
    }

    if (ignoreValues) {
      core.info("Ignoring Helm release values");
      await fs.writeFile(valuesFile, "");
    } else {
      core.info(`Extracting values to ${valuesFile}`);
      const values = await r.getValues();
      await fs.writeFile(valuesFile, values);
    }

    if (!r.isRepoChart()) {
      core.info(`Adding helm dependencies`);
      await helm("dependency", "build", chartDir);
    }

    core.info(`Writing Helm release to ${releaseFile}`);

    const template = await helm(
      "template",
      releaseName,
      chartDir,
      "--namespace",
      namespace,
      "--skip-crds=true",
      "-f",
      valuesFile
    );

    await fs.writeFile(releaseFile, template);
  } catch (error) {
    console.log(error);
    core.error(error.message);
    return false;
  }

  core.info(
    `Validating Helm release ${releaseName}.${namespace} against Kubernetes ${kubeVersion}`
  );

  const exitCode = await kubeval(
    "--strict",
    "--ignore-missing-schemas",
    "--kubernetes-version",
    kubeVersion,
    releaseFile
  );

  return exitCode === 0;
}
