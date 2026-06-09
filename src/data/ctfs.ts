export const TEAM_ID = 419270;
export const CTFTIME_YEAR = '2026';

// Events NOT on CTFtime — manually defined with a sortDate so they
// appear in the right chronological position relative to CTFtime events.
export const manualCtfs = [
    {
        name: 'DEF CON CTF Qualifier 2026',
        sortDate: new Date('2026-05-23'),
        place: 20,
        ctfPoints: null as number | string | null,
        writeups: [] as string[],
        note: 'Played as SWV, no idktheflag rating points',
    },
    {
        name: 'National Cyber League',
        sortDate: new Date('2026-04-12'),
        place: '5th Overall / 1st HS',
        ctfPoints: null as number | string | null,
        writeups: [] as string[],
        note: 'Not on CTFtime',
    },
    {
        name: 'Lockheed CyberQuest',
        sortDate: new Date('2026-03-22'),
        place: '1st & 2nd',
        ctfPoints: '5230 / 5050' as number | string | null,
        writeups: [] as string[],
        note: 'riverxia 1st (full solve), nila 2nd',
    },
    {
        name: 'MetaCTF March 2026 Flash CTF',
        sortDate: new Date('2026-03-20'),
        place: '12th & 13th (full solve)',
        ctfPoints: 1050 as number | string | null,
        writeups: ['whiterabbit-writeup', 'brandkit-studio-writeup'],
        note: 'Individual',
    },
    {
        name: 'picoCTF 2026',
        sortDate: new Date('2026-03-14'),
        place: '14th HS / 35th Global (full solve)',
        ctfPoints: 14500 as number | string | null,
        writeups: ['paper-2-writeup'],
        note: 'Not on CTFtime',
    },
];

// Per-event overrides for CTFtime events.
// Add ratingPoints, notes, or writeups here for any CTFtime event.
export const ctfOverrides: Record<string, {
    ratingPoints?: number;
    note?: string;
    writeups?: string[];
}> = {
    'Grey Cat The Flag 2026 Qualifiers': { ratingPoints: 19.847 },
    'THEM?!CTF 2026':                    { ratingPoints: 50.000, writeups: ['oshit'] },
    'TJCTF 2026':                        { ratingPoints: 36.887 },
    'Midnight Sun CTF 2026 Quals':       { ratingPoints: 25.105 },
    'From Dusk Till Dawn Quals':         { ratingPoints: 13.245, writeups: ['dusk-till-dawn-2026'] },
    'UMDCTF 2026':                       { ratingPoints: 30.105 },
    'UMassCTF 2026':                     { ratingPoints: 24.766 },
    'SillyCTF 2':                        { ratingPoints: 13.486 },
    'NCTF 2026':                         { ratingPoints: 2.883 },
    'RITSEC CTF 2026':                   { ratingPoints: 12.004, note: '7th Academic Division' },
    'TexSAW 2026':                       { ratingPoints: 0.859 },
    '0xFUN CTF 2026':                    { ratingPoints: 7.088 },
    'LA CTF 2026':                       { ratingPoints: 19.276 },
    'Pragyan CTF 2026':                  { ratingPoints: 0.128 },
    'PascalCTF 2026':                    { ratingPoints: 15.394 },
};
