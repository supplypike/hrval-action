import { validate } from "../src/hrval";

test("it validates", async () => {
  const kubeval: any = jest.fn().mockResolvedValue(0);
  const helm: any = jest.fn().mockResolvedValue("");

  await validate(
    {
      helmRelease: "test/podinfo.yaml",
      currentRepo: "git@github.com:supplypike/hrval-action.git",
      ignoreValues: false,
      kubeVersion: "master",

      gitToken: "",
    },
    kubeval,
    helm
  );
});
