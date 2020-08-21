import * as tc from "@actions/tool-cache";
import * as core from "@actions/core";
import * as exec from "@actions/exec";

const KUBEVAL_VER = "0.15.0";
const CT_VER = "3.0.0";

export async function setupTools(): Promise<void> {
  await setupKubeval();
  await setupChartTesting();
}

async function setupKubeval() {
  let cachedPath = tc.find("kubeval", KUBEVAL_VER, "x64");
  if (cachedPath) {
    core.addPath(cachedPath);
    return;
  }

  const tar = await tc.downloadTool(
    `https://github.com/instrumenta/kubeval/releases/download/${KUBEVAL_VER}/kubeval-linux-amd64.tar.gz`
  );
  const bin = await tc.extractTar(tar);
  cachedPath = await tc.cacheDir(bin, "kubeval", KUBEVAL_VER, "x64");

  core.addPath(cachedPath);
}

export async function kubeval(...args: string[]): Promise<number> {
  return await exec.exec("kubeval", args);
}

async function setupChartTesting() {
  let cachedPath = tc.find("ct", CT_VER, "x64");
  if (cachedPath) {
    core.addPath(cachedPath);
    return;
  }

  const tar = await tc.downloadTool(
    `https://github.com/helm/chart-testing/releases/download/v${CT_VER}/chart-testing_${CT_VER}_linux_amd64.tar.gz`
  );
  const bin = await tc.extractTar(tar);
  cachedPath = await tc.cacheDir(bin, "ct", CT_VER, "x64");

  core.addPath(cachedPath);
}
