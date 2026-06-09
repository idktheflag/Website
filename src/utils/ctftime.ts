import { TEAM_ID, CTFTIME_YEAR, manualCtfs, ctfOverrides } from '../data/ctfs';

export interface CtfEntry {
    name: string;
    date: Date;
    place: string | number;
    ctfPoints: number | string | null;
    ratingPoints: number | null;
    writeups: string[];
    note: string | null;
}

export interface CtfStats {
    overallPlace: number;
    countryPlace: number;
    ratingPoints: number;
    year: string;
}

// Module-level cache so we only fetch once per build (both ctfs.astro and Terminal.astro use this)
let cache: { ctfs: CtfEntry[]; stats: CtfStats } | null = null;

export async function fetchCtfData(): Promise<{ ctfs: CtfEntry[]; stats: CtfStats }> {
    if (cache) return cache;

    const [teamRes, resultsRes] = await Promise.all([
        fetch(`https://ctftime.org/api/v1/teams/${TEAM_ID}/`),
        fetch(`https://ctftime.org/api/v1/results/${CTFTIME_YEAR}/`),
    ]);

    const [teamData, resultsData] = await Promise.all([
        teamRes.json(),
        resultsRes.json(),
    ]);

    const yearRating = teamData.rating?.[CTFTIME_YEAR] ?? {};
    const stats: CtfStats = {
        overallPlace: yearRating.rating_place ?? 0,
        countryPlace: yearRating.country_place ?? 0,
        ratingPoints: Math.round((yearRating.rating_points ?? 0) * 1000) / 1000,
        year: CTFTIME_YEAR,
    };

    // Extract all events where our team participated
    const ctftimeCtfs: CtfEntry[] = Object.values(resultsData as Record<string, any>)
        .filter(event => Array.isArray(event.scores) && event.scores.some((s: any) => s.team_id === TEAM_ID))
        .map(event => {
            const score = event.scores.find((s: any) => s.team_id === TEAM_ID);
            const overrides = ctfOverrides[event.title] ?? {};
            return {
                name: event.title,
                date: new Date(event.time * 1000),
                place: score.place as number,
                ctfPoints: parseFloat(score.points),
                ratingPoints: overrides.ratingPoints ?? (score.rating_points ? Math.round(parseFloat(score.rating_points) * 1000) / 1000 : null),
                writeups: overrides.writeups ?? [],
                note: overrides.note ?? null,
            };
        });

    // Manual non-CTFtime entries
    const manualEntries: CtfEntry[] = manualCtfs.map(c => ({
        name: c.name,
        date: c.sortDate,
        place: c.place,
        ctfPoints: c.ctfPoints,
        ratingPoints: null,
        writeups: c.writeups,
        note: c.note ?? null,
    }));

    // Merge and sort newest-first
    const allCtfs = [...ctftimeCtfs, ...manualEntries]
        .sort((a, b) => b.date.getTime() - a.date.getTime());

    cache = { ctfs: allCtfs, stats };
    return cache;
}
