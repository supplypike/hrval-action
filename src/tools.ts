import * as tc from "@actions/tool-cache";
import * as core from "@actions/core";
import path from "path";

const versions = {
  ct: "3.0.0",
  kubeval: "0.15.0",
  helm: "3.3.0",
};

const paths = {
  ct: "",
  kubeval: "",
  helm: "",
};

export async function useHelm(): Promise<string> {
  const dir = await useToolCache(
    "helm",
    (version) => `https://get.helm.sh/helm-v${version}-linux-amd64.tar.gz`
  );

  return path.join(dir, "linux-amd64/", "helm");
}

export async function useKubeval(): Promise<string> {
  return await useToolCache(
    "kubeval",
    (version) =>
      `https://github.com/instrumenta/kubeval/releases/download/${version}/kubeval-linux-amd64.tar.gz`
  );
}

export async function useCt(): Promise<string> {
  return await useToolCache(
    "ct",
    (version) =>
      `https://github.com/helm/chart-testing/releases/download/v${version}/chart-testing_${version}_linux_amd64.tar.gz`
  );
}

async function useToolCache(
  name: keyof typeof versions,
  getUrl: (version: string) => string
): Promise<string> {
  if (paths[name]) {
    return paths[name];
  }
  const version = versions[name];
  let cachedPath = tc.find(name, version, "x64");
  if (cachedPath) {
    core.addPath(cachedPath);
    return cachedPath;
  }

  const tar = await tc.downloadTool(getUrl(version));
  const bin = await tc.extractTar(tar);
  cachedPath = await tc.cacheDir(bin, name, version, "x64");

  core.addPath(cachedPath);
  return cachedPath;
}
