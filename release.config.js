module.exports = {
  debug: true,
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'docs/changelog.md',
        changelogTitle: '---\ntitle: Changelog\n---',
      },
    ],
    '@semantic-release/npm',
    [
      '@semantic-release/git',
      {
        assets: ['docs/changelog.md'],
      },
    ],
    '@semantic-release/github',
  ],
}
