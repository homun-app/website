// Shared shapes of the family components. The pages and their adapters build
// these; the components only read them.

export type Product = "homun" | "engramma";

/** One release of a roadmap: a version, what it brought, and where to read it. */
export interface Release {
	version: string;
	/** A date or a stage, printed after the version when there is one. */
	meta?: string;
	title: string;
	body: string;
	href?: string;
}

/** A group of releases under one label: "Foundations · shipped", "Now", "Next". */
export interface Era {
	label: string;
	releases: readonly Release[];
}
