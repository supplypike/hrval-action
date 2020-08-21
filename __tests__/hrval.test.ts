import { hrval } from "../src/hrval";

test("it validates", async () => {
  const kubeval: any = jest.fn().mockResolvedValue(0);
  const helm: any = jest.fn().mockResolvedValue({
    error: "",
    content: "",
  });

  const valid = await hrval({
    helmRelease: "test/",
    currentRepo: "git@github.com:supplypike/hrval-action.git",
    ignoreValues: false,
    kubeVersion: "master",
    kubeval,
    gitToken: "",
    helm,
  });

  expect(valid).toBe(true);
});
