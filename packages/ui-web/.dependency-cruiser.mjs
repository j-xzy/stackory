import getConfig from '@infra/dep-presets';

const config = getConfig();

// Registry components are intentionally orphaned — consumed via shadcn registry, not JS imports
const noOrphansRule = config.forbidden.find((r) => r.name === 'no-orphans');
if (noOrphansRule) {
	noOrphansRule.from.pathNot.push('^registry/');
}

export default config;
