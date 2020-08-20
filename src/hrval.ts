import * as core from "@actions/core";
import * as path from "path";
import { isFile } from "./utils";
import globby from "globby";
import { Release } from "./release";
import { writeFile } from "fs/promises";

interface Validatable {
  helmRelease: string;
  currentRepo: string;
  ignoreValues: boolean;
  kubeVersion: string;
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
}: Validatable): Promise<boolean> {
  console.log("validate", helmRelease);
  const r = new Release(helmRelease);

  if (!(await r.isHelmRelease())) {
    console.log(`${helmRelease} is not HelmRelease`);
    core.info(`${helmRelease} is not HelmRelease`);
    return true;
  }

  const chartPath = await r.getChart(currentRepo);
  const namespace = await r.getNamespace();
  const releaseName = r.getName();

  if (!namespace) {
    core.error("missing metadata.namespace");
    return false;
  }

  if (!releaseName) {
    core.error("missing metadata.name");
    return false;
  }

  const releaseFile = `${releaseName}.release.yaml`;
  const valuesFile = `${releaseName}.values.yaml`;
  /**
   * 
   * 
   *   if [[ ${IGNORE_VALUES} == "true" ]]; then
    echo "Ingnoring Helm release values"
    echo "" > ${TMPDIR}/${HELM_RELEASE_NAME}.values.yaml
  else
    echo "Extracting values to ${TMPDIR}/${HELM_RELEASE_NAME}.values.yaml"
    yq r ${HELM_RELEASE} spec.values > ${TMPDIR}/${HELM_RELEASE_NAME}.values.yaml
  fi

  echo "Writing Helm release to ${TMPDIR}/${HELM_RELEASE_NAME}.release.yaml"
  if [[ "${CHART_PATH}" ]]; then
    helm dependency build ${CHART_DIR}
  fi

  helm template ${HELM_RELEASE_NAME} ${CHART_DIR} \
    --namespace ${HELM_RELEASE_NAMESPACE} \
    --skip-crds=true \
    -f ${TMPDIR}/${HELM_RELEASE_NAME}.values.yaml > ${TMPDIR}/${HELM_RELEASE_NAME}.release.yaml

  echo "Validating Helm release ${HELM_RELEASE_NAME}.${HELM_RELEASE_NAMESPACE} against Kubernetes ${KUBE_VER}"
  kubeval --strict --ignore-missing-schemas --kubernetes-version ${KUBE_VER} ${TMPDIR}/${HELM_RELEASE_NAME}.release.yaml
   */

  if (ignoreValues) {
    core.info("Ignoring Helm release values");
    await writeFile(valuesFile, "");
  } else {
    core.info(`Extracting values to ${valuesFile}`);
    const values = await r.getValues();
    await writeFile(valuesFile, values);
  }

  return true;
}
