import 'dart:convert';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/player.dart';
import '../models/league.dart';

enum GameState { loading, teamSelection, playing }
enum Formation { f231, f321, f222, f141 }

extension FormationLabel on Formation {
  String get label {
    switch (this) {
      case Formation.f231: return '2-3-1';
      case Formation.f321: return '3-2-1';
      case Formation.f222: return '2-2-2';
      case Formation.f141: return '1-4-1';
    }
  }
  int get defenders {
    switch (this) {
      case Formation.f231: return 2;
      case Formation.f321: return 3;
      case Formation.f222: return 2;
      case Formation.f141: return 1;
    }
  }
  int get midfielders {
    switch (this) {
      case Formation.f231: return 3;
      case Formation.f321: return 2;
      case Formation.f222: return 2;
      case Formation.f141: return 4;
    }
  }
  int get forwards {
    switch (this) {
      case Formation.f231: return 1;
      case Formation.f321: return 1;
      case Formation.f222: return 2;
      case Formation.f141: return 1;
    }
  }
}

class GameProvider extends ChangeNotifier {
  GameState _state = GameState.loading;
  List<Player> _allPlayers = [];
  List<Player> _starters = []; // max 7: 1 POR + 6 outfield
  List<Player> _bench = [];
  Formation _formation = Formation.f231;
  List<SerieATeam> _leagueTeams = [];
  List<Fixture> _fixtures = [];
  int _currentRound = 0;
  int _budget = 50000; // budget fittizio in migliaia €
  String? _errorMessage;
  bool _isSimulating = false;
  List<MatchEvent> _lastMatchEvents = [];
  MatchResult? _lastMatchResult;
  int _userGoalsFor = 0;
  int _userGoalsAgainst = 0;
  int _userWon = 0;
  int _userDrawn = 0;
  int _userLost = 0;
  int _userPlayed = 0;

  // Getters
  GameState get state => _state;
  List<Player> get allPlayers => _allPlayers;
  List<Player> get starters => _starters;
  List<Player> get bench => _bench;
  Formation get formation => _formation;
  List<SerieATeam> get leagueTeams => _leagueTeams;
  List<Fixture> get fixtures => _fixtures;
  int get currentRound => _currentRound;
  int get budget => _budget;
  String? get errorMessage => _errorMessage;
  bool get isSimulating => _isSimulating;
  List<MatchEvent> get lastMatchEvents => _lastMatchEvents;
  MatchResult? get lastMatchResult => _lastMatchResult;
  int get userPoints => _userWon * 3 + _userDrawn;
  int get userPlayed => _userPlayed;
  int get userWon => _userWon;
  int get userDrawn => _userDrawn;
  int get userLost => _userLost;
  int get userGoalDifference => _userGoalsFor - _userGoalsAgainst;
  int get userGoalsFor => _userGoalsFor;

  bool get hasGoalkeeper => _starters.any((p) => p.isGoalkeeper);
  int get totalRounds => _fixtures.isNotEmpty
      ? _fixtures.map((f) => f.round).reduce(max)
      : 0;

  Future<void> initialize(String apiBaseUrl) async {
    _state = GameState.loading;
    _errorMessage = null;
    notifyListeners();

    try {
      await _loadPlayers(apiBaseUrl);
      await _loadSavedGame();
      if (_starters.isEmpty && _allPlayers.isNotEmpty) {
        _autoSelectStarters();
      }
      _initLeague();
      _state = GameState.playing;
    } catch (e) {
      _errorMessage = 'Errore caricamento: $e';
      _state = GameState.playing;
    }
    notifyListeners();
  }

