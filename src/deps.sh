#!/usr/bin/env bash
set -o errexit

echo "Installing dependancies"
mkdir -p $GITHUB_WORKSPACE/hrval

curl -sL https://github.com/mikefarah/yq/releases/download/3.1.0/yq_linux_amd64 -o $GITHUB_WORKSPACE/hrval/yq && chmod +x $GITHUB_WORKSPACE/hrval/yq

curl -sL https://github.com/instrumenta/kubeval/releases/latest/download/kubeval-linux-amd64.tar.gz | tar xz
cp kubeval $GITHUB_WORKSPACE/hrval/kubeval && chmod +x $GITHUB_WORKSPACE/hrval/kubeval

echo "::add-path::$GITHUB_WORKSPACE/hrval"