#!/usr/bin/env bash

set -o errexit

GIT_REPO=${1}
GIT_REF=${2}
GIT_TOKEN=${3}
TMPDIR=$(mktemp -d)


BASE_URL=$(echo "${GIT_REPO}" | sed -e 's/ssh:\/\///' -e 's/http:\/\///' -e 's/https:\/\///' -e 's/git@//' -e 's/:/\//')
GIT_REPO="https://${GIT_TOKEN}:${GIT_TOKEN}@${BASE_URL}"

cd ${TMPDIR}
git init -q
git remote add origin ${GIT_REPO}
git fetch -q origin
git checkout -q ${GIT_REF}
echo ${TMPDIR}