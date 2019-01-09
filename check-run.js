#!/usr/bin/env node
const jwt = require('jsonwebtoken');
const fs = require('fs');
const fetch = require('node-fetch');
const { getGitSha } = require('ci-utils');

const installationId = '23168';
const repoSlug = `evanlovely/sandbox-travis`;
const privateKey = fs.readFileSync(
  './test-basalt-github-app.2019-01-08.private-key.pem',
  'utf8',
);

const jwtToken = jwt.sign(
  {
    iss: installationId,
    // exp: Math.floor(Date.now() / 1000) + (10 * 60),
  },
  privateKey,
  {
    algorithm: 'RS256',
    expiresIn: '10m',
  },
);

const getHeaders = token => ({
  'Content-Type': 'application/json',
  Accept:
    'application/vnd.github.antiope-preview+json, application/vnd.github.machine-man-preview+json, application/vnd.github.v3+json',
  Authorization: `Bearer ${token}`,
});

/**
 * @param {string} installationId
 * @return {Promise<{token: string, expires_at: string}>}
 */
async function getAccessToken(installationId = '') {
  try {
    return fetch(
      `https://api.github.com/app/installations/${installationId}/access_tokens`,
      {
        method: 'POST',
        headers: {
          ...getHeaders(jwtToken),
        },
      },
    ).then(res => res.json());
  } catch (err) {
    console.error('error getting access token ', err);
    process.exit(1);
  }
}

async function setCheckRun({ name, status, output, token }) {
  try {
    return fetch(`https://api.github.com/repos/${repoSlug}/check-runs`, {
      method: 'POST',
      headers: {
        ...getHeaders(token),
      },
      body: JSON.stringify({
        name,
        status,
        output,
        head_sha: getGitSha(),
      }),
    }).then(res => res.json());
  } catch (err) {
    console.error('error setting check run ' + name + ' to ' + status, err);
    process.exit(1);
  }
}

async function go() {
  const { token } = await getAccessToken('561764');
  if (!token) {
    console.error('uh oh, no token!');
    process.exit(1);
  }
  const results = await setCheckRun({
    name: 'ima tester',
    status: 'in_progress',
    token,
    output: {
      title: 'ima output title',
      summary: 'ima output summary',
      text: 'ima output text *with* markdown!!',
      images: [
        {
          alt: 'img 1',
          image_url: 'https://design.basalt.io/images/brand-stock/julentto-photography-184055.jpg',
          caption: 'ima caption for img 1',
        },
        {
          alt: 'img 2',
          image_url: 'https://design.basalt.io/images/brand-stock/clarisse-meyer-304306.jpg',
          caption: 'ima caption for img 2',
        },
      ]
    },
  });
  console.log('setCheckRun results', results);
}

go();
