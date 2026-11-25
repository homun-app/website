// Engramma's public release and roadmap, in one place: the product page,
// the docs and the contract test read them from here. A new Engramma
// release changes VERSION only.
const REPOSITORY = "https://github.com/homun-app/engramma";
const VERSION = "0.6.17-beta.1";
const TAG = `v${VERSION}`;

export const ENGRAMMA_RELEASE = {
	version: VERSION,
	tag: TAG,
	repository: REPOSITORY,
	releaseUrl: `${REPOSITORY}/releases/tag/${TAG}`,
	// GitHub's releases/latest skips prereleases: the installer URL names the version.
	installerUrl: `${REPOSITORY}/releases/download/${TAG}/engramma-cli-installer.sh`,
	readmeUrl: `${REPOSITORY}#readme`,
	compatibilityUrl: `${REPOSITORY}/blob/main/docs/compatibilita.md`,
	mcpDocsUrl: `${REPOSITORY}/blob/main/docs/mcp.md`,
	platforms: [
		{ label: "macOS · Apple Silicon", shipped: true },
		{ label: "Linux · x86_64", shipped: true },
		{ label: "Linux · arm64", shipped: true },
		{ label: "macOS · Intel", shipped: false },
		{ label: "Windows", shipped: false },
	],
};

export const ENGRAMMA_INSTALL_COMMAND = `curl --proto '=https' --tlsv1.2 -LsSf \\
  ${ENGRAMMA_RELEASE.installerUrl} | sh`;

// Claude runs the server over stdio; only the named cells are exposed.
// Claude Desktop does not read the shell PATH: the paths are absolute.
export const ENGRAMMA_CLAUDE_CODE_COMMAND = "claude mcp add engramma -- ~/.cargo/bin/engramma mcp --cells default";
export const ENGRAMMA_CLAUDE_CONFIG = `{
  "mcpServers": {
    "engramma": {
      "command": "/Users/you/.cargo/bin/engramma",
      "args": ["mcp", "--root", "/Users/you/.engramma", "--cells", "default"]
    }
  }
}`;

// Mirrors Engramma's docs/DESIGN.md § 12. Plain language, no internal
// phase numbers except the public versions.
export const ENGRAMMA_ROADMAP = [
	{
		stage: "Available",
		items: [
			{ title: "Inside Homun", body: "Readable notes with sources, dates and quarantine, on your computer." },
			{ title: "Developer preview", body: `Engramma ${VERSION}: the CLI and an MCP server for Claude and other MCP clients.` },
			{ title: "Encrypted sync", body: "The same memory on your own devices, end-to-end encrypted, with no server in between." },
		],
	},
	{
		stage: "Next",
		items: [
			{ title: "More platforms", body: "Windows and Intel Macs, once their builds pass every test." },
			{ title: "Organizations", body: "Shared memory for a team, with signed rules for who can read, propose and write." },
			{ title: "Protection at rest", body: "Encrypted company memory and device revocation." },
		],
	},
	{
		stage: "Later",
		items: [
			{ title: "Engramma server", body: "Many memory spaces in one service, single sign-on and an optional admin console." },
			{ title: "Cluster", body: "Memory spread over many machines, with replicas and backups." },
		],
	},
];
