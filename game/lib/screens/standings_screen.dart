import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/game_provider.dart';

class StandingsScreen extends StatelessWidget {
  const StandingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final game = context.watch<GameProvider>();
    final standings = game.getStandings();

    return Scaffold(
      backgroundColor: const Color(0xFF0d3b2e),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0d3b2e),
        title: const Text('Classifica Serie A', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900)),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: Column(
        children: [
          // Legenda
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                _buildLegendDot(const Color(0xFF2da86a), 'Champions League'),
                const SizedBox(width: 12),
                _buildLegendDot(Colors.blue, 'Europa League'),
                const SizedBox(width: 12),
                _buildLegendDot(Colors.red, 'Retrocessione'),
              ],
            ),
          ),
          // Header tabella
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: Colors.white.withValues(alpha: 0.05),
            child: Row(
              children: [
                const SizedBox(width: 28),
                const SizedBox(width: 8),
                const Expanded(child: Text('Squadra', style: TextStyle(color: Colors.white38, fontSize: 10, fontWeight: FontWeight.w700))),
                _headerCell('G'),
                _headerCell('V'),
                _headerCell('P'),
                _headerCell('S'),
                _headerCell('GF'),
                _headerCell('GS'),
                _headerCell('DR'),
                _headerCell('Pt'),
              ],
            ),
          ),
          const Divider(color: Colors.white12, height: 1),
          // Lista classifica
          Expanded(
            child: ListView.builder(
              itemCount: standings.length,
              itemBuilder: (ctx, i) {
                final team = standings[i];
                final pos = i + 1;
                final isUser = team['isUser'] as bool;
                return _buildRow(team, pos, isUser);
              },
            ),
          ),
          // Note giornata
          Container(
            padding: const EdgeInsets.all(10),
            color: Colors.white.withValues(alpha: 0.04),
            child: Text(
              'Giornata ${game.currentRound} / ${game.totalRounds > 0 ? game.totalRounds : "—"}',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white.withValues(alpha: 0.4), fontSize: 11),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLegendDot(Color color, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(width: 10, height: 10, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 4),
        Text(label, style: TextStyle(color: Colors.white.withValues(alpha: 0.5), fontSize: 9)),
      ],
    );
  }

  Widget _headerCell(String text) {
    return SizedBox(
      width: 28,
      child: Text(text, textAlign: TextAlign.center, style: const TextStyle(color: Colors.white38, fontSize: 10, fontWeight: FontWeight.w700)),
    );
  }

  Widget _buildRow(Map<String, dynamic> team, int pos, bool isUser) {
    Color? sideColor;
    if (pos <= 4) sideColor = const Color(0xFF2da86a);
    else if (pos <= 7) sideColor = Colors.blue;
    else if (pos >= 19) sideColor = Colors.red;

    return Container(
      decoration: BoxDecoration(
        color: isUser
            ? const Color(0xFF1a6b4f).withValues(alpha: 0.25)
            : Colors.transparent,
        border: Border(
          left: sideColor != null
              ? BorderSide(color: sideColor, width: 3)
              : BorderSide.none,
          bottom: BorderSide(color: Colors.white.withValues(alpha: 0.05), width: 0.5),
        ),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
      child: Row(
        children: [
          SizedBox(
            width: 20,
            child: Text(
              '$pos',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: pos <= 4
                    ? const Color(0xFF2da86a)
                    : pos >= 19 ? Colors.red : Colors.white54,
                fontSize: 12,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Text(team['emoji'] as String, style: const TextStyle(fontSize: 16)),
          const SizedBox(width: 6),
          Expanded(
            child: Row(
              children: [
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
                if (isUser)
                  Container(
                    margin: const EdgeInsets.only(left: 4),
                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                    decoration: BoxDecoration(
                      color: const Color(0xFFf4a261).withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Text('TU', style: TextStyle(color: Color(0xFFf4a261), fontSize: 8, fontWeight: FontWeight.w900)),
                  ),
              ],
            ),
          ),
          _cell('${team['played']}', Colors.white60),
          _cell('${team['won']}', Colors.green.shade300),
          _cell('${team['drawn']}', Colors.amber.shade300),
          _cell('${team['lost']}', Colors.red.shade300),
          _cell('${team['gf']}', Colors.white60),
          _cell('${team['ga']}', Colors.white60),
          _cell(
            '${(team['gd'] as int) >= 0 ? '+' : ''}${team['gd']}',
            (team['gd'] as int) >= 0 ? Colors.green.shade300 : Colors.red.shade300,
          ),
          _cell('${team['points']}', Colors.white, bold: true),
        ],
      ),
    );
  }

  Widget _cell(String text, Color color, {bool bold = false}) {
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
