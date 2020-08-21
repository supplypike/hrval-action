# hrval-action

![CI](https://github.com/stefanprodan/hrval-action/workflows/CI/badge.svg)
[![Docker](https://img.shields.io/badge/Docker%20Hub-stefanprodan%2Fhrval-blue)](https://hub.docker.com/r/stefanprodan/hrval)

This GitHub action validates a Flux
[Helm Release](https://docs.fluxcd.io/projects/helm-operator/en/latest/references/helmrelease-custom-resource.html)
Kubernetes custom resources with [kubeval](https://github.com/instrumenta/kubeval).

Steps:

- installs kubeval
- extracts the chart source
- downloads the chart from the Helm or Git repository
- extracts the Helm Release values
- runs helm template for the extracted values
- validates the YAMLs using kubeval strict mode

## Usage

Validate Helm release custom resources:

```yaml
name: CI

on: [push, pull_request]

jobs:
  hrval:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v1
      - name: Validate Helm Releases in test dir
        uses: supplypike/hrval-action@v4.0.0
        with:
          helmRelease: test/
      - name: Validate Helm Release from Helm Repo
        uses: supplypike/hrval-action@v4.0.0
        with:
          helmRelease: test/flagger.yaml
          helmVersion: v2
          kubernetesVersion: 1.17.0
      - name: Validate Helm Release from Git Repo
        uses: supplypike/hrval-action@v4.0.0
        with:
          helmRelease: test/podinfo.yaml
          helmVersion: v3
          kubernetesVersion: master
          ignoreValues: true
```

Output:

```text
Processing test/flagger.yaml
Downloading to /tmp/tmp.TuA4QzCOG7
Extracting values to /tmp/tmp.TuA4QzCOG7/flagger.values.yaml
Writing Helm release to /tmp/tmp.TuA4QzCOG7/flagger.release.yaml
Validating Helm release flagger.flagger-system against Kubernetes 1.16.0
WARN - Set to ignore missing schemas
PASS - flagger/templates/psp.yaml contains a valid PodSecurityPolicy
PASS - flagger/templates/psp.yaml contains a valid ClusterRole
PASS - flagger/templates/psp.yaml contains a valid RoleBinding
PASS - flagger/templates/account.yaml contains a valid ServiceAccount
WARN - flagger/templates/crd.yaml containing a CustomResourceDefinition was not validated against a schema
PASS - flagger/templates/prometheus.yaml contains a valid ClusterRole
PASS - flagger/templates/prometheus.yaml contains a valid ClusterRoleBinding
PASS - flagger/templates/prometheus.yaml contains a valid ServiceAccount
PASS - flagger/templates/prometheus.yaml contains a valid ConfigMap
PASS - flagger/templates/prometheus.yaml contains a valid Deployment
PASS - flagger/templates/prometheus.yaml contains a valid Service
PASS - flagger/templates/rbac.yaml contains a valid ClusterRole
PASS - flagger/templates/rbac.yaml contains a valid ClusterRoleBinding
PASS - flagger/templates/deployment.yaml contains a valid Deployment
```

## Usage with private charts repositories

To allow the action to be able to clone private charts repositories, you must [create a GitHub private access token](https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line) and [add it as a secret](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/creating-and-using-encrypted-secrets#creating-encrypted-secrets) to the target repository. NOTE: secret names _cannot_ start with `GITHUB_` as these are reserved.

You can then pass the secret (in this case, `GH_TOKEN`) into the action like so:

```yaml
name: CI

on: [push, pull_request]

jobs:
  hrval:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v1
      - name: Validate Helm Releases in test dir
        uses: supplypike/hrval-action@v4.0.0
        with:
          helmRelease: test/
        env:
          GITHUB_TOKEN: ${{ secrets.GH_TOKEN }}
```

If you set `awsS3Repo: true`, make sure you set the appropriate environment variables for helm s3 plugin to work. Example:

```yaml
name: CI

on: [push, pull_request]

jobs:
  hrval:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v1
      - name: Validate Helm Releases in test dir
        uses: supplypike/hrval-action@v4.0.0
        with:
          helmRelease: test/
          awsS3Repo: true
          awsS3RepoName: example-s3-helm-repo
          awsS3Plugin: https://github.com/hypnoglow/helm-s3.git
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_DEFAULT_REGION: "us-east-1"
```
