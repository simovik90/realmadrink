import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/game_provider.dart';
import '../models/league.dart';

class MatchScreen extends StatefulWidget {
  const MatchScreen({super.key});

  @override
  State<MatchScreen> createState() => _MatchScreenState();
}

class _MatchScreenState extends State<MatchScreen> with TickerProviderStateMixin {
  bool _matchPlayed = false;
  MatchResult? _result;
  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(vsync: this, duration: const Duration(milliseconds: 400));
    _fadeAnimation = CurvedAnimation(parent: _fadeController, curve: Curves.easeIn);
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final game = context.watch<GameProvider>();
    final nextFixture = game.nextUserFixture;

    if (nextFixture == null) {
      return Scaffold(
        backgroundColor: const Color(0xFF0d3b2e),
        appBar: AppBar(
          backgroundColor: const Color(0xFF0d3b2e),
          title: const Text('Partita', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900)),
          iconTheme: const IconThemeData(color: Colors.white),
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('🏆', style: TextStyle(fontSize: 60)),
              const SizedBox(height: 16),
              const Text(
                'Stagione completata!',
                style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 8),
              Text(
                'Hai giocato tutte le ${game.totalRounds} giornate',
                style: TextStyle(color: Colors.white.withValues(alpha: 0.6), fontSize: 14),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFff6b35),
                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: () => game.resetSeason(),
                child: const Text('NUOVA STAGIONE', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900)),
              ),
            ],
          ),
        ),
      );
    }

    final opponentName = game.getOpponentName(nextFixture);
    final isHome = nextFixture.homeTeamIndex == -1;
    final opponent = game.leagueTeams.where((t) => t.name == opponentName).firstOrNull;

    return Scaffold(
      backgroundColor: const Color(0xFF0d3b2e),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0d3b2e),
        title: Text(
          'Giornata ${nextFixture.round}',
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900),
        ),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: SingleChildScrollView(
        controller: _scrollController,
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Card pre-partita
            if (!_matchPlayed) ...[
              _buildPreMatchCard(context, game, opponentName, isHome, opponent),
              const SizedBox(height: 16),
              _buildFormationPreview(game),
              const SizedBox(height: 16),
              _buildWarnings(game),
              const SizedBox(height: 20),
              _buildPlayButton(context, game),
            ],

            // Risultato partita
            if (_matchPlayed && _result != null) ...[
              _buildResultHeader(_result!, game),
              const SizedBox(height: 16),
              _buildMatchCommentary(_result!),
              const SizedBox(height: 20),
              _buildPostMatchButtons(context, game),
            ],

            // Loading
            if (game.isSimulating)
              const Padding(
                padding: EdgeInsets.all(40),
                child: Column(
                  children: [
                    Text('⚽', style: TextStyle(fontSize: 48)),
                    SizedBox(height: 16),
                    Text(
                      'Partita in corso...',
                      style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700),
                    ),
                    SizedBox(height: 16),
                    CircularProgressIndicator(color: Color(0xFF2da86a)),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildPreMatchCard(BuildContext context, GameProvider game, String opponentName, bool isHome, SerieATeam? opponent) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1a6b4f), Color(0xFF0a2d20)],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFF2da86a).withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          Text(
            isHome ? '🏟️ CASA' : '✈️ TRASFERTA',
            style: TextStyle(
              color: isHome ? const Color(0xFF2da86a) : const Color(0xFFf4a261),
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 2,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              Expanded(child: _buildTeamInfo('🍺', 'RealMadrink FC', game.userPoints, true)),
              Column(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Text(
                      'VS',
                      style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900),
                    ),
                  ),
                ],
              ),
              Expanded(child: _buildTeamInfo(opponent?.emoji ?? '⚽', opponentName, opponent?.points ?? 0, false)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTeamInfo(String emoji, String name, int points, bool isUser) {
    return Column(
      children: [
        Text(emoji, style: const TextStyle(fontSize: 36)),
        const SizedBox(height: 6),
        Text(
          name,
          textAlign: TextAlign.center,
          maxLines: 2,
          style: TextStyle(
            color: isUser ? const Color(0xFFf4a261) : Colors.white,
            fontSize: 12,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          '$points pt',
          style: TextStyle(color: Colors.white.withValues(alpha: 0.5), fontSize: 11),
        ),
      ],
    );
  }

  Widget _buildFormationPreview(GameProvider game) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'FORMAZIONE ${game.formation.label}',
                style: const TextStyle(color: Colors.white60, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1),
              ),
              Text(
                '${game.starters.length}/7',
                style: TextStyle(
                  color: game.starters.length == 7 ? const Color(0xFF2da86a) : Colors.orange,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          // Campo visivo
          _buildPitchView(game),
        ],
      ),
    );
  }

  Widget _buildPitchView(GameProvider game) {
    final goalkeepers = game.starters.where((p) => p.isGoalkeeper).toList();
    final outfield = game.starters.where((p) => !p.isGoalkeeper).toList();

    return Container(
      height: 160,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            const Color(0xFF1a6b4f).withValues(alpha: 0.4),
            const Color(0xFF228b5e).withValues(alpha: 0.3),
          ],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
      ),
      child: Stack(
        children: [
          // Righe del campo
          Center(child: Container(height: 1, color: Colors.white.withValues(alpha: 0.1))),
          // Cerchio centrocampo
          Center(
            child: Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
              ),
            ),
          ),
          // Posizioni giocatori
          _buildPlayerPositions(goalkeepers, outfield, game.formation),
        ],
      ),
    );
  }

  Widget _buildPlayerPositions(List players, List outfield, Formation formation) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final w = constraints.maxWidth;
        final h = constraints.maxHeight;

        final List<Offset> positions = [];

        // Portiere (bottom)
        positions.add(Offset(w / 2, h * 0.88));

        // Difensori
        final defs = formation.defenders;
        for (int i = 0; i < defs; i++) {
          positions.add(Offset(w * (i + 1) / (defs + 1), h * 0.68));
        }

        // Centrocampisti
        final mids = formation.midfielders;
        for (int i = 0; i < mids; i++) {
          positions.add(Offset(w * (i + 1) / (mids + 1), h * 0.42));
        }

        // Attaccanti
        final fwds = formation.forwards;
        for (int i = 0; i < fwds; i++) {
          positions.add(Offset(w * (i + 1) / (fwds + 1), h * 0.15));
        }

        final allPlayers = [...players, ...outfield];

        return Stack(
          children: List.generate(
            positions.length.clamp(0, allPlayers.length),
            (i) {
              final p = allPlayers[i];
              final pos = positions[i];
              return Positioned(
                left: pos.dx - 18,
                top: pos.dy - 18,
                child: _buildPlayerDot(p.name, p.isGoalkeeper),
              );
            },
          ),
        );
      },
    );
  }

  Widget _buildPlayerDot(String name, bool isGk) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            color: isGk ? const Color(0xFFf4a261) : const Color(0xFF2da86a),
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white, width: 1.5),
          ),
          child: Center(
            child: Text(
              name[0].toUpperCase(),
              style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w900),
            ),
          ),
        ),
        Text(
          name.split(' ').last,
          style: const TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.w600),
        ),
      ],
    );
  }

  Widget _buildWarnings(GameProvider game) {
    final List<String> warnings = [];
    if (!game.hasGoalkeeper) warnings.add('⚠️ Nessun portiere! Aggiungi un portiere dalla Rosa.');
    if (game.starters.length < 7) warnings.add('⚠️ Solo ${game.starters.length}/7 giocatori in campo!');

    if (warnings.isEmpty) return const SizedBox.shrink();

    return Column(
      children: warnings.map((w) => Container(
        margin: const EdgeInsets.only(bottom: 6),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.orange.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.orange.withValues(alpha: 0.3)),
        ),
        child: Row(
          children: [
            Text(w, style: const TextStyle(color: Colors.orange, fontSize: 12)),
          ],
        ),
      )).toList(),
    );
  }

  Widget _buildPlayButton(BuildContext context, GameProvider game) {
    final canPlay = !game.isSimulating;

    return GestureDetector(
      onTap: canPlay ? () => _playMatch(context, game) : null,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 18),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: canPlay
                ? [const Color(0xFFff6b35), const Color(0xFFe85d25)]
                : [Colors.grey.shade700, Colors.grey.shade800],
          ),
          borderRadius: BorderRadius.circular(16),
          boxShadow: canPlay
              ? [BoxShadow(color: const Color(0xFFff6b35).withValues(alpha: 0.4), blurRadius: 12, offset: const Offset(0, 4))]
              : [],
        ),
        child: const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('⚽', style: TextStyle(fontSize: 22)),
            SizedBox(width: 10),
            Text(
              'FISCHIA L\'ARBITRO!',
              style: TextStyle(
                color: Colors.white,
                fontSize: 17,
                fontWeight: FontWeight.w900,
                letterSpacing: 1,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _playMatch(BuildContext context, GameProvider game) async {
    final result = await game.simulateNextMatch();
    if (mounted) {
      setState(() {
        _matchPlayed = true;
        _result = result;
      });
      _fadeController.forward();
      // Scrolla in cima per vedere il risultato
      Future.delayed(const Duration(milliseconds: 100), () {
        _scrollController.animateTo(0, duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
      });
    }
  }

  Widget _buildResultHeader(MatchResult result, GameProvider game) {
    final userGoals = result.userIsHome ? result.homeGoals : result.awayGoals;
    final oppGoals = result.userIsHome ? result.awayGoals : result.homeGoals;
    final Color resultColor = userGoals > oppGoals
        ? const Color(0xFF2da86a)
        : userGoals == oppGoals ? Colors.amber : Colors.red;
    final String resultLabel = userGoals > oppGoals
        ? '🎉 VITTORIA!'
        : userGoals == oppGoals ? '🤝 PAREGGIO' : '😞 SCONFITTA';

    return FadeTransition(
      opacity: _fadeAnimation,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [resultColor.withValues(alpha: 0.3), resultColor.withValues(alpha: 0.1)],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: resultColor.withValues(alpha: 0.5)),
        ),
        child: Column(
          children: [
            Text(resultLabel, style: TextStyle(color: resultColor, fontSize: 20, fontWeight: FontWeight.w900)),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                Expanded(
                  child: Text(
                    result.homeTeam,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: result.userIsHome ? const Color(0xFFf4a261) : Colors.white70,
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                  decoration: BoxDecoration(
                    color: resultColor.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '${result.homeGoals} - ${result.awayGoals}',
                    style: TextStyle(
                      color: resultColor,
                      fontSize: 28,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
                Expanded(
                  child: Text(
                    result.awayTeam,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: !result.userIsHome ? const Color(0xFFf4a261) : Colors.white70,
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              'Punti: ${game.userPoints} | ${game.userPlayed} partite giocate',
              style: TextStyle(color: Colors.white.withValues(alpha: 0.5), fontSize: 11),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMatchCommentary(MatchResult result) {
    if (result.events.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(14),
        ),
        child: const Text(
          'Partita senza eventi degni di nota.',
          style: TextStyle(color: Colors.white60, fontSize: 13),
          textAlign: TextAlign.center,
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 12, 14, 8),
              child: Text(
                'CRONACA',
                style: TextStyle(color: Colors.white.withValues(alpha: 0.5), fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.5),
              ),
            ),
            const Divider(color: Colors.white12, height: 1),
            ...result.events.map((event) => _buildEventRow(event)),
          ],
        ),
    );
  }

  Widget _buildEventRow(MatchEvent event) {
    Color bgColor = Colors.transparent;
    if (event.type == 'goal') {
      bgColor = event.isHomeTeam
          ? const Color(0xFF2da86a).withValues(alpha: 0.1)
          : Colors.red.withValues(alpha: 0.08);
    }

    return Container(
      color: bgColor,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      child: Text(
        event.description,
        style: TextStyle(
          color: event.type == 'goal'
              ? (event.isHomeTeam ? const Color(0xFF2da86a) : Colors.red.shade300)
              : Colors.white70,
          fontSize: 13,
          fontWeight: event.type == 'goal' ? FontWeight.w700 : FontWeight.w400,
        ),
      ),
    );
  }

  Widget _buildPostMatchButtons(BuildContext context, GameProvider game) {
    return Column(
      children: [
        if (game.nextUserFixture != null) ...[
          GestureDetector(
            onTap: () {
              setState(() {
                _matchPlayed = false;
                _result = null;
              });
              _fadeController.reset();
            },
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF1a6b4f), Color(0xFF228b5e)],
                ),
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Text(
                '▶ PROSSIMA PARTITA',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 15, letterSpacing: 0.5),
              ),
            ),
          ),
          const SizedBox(height: 10),
        ],
        GestureDetector(
          onTap: () => Navigator.pop(context),
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 14),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
            ),
            child: const Text(
              'TORNA ALLA DASHBOARD',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white70, fontWeight: FontWeight.w700, fontSize: 13),
            ),
          ),
        ),
      ],
    );
  }
}
