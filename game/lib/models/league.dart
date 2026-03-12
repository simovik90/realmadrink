import 'dart:math';

class AIPlayer {
  final String name;
  final bool isGoalkeeper;
  final int overall;
  final int pace;
  final int shooting;
  final int passing;
  final int dribbling;
  final int defending;
  final int physical;
  final int reflexes;

  const AIPlayer({
    required this.name,
    required this.isGoalkeeper,
    required this.overall,
    required this.pace,
    required this.shooting,
    required this.passing,
    required this.dribbling,
    required this.defending,
    required this.physical,
    required this.reflexes,
  });
}

class SerieATeam {
  final String name;
  final String shortName;
  final String emoji;
  final int strength; // 1-100, forza complessiva squadra

  // Statistiche stagione
  int played = 0;
  int won = 0;
  int drawn = 0;
  int lost = 0;
  int goalsFor = 0;
  int goalsAgainst = 0;

  int get points => won * 3 + drawn;
  int get goalDifference => goalsFor - goalsAgainst;

  SerieATeam({
    required this.name,
    required this.shortName,
    required this.emoji,
    required this.strength,
  });

  void recordResult(int gf, int ga) {
    played++;
    goalsFor += gf;
    goalsAgainst += ga;
    if (gf > ga) won++;
    else if (gf == ga) drawn++;
    else lost++;
  }

  void reset() {
    played = 0; won = 0; drawn = 0; lost = 0;
    goalsFor = 0; goalsAgainst = 0;
  }

  // Genera rosa AI basata sulla forza
  List<AIPlayer> generateSquad(Random rng) {
    final List<AIPlayer> squad = [];
    final int base = strength;

    int _r(int b) => (b + rng.nextInt(21) - 10).clamp(40, 95);

    // 1 portiere
    squad.add(AIPlayer(name: 'Portiere', isGoalkeeper: true,
      overall: _r(base), pace: _r(base-10), shooting: _r(base-25),
      passing: _r(base-5), dribbling: _r(base-10), defending: _r(base+5),
      physical: _r(base+5), reflexes: _r(base+15)));

    // 2 difensori
    for (int i = 0; i < 2; i++) {
      squad.add(AIPlayer(name: 'Difensore ${i+1}', isGoalkeeper: false,
        overall: _r(base), pace: _r(base), shooting: _r(base-10),
        passing: _r(base-5), dribbling: _r(base-5), defending: _r(base+10),
        physical: _r(base+5), reflexes: _r(base-15)));
    }

    // 2 centrocampisti
    for (int i = 0; i < 2; i++) {
      squad.add(AIPlayer(name: 'Centrocampista ${i+1}', isGoalkeeper: false,
        overall: _r(base), pace: _r(base), shooting: _r(base),
        passing: _r(base+8), dribbling: _r(base+5), defending: _r(base-5),
        physical: _r(base), reflexes: _r(base-15)));
    }

    // 2 attaccanti
    for (int i = 0; i < 2; i++) {
      squad.add(AIPlayer(name: 'Attaccante ${i+1}', isGoalkeeper: false,
        overall: _r(base), pace: _r(base+8), shooting: _r(base+12),
        passing: _r(base), dribbling: _r(base+8), defending: _r(base-15),
        physical: _r(base), reflexes: _r(base-15)));
    }

    return squad;
  }
}

// Le 20 squadre di Serie A 2024/25
final List<SerieATeam> serieATeams = [
  SerieATeam(name: 'Inter', shortName: 'INT', emoji: '⚫🔵', strength: 88),
  SerieATeam(name: 'Napoli', shortName: 'NAP', emoji: '🔵', strength: 85),
  SerieATeam(name: 'Juventus', shortName: 'JUV', emoji: '⚫⚪', strength: 84),
  SerieATeam(name: 'AC Milan', shortName: 'MIL', emoji: '🔴⚫', strength: 83),
  SerieATeam(name: 'Atalanta', shortName: 'ATA', emoji: '⚫🔵', strength: 82),
  SerieATeam(name: 'Lazio', shortName: 'LAZ', emoji: '🔵⚪', strength: 78),
  SerieATeam(name: 'Fiorentina', shortName: 'FIO', emoji: '🟣', strength: 76),
  SerieATeam(name: 'Roma', shortName: 'ROM', emoji: '🟡🔴', strength: 75),
  SerieATeam(name: 'Bologna', shortName: 'BOL', emoji: '🔴🔵', strength: 74),
  SerieATeam(name: 'Torino', shortName: 'TOR', emoji: '🟤', strength: 68),
  SerieATeam(name: 'Udinese', shortName: 'UDI', emoji: '⚪⚫', strength: 65),
  SerieATeam(name: 'Genoa', shortName: 'GEN', emoji: '🔴🔵', strength: 64),
  SerieATeam(name: 'Cagliari', shortName: 'CAG', emoji: '🔴🔵', strength: 63),
  SerieATeam(name: 'Hellas Verona', shortName: 'VER', emoji: '🟡🔵', strength: 62),
  SerieATeam(name: 'Sassuolo', shortName: 'SAS', emoji: '🟢⚫', strength: 61),
  SerieATeam(name: 'Lecce', shortName: 'LEC', emoji: '🟡🔴', strength: 60),
  SerieATeam(name: 'Venezia', shortName: 'VEN', emoji: '🟠⚫', strength: 59),
  SerieATeam(name: 'Como', shortName: 'COM', emoji: '🔵', strength: 58),
  SerieATeam(name: 'Empoli', shortName: 'EMP', emoji: '🔵', strength: 57),
  SerieATeam(name: 'Monza', shortName: 'MON', emoji: '⚪🔴', strength: 56),
];

class MatchEvent {
  final int minute;
  final String type; // 'goal', 'save', 'miss', 'foul', 'yellow', 'red'
  final String description;
  final bool isHomeTeam;

  const MatchEvent({
    required this.minute,
    required this.type,
    required this.description,
    required this.isHomeTeam,
  });
}

class MatchResult {
  final String homeTeam;
  final String awayTeam;
  final int homeGoals;
  final int awayGoals;
  final List<MatchEvent> events;
  final bool isUserTeam; // la partita coinvolge RealMadrink?
  final bool userIsHome;

  const MatchResult({
    required this.homeTeam,
    required this.awayTeam,
    required this.homeGoals,
    required this.awayGoals,
    required this.events,
    required this.isUserTeam,
    required this.userIsHome,
  });
}

class Fixture {
  final int round;
  final int homeTeamIndex; // -1 = RealMadrink
  final int awayTeamIndex; // -1 = RealMadrink
  MatchResult? result;

  Fixture({
    required this.round,
    required this.homeTeamIndex,
    required this.awayTeamIndex,
  });

  bool get isUserMatch => homeTeamIndex == -1 || awayTeamIndex == -1;
}