  Future<void> _loadPlayers(String apiBaseUrl) async {
    try {
      final uri = Uri.parse('$apiBaseUrl/api/players');
      final response = await http.get(uri).timeout(const Duration(seconds: 10));
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        _allPlayers = data.map((j) => Player.fromJson(j as Map<String, dynamic>)).toList();
        // Salva localmente
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('rm_players_cache', response.body);
      }
    } catch (_) {
      // Prova dalla cache
      final prefs = await SharedPreferences.getInstance();
      final cached = prefs.getString('rm_players_cache');
      if (cached != null) {
        final List<dynamic> data = json.decode(cached);
        _allPlayers = data.map((j) => Player.fromJson(j as Map<String, dynamic>)).toList();
      }
    }
  }

  Future<void> _loadSavedGame() async {
    final prefs = await SharedPreferences.getInstance();
    final starterIds = prefs.getStringList('rm_starters') ?? [];
    final formationIdx = prefs.getInt('rm_formation') ?? 0;
    _budget = prefs.getInt('rm_budget') ?? 50000;
    _currentRound = prefs.getInt('rm_round') ?? 0;
    _userWon = prefs.getInt('rm_won') ?? 0;
    _userDrawn = prefs.getInt('rm_drawn') ?? 0;
    _userLost = prefs.getInt('rm_lost') ?? 0;
    _userPlayed = prefs.getInt('rm_played') ?? 0;
    _userGoalsFor = prefs.getInt('rm_gf') ?? 0;
    _userGoalsAgainst = prefs.getInt('rm_ga') ?? 0;
    _formation = Formation.values[formationIdx.clamp(0, Formation.values.length - 1)];

    if (starterIds.isNotEmpty) {
      _starters = starterIds
          .map((id) => _allPlayers.where((p) => p.id == id).firstOrNull)
          .whereType<Player>()
          .toList();
      _bench = _allPlayers.where((p) => !_starters.contains(p)).toList();
    }
  }

  Future<void> _saveGame() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList('rm_starters', _starters.map((p) => p.id).toList());
    await prefs.setInt('rm_formation', _formation.index);
    await prefs.setInt('rm_budget', _budget);
    await prefs.setInt('rm_round', _currentRound);
    await prefs.setInt('rm_won', _userWon);
    await prefs.setInt('rm_drawn', _userDrawn);
    await prefs.setInt('rm_lost', _userLost);
    await prefs.setInt('rm_played', _userPlayed);
    await prefs.setInt('rm_gf', _userGoalsFor);
    await prefs.setInt('rm_ga', _userGoalsAgainst);
  }

  void _autoSelectStarters() {
    final goalkeepers = _allPlayers.where((p) => p.isGoalkeeper).toList();
    final outfield = _allPlayers.where((p) => !p.isGoalkeeper).toList();

    // Ordina per overall decrescente
    outfield.sort((a, b) => b.overall.compareTo(a.overall));

    _starters = [];
    if (goalkeepers.isNotEmpty) {
      _starters.add(goalkeepers.first);
    }
    final needed = 7 - _starters.length;
    _starters.addAll(outfield.take(needed));
    _bench = _allPlayers.where((p) => !_starters.contains(p)).toList();
  }

  void _initLeague() {
    _leagueTeams = serieATeams.map((t) {
      final copy = SerieATeam(
        name: t.name,
        shortName: t.shortName,
        emoji: t.emoji,
        strength: t.strength,
      );
      return copy;
    }).toList();

    // Genera il calendario se non già esistente
    if (_fixtures.isEmpty) {
      _generateFixtures();
    }
  }

  void _generateFixtures() {
    _fixtures = [];
    final rng = Random(42); // seed fisso per calendario riproducibile

    // Indici squadre: -1 = RealMadrink, 0-19 = Serie A teams
    final allTeamIndices = [-1, ...List.generate(20, (i) => i)];
    final int n = allTeamIndices.length; // 21 squadre — numero dispari, una riposa
    int round = 1;

    // Algoritmo round-robin con squadre dispari (una riposa ogni turno)
    // Genera 20 giornate di andata + 20 ritorno = 40 giornate
    List<int> teams = List.from(allTeamIndices);

    for (int leg = 0; leg < 2; leg++) {
      List<int> t = List.from(teams);
      for (int r = 0; r < t.length; r++) {
        final List<(int, int)> pairs = [];
        // Squadra che riposa: t[0] a ogni turno dispari, ruotiamo
        final int resting = t[r % t.length];
        final List<int> playing = t.where((x) => x != resting).toList();
        if (rng.nextBool()) playing.shuffle(rng);

        for (int i = 0; i < playing.length ~/ 2; i++) {
          int home = playing[i];
          int away = playing[playing.length - 1 - i];
          if (leg == 1) {
            final tmp = home; home = away; away = tmp; // ritorno
          }
          pairs.add((home, away));
        }

        for (final pair in pairs) {
          _fixtures.add(Fixture(
            round: round,
            homeTeamIndex: pair.$1,
            awayTeamIndex: pair.$2,
          ));
        }
        round++;
      }
    }
  }

  void setFormation(Formation f) {
    _formation = f;
    _saveGame();
    notifyListeners();
  }

  void toggleStarter(Player player) {
    if (_starters.contains(player)) {
      _starters.remove(player);
      _bench.add(player);
    } else {
      if (_starters.length < 7) {
        _bench.remove(player);
        _starters.add(player);
      }
    }
    _saveGame();
    notifyListeners();
  }

  void swapPlayers(Player starter, Player benchPlayer) {
    final si = _starters.indexOf(starter);
    final bi = _bench.indexOf(benchPlayer);
    if (si >= 0 && bi >= 0) {
      _starters[si] = benchPlayer;
      _bench[bi] = starter;
    }
    _saveGame();
    notifyListeners();
  }

  // --- SIMULAZIONE PARTITA ---
  Future<MatchResult> simulateNextMatch() async {
    _isSimulating = true;
    _lastMatchEvents = [];
    notifyListeners();

    await Future.delayed(const Duration(milliseconds: 500));

    final nextFixtures = _fixtures.where((f) =>
      f.round == _currentRound + 1 && f.result == null
    ).toList();

    MatchResult? userResult;

    final rng = Random();

    for (final fixture in nextFixtures) {
      if (fixture.isUserMatch) {
        userResult = await _simulateUserMatch(fixture, rng);
        fixture.result = userResult;
      } else {
        fixture.result = _simulateAIMatch(fixture, rng);
        // Aggiorna statistiche squadre AI
        final home = _leagueTeams[fixture.homeTeamIndex];
        final away = _leagueTeams[fixture.awayTeamIndex];
        home.recordResult(fixture.result!.homeGoals, fixture.result!.awayGoals);
        away.recordResult(fixture.result!.awayGoals, fixture.result!.homeGoals);
      }
    }

    _currentRound++;
    _isSimulating = false;
    _lastMatchResult = userResult;

    await _saveGame();
    notifyListeners();

    return userResult ?? _fixtures
        .where((f) => f.round == _currentRound && f.result != null)
        .first.result!;
  }

  Future<MatchResult> _simulateUserMatch(Fixture fixture, Random rng) async {
    final bool userIsHome = fixture.homeTeamIndex == -1;
    final int opponentIdx = userIsHome ? fixture.awayTeamIndex : fixture.homeTeamIndex;
    final SerieATeam opponent = _leagueTeams[opponentIdx];

    // Calcola forza RealMadrink
    double userStrength = _calculateUserStrength();
    double oppStrength = opponent.strength.toDouble();

    // Fattore campo: +5% casa
    if (userIsHome) userStrength *= 1.05;
    else oppStrength *= 1.05;

    // Simula eventi minuto per minuto
    final events = <MatchEvent>[];
    int userGoals = 0;
    int oppGoals = 0;

    // Numero di azioni totali (calcetto 7vs7 = meno azioni)
    final int actions = 20 + rng.nextInt(15);

    for (int i = 0; i < actions; i++) {
      final int minute = 1 + rng.nextInt(80);
      final double totalStr = userStrength + oppStrength;
      final bool isUserAction = rng.nextDouble() < (userStrength / totalStr);

      final event = _generateEvent(
        minute: minute,
        isUserAction: isUserAction,
        userStrength: userStrength,
        oppStrength: oppStrength,
        rng: rng,
        players: _starters,
        opponentName: opponent.name,
      );

      if (event != null) {
        events.add(event);
        if (event.type == 'goal') {
          if (event.isHomeTeam == userIsHome) userGoals++;
          else oppGoals++;
        }
      }
    }

    // Ordina eventi per minuto
    events.sort((a, b) => a.minute.compareTo(b.minute));

    final homeGoals = userIsHome ? userGoals : oppGoals;
    final awayGoals = userIsHome ? oppGoals : userGoals;

    // Aggiorna statistiche utente
    _userPlayed++;
    _userGoalsFor += userGoals;
    _userGoalsAgainst += oppGoals;
    if (userGoals > oppGoals) _userWon++;
    else if (userGoals == oppGoals) _userDrawn++;
    else _userLost++;

    // Aggiorna statistiche avversario
    opponent.recordResult(
      userIsHome ? oppGoals : userGoals,
      userIsHome ? userGoals : oppGoals,
    );

    _lastMatchEvents = events;

    return MatchResult(
      homeTeam: userIsHome ? 'RealMadrink FC' : opponent.name,
      awayTeam: userIsHome ? opponent.name : 'RealMadrink FC',
      homeGoals: homeGoals,
      awayGoals: awayGoals,
      events: events,
      isUserTeam: true,
      userIsHome: userIsHome,
    );
  }

  MatchEvent? _generateEvent({
    required int minute,
    required bool isUserAction,
    required double userStrength,
    required double oppStrength,
    required Random rng,
    required List<Player> players,
    required String opponentName,
  }) {
    final double r = rng.nextDouble();

    if (r < 0.18) {
      // Tiro in porta
      final double shooterStr = isUserAction ? userStrength : oppStrength;
      final double goalkeeperStr = isUserAction ? oppStrength : userStrength;
      final double goalProbability = (shooterStr / (shooterStr + goalkeeperStr * 1.2)).clamp(0.15, 0.65);

      if (rng.nextDouble() < goalProbability) {
        // GOL!
        String scorer;
        if (isUserAction) {
          final outfield = players.where((p) => !p.isGoalkeeper).toList();
          if (outfield.isNotEmpty) {
            outfield.sort((a, b) => b.shooting.compareTo(a.shooting));
            // Probabilità pesata per tiro
            final weights = outfield.map((p) => p.shooting.toDouble()).toList();
            final total = weights.reduce((a, b) => a + b);
            double pick = rng.nextDouble() * total;
            scorer = outfield.first.name;
            for (int i = 0; i < outfield.length; i++) {
              pick -= weights[i];
              if (pick <= 0) { scorer = outfield[i].name; break; }
            }
          } else {
            scorer = 'RealMadrink';
          }
          return MatchEvent(
            minute: minute,
            type: 'goal',
            description: "⚽ $minute' — GOL! $scorer segna per RealMadrink FC!",
            isHomeTeam: true,
          );
        } else {
          return MatchEvent(
            minute: minute,
            type: 'goal',
            description: "⚽ $minute' — GOL! $opponentName segna!",
            isHomeTeam: false,
          );
        }
      } else {
        // Parata o tiro fuori
        if (rng.nextBool()) {
          if (isUserAction) {
            return MatchEvent(
              minute: minute,
              type: 'save',
              description: "🧤 $minute' — Parata del portiere avversario!",
              isHomeTeam: false,
            );
          } else {
            final gk = players.where((p) => p.isGoalkeeper).firstOrNull;
            final gkName = gk?.name ?? 'Il portiere';
            return MatchEvent(
              minute: minute,
              type: 'save',
              description: "🧤 $minute' — Grande parata di $gkName!",
              isHomeTeam: true,
            );
          }
        } else {
          return MatchEvent(
            minute: minute,
            type: 'miss',
            description: isUserAction
                ? "😬 $minute' — Tiro fuori! Che occasione sprecata!"
                : "😮‍💨 $minute' — $opponentName spreca una grande occasione!",
            isHomeTeam: isUserAction,
          );
        }
      }
    } else if (r < 0.22) {
      return MatchEvent(
        minute: minute,
        type: 'foul',
        description: isUserAction
            ? "🟡 $minute' — Fallo di $opponentName. Punizione per noi!"
            : "🟡 $minute' — Fallo nostro. Punizione per $opponentName.",
        isHomeTeam: isUserAction,
      );
    }
    return null;
  }

  double _calculateUserStrength() {
    if (_starters.isEmpty) return 50.0;
    double total = _starters.map((p) => p.overall.toDouble()).reduce((a, b) => a + b);
    double avg = total / _starters.length;
    // Penalità se manca il portiere
    if (!hasGoalkeeper) avg *= 0.85;
    // Penalità se meno di 7
    if (_starters.length < 7) avg *= (0.7 + _starters.length * 0.04);
    return avg;
  }

  MatchResult _simulateAIMatch(Fixture fixture, Random rng) {
    final home = _leagueTeams[fixture.homeTeamIndex];
    final away = _leagueTeams[fixture.awayTeamIndex];

    double homeStr = home.strength * 1.05;
    double awayStr = away.strength.toDouble();
    final double total = homeStr + awayStr;

    int hg = 0, ag = 0;
    for (int i = 0; i < 14; i++) {
      if (rng.nextDouble() < 0.18) {
        if (rng.nextDouble() < homeStr / total) hg++;
        else ag++;
      }
    }

    return MatchResult(
      homeTeam: home.name,
      awayTeam: away.name,
      homeGoals: hg,
      awayGoals: ag,
      events: [],
      isUserTeam: false,
      userIsHome: false,
    );
  }

  // --- CLASSIFICA ---
  List<Map<String, dynamic>> getStandings() {
    final List<Map<String, dynamic>> table = [];

    // RealMadrink
    table.add({
      'name': 'RealMadrink FC',
      'shortName': 'RMD',
      'emoji': '🍺',
      'played': _userPlayed,
      'won': _userWon,
      'drawn': _userDrawn,
      'lost': _userLost,
      'gf': _userGoalsFor,
      'ga': _userGoalsAgainst,
      'gd': _userGoalsFor - _userGoalsAgainst,
      'points': _userWon * 3 + _userDrawn,
      'isUser': true,
    });

    for (final team in _leagueTeams) {
      table.add({
        'name': team.name,
        'shortName': team.shortName,
        'emoji': team.emoji,
        'played': team.played,
        'won': team.won,
        'drawn': team.drawn,
        'lost': team.lost,
        'gf': team.goalsFor,
        'ga': team.goalsAgainst,
        'gd': team.goalDifference,
        'points': team.points,
        'isUser': false,
      });
    }

    table.sort((a, b) {
      final int ptsDiff = (b['points'] as int) - (a['points'] as int);
      if (ptsDiff != 0) return ptsDiff;
      final int gdDiff = (b['gd'] as int) - (a['gd'] as int);
      if (gdDiff != 0) return gdDiff;
      return (b['gf'] as int) - (a['gf'] as int);
    });

    return table;
  }

  Fixture? get nextUserFixture {
    return _fixtures.where((f) =>
      f.isUserMatch && f.result == null
    ).firstOrNull;
  }

  String getOpponentName(Fixture fixture) {
    if (fixture.homeTeamIndex == -1) {
      return _leagueTeams[fixture.awayTeamIndex].name;
    }
    return _leagueTeams[fixture.homeTeamIndex].name;
  }

  bool get userIsHomeNextMatch {
    final f = nextUserFixture;
    if (f == null) return true;
    return f.homeTeamIndex == -1;
  }

  Future<void> refreshPlayers(String apiBaseUrl) async {
    await _loadPlayers(apiBaseUrl);
    // Mantieni i titolari esistenti, aggiungi nuovi in panchina
    final existingIds = {..._starters.map((p) => p.id), ..._bench.map((p) => p.id)};
    final newPlayers = _allPlayers.where((p) => !existingIds.contains(p.id)).toList();
    _bench.addAll(newPlayers);
    notifyListeners();
  }

  Future<void> resetSeason() async {
    _currentRound = 0;
    _userWon = 0;
    _userDrawn = 0;
    _userLost = 0;
    _userPlayed = 0;
    _userGoalsFor = 0;
    _userGoalsAgainst = 0;
    _lastMatchResult = null;
    _lastMatchEvents = [];
    _fixtures = [];
    for (final t in _leagueTeams) t.reset();
    _generateFixtures();
    await _saveGame();
    notifyListeners();
  }
}
