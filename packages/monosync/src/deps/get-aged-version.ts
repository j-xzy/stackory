import semver from 'semver';

type NpmPackageMetadata = {
	'dist-tags': {
		latest?: string;
	};
	time?: Record<string, string>;
};

function packageMetadataUrl(registry: string, name: string): string {
	const normalizedRegistry = registry.replace(/\/+$/, '');
	return `${normalizedRegistry}/${encodeURIComponent(name)}`;
}

export async function getAgedVersion(
	name: string,
	minAgeDays = 0,
	registry = 'https://registry.npmjs.org',
): Promise<string | null | undefined> {
	try {
		const res = await fetch(packageMetadataUrl(registry, name));
		const meta = (await res.json()) as NpmPackageMetadata;
		const latest = meta['dist-tags'].latest;

		if (!latest) {
			return undefined;
		}

		if (!minAgeDays) {
			return latest;
		}

		const cutoff = Date.now() - minAgeDays * 86_400_000;
		const eligible = Object.entries(meta.time ?? {})
			.filter(
				([version, date]) =>
					version !== 'created' &&
					version !== 'modified' &&
					semver.valid(version) &&
					semver.prerelease(version) === null &&
					semver.lte(version, latest) &&
					new Date(date).getTime() <= cutoff,
			)
			.map(([version]) => version)
			.sort(semver.rcompare);

		return eligible[0];
	} catch {
		console.error(`Failed to fetch ${name}`);
		return null;
	}
}
