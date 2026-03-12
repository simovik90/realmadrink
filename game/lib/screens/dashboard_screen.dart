import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/game_provider.dart';
import '../models/league.dart';
import 'match_screen.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final game = context.watch<GameProvider>();
    final standings = game.getStandings();
    final userPos = standings.indexWhere((s) => s['isUser'] == true) + 1;
    final nextFixture = game.nextUserFixture;

    return Scaffold(
      backgroundColor: const Color(0xFF0d3b2e),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                children: [
                  const Text('🍺', style: TextStyle(fontSize: 32)),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'RealMadrink FC',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.5,
                        ),
                      ),
                      Text(
                        'Serie A 2024/25',
                        style: TextStyle(color: Colors.white.withValues(alpha: 0.6), fontSize: 12),
                      ),
                    ],
                  ),
                  const Spacer(),
                  // Badge posizione
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: _positionColor(userPos),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      '${userPos}°',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontSize: 16,
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 20),

              // Statistiche stagione
              _buildSeasonStats(game),

              const SizedBox(height: 20),

              // Prossima partita
              if (nextFixture != null) ...[
                _buildSectionTitle('PROSSIMA PARTITA'),
                const SizedBox(height: 8),
                _buildNextMatchCard(context, game, nextFixture),
                const SizedBox(height: 20),
              ],

              // Ultimo risultato
              if (game.lastMatchResult != null) ...[
                _buildSectionTitle('ULTIMO RISULTATO'),
                const SizedBox(height: 8),
                _buildLastResultCard(game.lastMatchResult!),
                const SizedBox(height: 20),
              ],

              // Top 5 classifica
              _buildSectionTitle('CLASSIFICA SERIE A'),
              const SizedBox(height: 8),
              _buildMiniStandings(standings, userPos),
            ],
          ),
        ),
      ),
    );
  }

  Color _positionColor(int pos) {
    if (pos <= 4) return const Color(0xFF1a6b4f);
    if (pos <= 7) return const Color(0xFF2563eb);
    if (pos >= 18) return const Color(0xFFdc2626);
    return const Color(0xFF6b7280);
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: TextStyle(
        color: Colors.white.withValues(alpha: 0.5),
        fontSize: 11,
        fontWeight: FontWeight.w700,
        letterSpacing: 1.5,
      ),
    );
  }

  Widget _buildSeasonStats(GameProvider game) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.07),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildStat('${game.userPoints}', 'Punti', const Color(0xFFf4a261)),
          _buildStatDivider(),
          _buildStat('${game.userWon}', 'Vittorie', Colors.green),
          _buildStatDivider(),
          _buildStat('${game.userDrawn}', 'Pareggi', Colors.amber),
          _buildStatDivider(),
          _buildStat('${game.userLost}', 'Sconfitte', Colors.red),
          _buildStatDivider(),
          _buildStat('${game.userGoalDifference > 0 ? '+' : ''}${game.userGoalDifference}', 'D. Reti',
            game.userGoalDifference >= 0 ? Colors.green : Colors.red),
        ],
      ),
    );
  }

  Widget _buildStat(String value, String label, Color color) {
    return Column(
      children: [
        Text(value, style: TextStyle(color: color, fontSize: 20, fontWeight: FontWeight.w900)),
        const SizedBox(height: 2),
        Text(label, style: TextStyle(color: Colors.white.withValues(alpha: 0.5), fontSize: 9, fontWeight: FontWeight.w600)),
      ],
    );
  }

  Widget _buildStatDivider() {
    return Container(width: 1, height: 30, color: Colors.white.withValues(alpha: 0.1));
  }

  Widget _buildNextMatchCard(BuildContext context, GameProvider game, Fixture fixture) {
    final opponentName = game.getOpponentName(fixture);
    final isHome = fixture.homeTeamIndex == -1;
    final opponent = game.leagueTeams.where((t) =>
      t.name == opponentName
    ).firstOrNull;

    return GestureDetector(
      onTap: () => Navigator.push(context, MaterialPageRoute(
        builder: (_) => const MatchScreen(),
      )),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF1a6b4f), Color(0xFF0d3b2e)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFF2da86a).withValues(alpha: 0.4)),
        ),
        child: Column(
          children: [
            Text(
              'Giornata ${fixture.round} · ${isHome ? "CASA" : "TRASFERTA"}',
              style: TextStyle(color: Colors.white.withValues(alpha: 0.6), fontSize: 11, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildTeamDisplay('🍺', 'RealMadrink FC', true),
                const Text('VS', style: TextStyle(color: Colors.white70, fontSize: 14, fontWeight: FontWeight.w900)),
                _buildTeamDisplay(opponent?.emoji ?? '⚽', opponentName, false),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFFff6b35),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Text(
                '▶ GIOCA',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 13),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTeamDisplay(String emoji, String name, bool isUser) {
    return Column(
      children: [
        Text(emoji, style: const TextStyle(fontSize: 28)),
        const SizedBox(height: 4),
        SizedBox(
          width: 100,
          child: Text(
            name,
            textAlign: TextAlign.center,
            maxLines: 2,
            style: TextStyle(
              color: isUser ? const Color(0xFFf4a261) : Colors.white,
              fontSize: 11,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildLastResultCard(MatchResult result) {
    final userGoals = result.userIsHome ? result.homeGoals : result.awayGoals;
    final oppGoals = result.userIsHome ? result.awayGoals : result.homeGoals;
    final Color resultColor = userGoals > oppGoals
        ? Colors.green
        : userGoals == oppGoals ? Colors.amber : Colors.red;
    final String resultLabel = userGoals > oppGoals ? 'VITTORIA' : userGoals == oppGoals ? 'PAREGGIO' : 'SCONFITTA';
    final opponentName = result.userIsHome ? result.awayTeam : result.homeTeam;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: resultColor.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: resultColor.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(resultLabel, style: TextStyle(color: resultColor, fontWeight: FontWeight.w900, fontSize: 13)),
          Row(
            children: [
              Text('RealMadrink', style: const TextStyle(color: Colors.white70, fontSize: 12)),
              const SizedBox(width: 8),
              Text(
                '$userGoals - $oppGoals',
                style: TextStyle(color: resultColor, fontSize: 20, fontWeight: FontWeight.w900),
              ),
              const SizedBox(width: 8),
              Text(opponentName, style: const TextStyle(color: Colors.white70, fontSize: 12)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMiniStandings(List<Map<String, dynamic>> standings, int userPos) {
    final showAll = standings.length <= 8;
    final List<Map<String, dynamic>> toShow;

    if (showAll) {
      toShow = standings;
    } else {
      // Mostra prime 3, ultime 2 e intorno all'utente
      final Set<int> indices = {0, 1, 2, standings.length - 2, standings.length - 1};
      final userIdx = userPos - 1;
      for (int i = max(0, userIdx - 1); i <= min(standings.length - 1, userIdx + 1); i++) {
        indices.add(i);
      }
      final sortedIndices = indices.toList()..sort();
      toShow = sortedIndices.map((i) => {...standings[i], '_idx': i}).toList();
    }

    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Column(
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(
              children: [
                const SizedBox(width: 24),
                const SizedBox(width: 8),
                const Expanded(child: Text('Squadra', style: TextStyle(color: Colors.white38, fontSize: 10, fontWeight: FontWeight.w600))),
                _buildStandingHeaderCell('G'),
                _buildStandingHeaderCell('V'),
                _buildStandingHeaderCell('P'),
                _buildStandingHeaderCell('S'),
                _buildStandingHeaderCell('DR'),
                _buildStandingHeaderCell('Pt'),
              ],
            ),
          ),
          const Divider(color: Colors.white12, height: 1),
          ...toShow.asMap().entries.map((entry) {
            final idx = entry.value.containsKey('_idx') ? (entry.value['_idx'] as int) : entry.key;
            return _buildStandingRow(entry.value, idx + 1, idx + 1 == userPos);
          }),
        ],
      ),
    );
  }

  Widget _buildStandingHeaderCell(String text) {
    return SizedBox(
      width: 28,
      child: Text(text, textAlign: TextAlign.center, style: const TextStyle(color: Colors.white38, fontSize: 10, fontWeight: FontWeight.w600)),
    );
  }

  Widget _buildStandingRow(Map<String, dynamic> team, int pos, bool isUser) {
    return Container(
      color: isUser ? const Color(0xFF1a6b4f).withValues(alpha: 0.3) : Colors.transparent,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
      child: Row(
        children: [
          SizedBox(
            width: 24,
            child: Text(
              '$pos',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: pos <= 4 ? const Color(0xFF2da86a) : pos >= 18 ? Colors.red : Colors.white60,
                fontSize: 11,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          const SizedBox(width: 4),
          Text(team['emoji'] as String, style: const TextStyle(fontSize: 14)),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              team['name'] as String,
              style: TextStyle(
                color: isUser ? const Color(0xFFf4a261) : Colors.white,
                fontSize: 12,
                fontWeight: isUser ? FontWeight.w700 : FontWeight.w500,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          _buildStandingCell('${team['played']}', Colors.white60),
          _buildStandingCell('${team['won']}', Colors.green.shade300),
          _buildStandingCell('${team['drawn']}', Colors.amber.shade300),
          _buildStandingCell('${team['lost']}', Colors.red.shade300),
          _buildStandingCell(
            '${(team['gd'] as int) > 0 ? '+' : ''}${team['gd']}',
            (team['gd'] as int) >= 0 ? Colors.green.shade300 : Colors.red.shade300,
          ),
          _buildStandingCell('${team['points']}', Colors.white, bold: true),
        ],
      ),
    );
  }

  Widget _buildStandingCell(String text, Color color, {bool bold = false}) {
    return SizedBox(
      width: 28,
      child: Text(
        text,
        textAlign: TextAlign.center,
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: bold ? FontWeight.w900 : FontWeight.w500,
        ),
      ),
    );
  }
}

int max(int a, int b) => a > b ? a : b;
int min(int a, int b) => a < b ? a : b;
