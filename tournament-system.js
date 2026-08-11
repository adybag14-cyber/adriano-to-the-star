/**
 * Tournament System
 * Tournament system
 */

class TournamentSystem {
    constructor() {
        this.tournaments = new Map();
        this.init();
    }
    
    init() {
        this.setupTournaments();
    }
    
    setupTournaments() {
        // Setup tournaments
    }
    
    async createTournament(tournamentData) {
        const tournament = {
            id: Date.now().toString(),
            name: tournamentData.name,
            participants: [],
            brackets: [],
            startDate: tournamentData.startDate,
            endDate: tournamentData.endDate,
            createdAt: Date.now()
        };
        this.tournaments.set(tournament.id, tournament);
        return tournament;
    }
    
    async registerParticipant(tournamentId, userId) {
        const tournament = this.tournaments.get(tournamentId);
        if (tournament && !tournament.participants.includes(userId)) {
            tournament.participants.push(userId);
        }
        return tournament;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.tournamentSystem = new TournamentSystem(); });
} else {
    window.tournamentSystem = new TournamentSystem();
}
