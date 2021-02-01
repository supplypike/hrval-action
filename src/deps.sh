#!/usr/bin/env bash

set -o errexit

curl -sL https://storage.googleapis.com/kubernetes-release/release/"$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)"/bin/linux/amd64/kubectl -o /usr/local/bin/kubectl && chmod +x /usr/local/bin/kubectl

curl -sL https://github.com/mikefarah/yq/releases/download/3.1.0/yq_linux_amd64 -o /usr/local/bin/yq && chmod +x /usr/local/bin/yq

curl -sSL https://get.helm.sh/helm-v3.5.1-linux-amd64.tar.gz | tar xz && mv linux-amd64/helm /bin/helm && rm -rf linux-amd64
ln -s /bin/helm /bin/helmv3

helmv3 version