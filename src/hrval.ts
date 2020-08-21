import * as core from "@actions/core";
import globby from "globby";
import * as path from "path";
import { promises as fs } from "fs";

import { isFile } from "./utils";
import { Release } from "./release";
import { Helm } from "./tools";
import os from "os";

interface Validatable {
  helmRelease: string;
  currentRepo: string;
  ignoreValues: boolean;
  kubeVersion: string;
  gitToken: string;

  // dep injection
  kubeval: (...args: string[]) => Promise<number>;
  helm: Helm;
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

async function validate({
  helmRelease,
  currentRepo,
  ignoreValues,
  kubeVersion,
  gitToken,
  helm,
  kubeval,
}: Validatable): Promise<boolean> {
  const r = new Release(helmRelease, gitToken, helm);

  if (!(await r.isHelmRelease())) {
    core.info(`${helmRelease} is not HelmRelease`);
    return true;
  }

  let chartDir: string;
  try {
    chartDir = await r.getChart(currentRepo);
  } catch (error) {
    core.error(error);
    return false;
  }

  const namespace = await r.getNamespace();
  const releaseName = await r.getName();

  if (!namespace) {
    core.error("missing metadata.namespace");
    return false;
  }

  if (!releaseName) {
    core.error("missing metadata.name");
    return false;
  }

  const dir = os.tmpdir();
  const releaseFile = path.join(dir, `${releaseName}.release.yaml`);
  const valuesFile = path.join(`${releaseName}.values.yaml`);

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

  if (template.error) {
    core.error(template.error);
    return false;
  }

  await fs.writeFile(releaseFile, template.output);

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
