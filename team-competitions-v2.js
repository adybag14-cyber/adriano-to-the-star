/**
 * Team Competitions v2
 * Advanced team competitions system
 */

class TeamCompetitionsV2 {
    constructor() {
        this.competitions = new Map();
        this.teams = new Map();
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        return { success: true, message: 'Team Competitions v2 initialized' };
    }

    createCompetition(name, description, duration) {
        if (duration <= 0) {
            throw new Error('Duration must be positive');
        }
        const competition = {
            id: Date.now().toString(),
            name,
            description,
            duration,
            startDate: new Date(),
            endDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
            status: 'active',
            createdAt: new Date()
        };
        this.competitions.set(competition.id, competition);
        this.teams.set(competition.id, []);
        return competition;
    }

    createTeam(competitionId, name, members) {
        if (!Array.isArray(members) || members.length === 0) {
            throw new Error('Members must be a non-empty array');
        }
        const competition = this.competitions.get(competitionId);
        if (!competition || competition.status !== 'active') {
            throw new Error('Competition not found or inactive');
        }
        const team = {
            id: Date.now().toString(),
            competitionId,
            name,
            members,
            score: 0,
            createdAt: new Date()
        };
        const teams = this.teams.get(competitionId);
        teams.push(team);
        return team;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TeamCompetitionsV2;
}

