/**
 * Tournament System Advanced
 * Advanced tournament management system
 */

class TournamentSystemAdvanced {
    constructor() {
        this.tournaments = new Map();
        this.participants = new Map();
        this.matches = new Map();
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        return { success: true, message: 'Tournament System Advanced initialized' };
    }

    createTournament(name, format, startDate, endDate) {
        if (startDate >= endDate) {
            throw new Error('Start date must be before end date');
        }
        const tournament = {
            id: Date.now().toString(),
            name,
            format,
            startDate,
            endDate,
            createdAt: new Date(),
            status: 'registration',
            participantCount: 0
        };
        this.tournaments.set(tournament.id, tournament);
        return tournament;
    }

    registerParticipant(tournamentId, userId) {
        const tournament = this.tournaments.get(tournamentId);
        if (!tournament) {
            throw new Error('Tournament not found');
        }
        const participation = {
            id: Date.now().toString(),
            tournamentId,
            userId,
            registeredAt: new Date()
        };
        this.participants.set(participation.id, participation);
        tournament.participantCount++;
        return participation;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TournamentSystemAdvanced;
}

