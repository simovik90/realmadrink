import 'dart:math';

class Player {
  final String id;
  final String name;
  final bool isGoalkeeper;
  final String? imageUrl;
  final int? age;
  final bool? practicesSport;
  final int? sportTimesPerWeek;
  final bool? hasPlayedFootball;
  final int? footballYearsAgo;

  // Attributi calcolati (1-99)
  late final int pace;       // Velocità
  late final int shooting;   // Tiro
  late final int passing;    // Passaggi
  late final int dribbling;  // Dribbling
  late final int defending;  // Difesa
  late final int physical;   // Fisico
  late final int reflexes;   // Riflessi (portiere)
  late final int overall;    // Overall

  Player({
    required this.id,
    required this.name,
    required this.isGoalkeeper,
    this.imageUrl,
    this.age,
    this.practicesSport,
    this.sportTimesPerWeek,
    this.hasPlayedFootball,
    this.footballYearsAgo,
  }) {
    _generateAttributes();
  }

  void _generateAttributes() {
    // Base: tutti partono da 40
    final rng = Random(id.hashCode);

    int base = 40;

    // Bonus sport praticato
    if (practicesSport == true) {
      base += 8;
      if (sportTimesPerWeek != null) {
        base += min(sportTimesPerWeek! * 3, 15);
      }
    }

    // Bonus calcio giocato
    if (hasPlayedFootball == true) {
      base += 10;
      if (footballYearsAgo != null && footballYearsAgo! <= 2) {
        base += 8; // ha giocato di recente
      } else if (footballYearsAgo != null && footballYearsAgo! <= 5) {
        base += 4;
      }
    }

    // Età: picco tra 24-30, calo dopo 35
    final effectiveAge = age ?? 27;
    if (effectiveAge >= 24 && effectiveAge <= 30) {
      base += 5;
    } else if (effectiveAge > 30 && effectiveAge <= 35) {
      base += 2;
    } else if (effectiveAge > 35) {
      base -= 5;
    }

    base = base.clamp(38, 72);

    // Variazione casuale per attributi individuali (±15)
    int _rand(int b) => (b + rng.nextInt(16) - 5).clamp(35, 85);

    if (isGoalkeeper) {
      pace      = _rand(base - 5);
      shooting  = _rand(base - 20);
      passing   = _rand(base - 5);
      dribbling = _rand(base - 10);
      defending = _rand(base + 10);
      physical  = _rand(base + 5);
      reflexes  = _rand(base + 15);
      overall   = ((reflexes * 0.35 + defending * 0.25 + physical * 0.15 + passing * 0.15 + pace * 0.1)).round().clamp(35, 85);
    } else {
      pace      = _rand(base + 5);
      shooting  = _rand(base);
      passing   = _rand(base);
      dribbling = _rand(base);
      defending = _rand(base - 5);
      physical  = _rand(base);
      reflexes  = _rand(base - 10);
      overall   = ((pace * 0.2 + shooting * 0.2 + passing * 0.2 + dribbling * 0.15 + defending * 0.1 + physical * 0.15)).round().clamp(35, 85);
    }
  }

  factory Player.fromJson(Map<String, dynamic> json) {
    return Player(
      id: json['id'] as String,
      name: json['name'] as String,
      isGoalkeeper: json['isGoalkeeper'] as bool? ?? false,
      imageUrl: json['imageUrl'] as String?,
      age: json['age'] as int?,
      practicesSport: json['practicesSport'] as bool?,
      sportTimesPerWeek: json['sportTimesPerWeek'] as int?,
      hasPlayedFootball: json['hasPlayedFootball'] as bool?,
      footballYearsAgo: json['footballYearsAgo'] as int?,
    );
  }

  String get positionLabel {
    if (isGoalkeeper) return 'POR';
    if (defending > shooting && defending > passing) return 'DIF';
    if (passing > shooting && passing > defending) return 'CEN';
    return 'ATT';
  }

  String get overallLabel {
    if (overall >= 75) return '🌟';
    if (overall >= 65) return '⭐';
    if (overall >= 55) return '🔵';
    return '⚪';
  }
}
