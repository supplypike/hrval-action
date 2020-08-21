import * as core from "@actions/core";
import globby from "globby";
import * as path from "path";
import { promises as fs } from "fs";
import os from "os";

import { isFile, execWithOutput, yw } from "./utils";
import { Release } from "./release";
import { useKubeval, useHelm } from "./tools";

export interface Validatable {
  helmRelease: string;
  currentRepo: string;
  ignoreValues: boolean;
  kubeVersion: string;
  gitToken: string;
}

export async function hrval(v: Validatable): Promise<number> {
  if (await isFile(v.helmRelease)) {
    await validate(v);
    return 1;
  }
  return await validateAll(v);
}

async function validateAll({
  helmRelease,
  ...other
}: Validatable): Promise<number> {
  const paths = await globby([
    path.join(helmRelease, `/**/*.yml`),
    path.join(helmRelease, `/**/*.yaml`),
  ]);

  let numFilesTested = 0;

  for await (const p of paths) {
    await validate({
      helmRelease: p,
      ...other,
    });

    numFilesTested += 1;
  }

  return numFilesTested;
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
  kubeval: (...args: string[]) => Promise<string> = async (...args) =>
    await execWithOutput(await useKubeval(), args),
  helm: (...args: string[]) => Promise<string> = async (...args) =>
    await execWithOutput(await useHelm(), args)
): Promise<void> {
  const r = new Release(helmRelease, gitToken, helm);

  if (!(await r.isHelmRelease())) {
    core.info(`${helmRelease} is not HelmRelease`);
    return;
  }

  const namespace = await r.getNamespace();
  const releaseName = await r.getName();
  const dir = os.tmpdir();
  const releaseFile = path.join(dir, `${releaseName}.release.yaml`);
  const valuesFile = path.join(`${releaseName}.values.yaml`);

  const chartDir = await r.getChart(currentRepo);

  if (!namespace) {
    throw new Error("missing metadata.namespace");
  }

  if (!releaseName) {
    throw new Error("missing metadata.name");
  }

  if (ignoreValues) {
    core.info("Ignoring Helm release values");
    await yw(valuesFile, {});
  } else {
    core.info(`Extracting values to ${valuesFile}`);
    const values = await r.getValues();
    await yw(valuesFile, values);
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

  core.info(
    `Validating Helm release ${releaseName}.${namespace} against Kubernetes ${kubeVersion}`
  );

  await kubeval(
    "--strict",
    "--ignore-missing-schemas",
    "--kubernetes-version",
    kubeVersion,
    releaseFile
  );
}
