import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/game_provider.dart';

class TacticsScreen extends StatelessWidget {
  const TacticsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final game = context.watch<GameProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFF0d3b2e),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0d3b2e),
        title: const Text('Tattiche', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900)),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSectionLabel('MODULO DI GIOCO'),
            const SizedBox(height: 10),
            _buildFormationGrid(context, game),
            const SizedBox(height: 24),
            _buildSectionLabel('ANTEPRIMA CAMPO'),
            const SizedBox(height: 10),
            _buildPitchPreview(game),
            const SizedBox(height: 24),
            _buildSectionLabel('STATISTICHE SQUADRA'),
            const SizedBox(height: 10),
            _buildTeamStats(game),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionLabel(String text) {
    return Text(
      text,
      style: const TextStyle(
        color: Colors.white38,
        fontSize: 11,
        fontWeight: FontWeight.w700,
        letterSpacing: 1.5,
      ),
    );
  }

  Widget _buildFormationGrid(BuildContext context, GameProvider game) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      childAspectRatio: 2.5,
      children: Formation.values.map((f) {
        final isSelected = game.formation == f;
        return GestureDetector(
          onTap: () => game.setFormation(f),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              gradient: isSelected
                  ? const LinearGradient(
                      colors: [Color(0xFF1a6b4f), Color(0xFF228b5e)],
                    )
                  : null,
              color: isSelected ? null : Colors.white.withValues(alpha: 0.07),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: isSelected
                    ? const Color(0xFF2da86a)
                    : Colors.white.withValues(alpha: 0.1),
                width: isSelected ? 1.5 : 1,
              ),
              boxShadow: isSelected
                  ? [BoxShadow(color: const Color(0xFF2da86a).withValues(alpha: 0.3), blurRadius: 8)]
                  : [],
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      f.label,
                      style: TextStyle(
                        color: isSelected ? Colors.white : Colors.white70,
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    if (isSelected) ...[
                      const SizedBox(width: 6),
                      const Icon(Icons.check_circle, color: Color(0xFF2da86a), size: 16),
                    ],
                  ],
                ),
                Text(
                  _formationDesc(f),
                  style: TextStyle(
                    color: isSelected ? Colors.white70 : Colors.white38,
                    fontSize: 10,
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  String _formationDesc(Formation f) {
    switch (f) {
      case Formation.f231: return '2 Dif · 3 Cen · 1 Att';
      case Formation.f321: return '3 Dif · 2 Cen · 1 Att';
      case Formation.f222: return '2 Dif · 2 Cen · 2 Att';
      case Formation.f141: return '1 Dif · 4 Cen · 1 Att';
    }
  }

  Widget _buildPitchPreview(GameProvider game) {
    final starters = game.starters;
    final goalkeepers = starters.where((p) => p.isGoalkeeper).toList();
    final outfield = starters.where((p) => !p.isGoalkeeper).toList();

    return Container(
      height: 260,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1a6b4f), Color(0xFF228b5e), Color(0xFF1a6b4f)],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
      ),
      child: Stack(
        children: [
          // Linee campo
          Positioned(
            left: 0, right: 0,
            top: 0, bottom: 0,
            child: CustomPaint(painter: _PitchPainter()),
          ),
          // Giocatori
          LayoutBuilder(
            builder: (ctx, constraints) {
              final w = constraints.maxWidth;
              final h = constraints.maxHeight;
              final formation = game.formation;

              final List<Offset> positions = [
                Offset(w / 2, h * 0.88), // POR
              ];

              // Difensori
              for (int i = 0; i < formation.defenders; i++) {
                positions.add(Offset(w * (i + 1) / (formation.defenders + 1), h * 0.68));
              }
              // Centrocampisti
              for (int i = 0; i < formation.midfielders; i++) {
                positions.add(Offset(w * (i + 1) / (formation.midfielders + 1), h * 0.42));
              }
              // Attaccanti
              for (int i = 0; i < formation.forwards; i++) {
                positions.add(Offset(w * (i + 1) / (formation.forwards + 1), h * 0.15));
              }

              final allPlayers = [...goalkeepers, ...outfield];
              final List<String> roleLabels = [
                'POR',
                ...List.filled(formation.defenders, 'DIF'),
                ...List.filled(formation.midfielders, 'CEN'),
                ...List.filled(formation.forwards, 'ATT'),
              ];

              return Stack(
                children: List.generate(
                  positions.length,
                  (i) {
                    final hasPlayer = i < allPlayers.length;
                    return Positioned(
                      left: positions[i].dx - 22,
                      top: positions[i].dy - 22,
                      child: _buildPitchDot(
                        hasPlayer ? allPlayers[i].name : null,
                        roleLabels[i],
                        i == 0,
                        hasPlayer,
                      ),
                    );
                  },
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildPitchDot(String? name, String role, bool isGk, bool hasPlayer) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: hasPlayer
                ? (isGk ? const Color(0xFFf4a261) : const Color(0xFF2da86a))
                : Colors.white.withValues(alpha: 0.15),
            shape: BoxShape.circle,
            border: Border.all(
              color: hasPlayer ? Colors.white : Colors.white.withValues(alpha: 0.3),
              width: 1.5,
            ),
          ),
          child: Center(
            child: hasPlayer && name != null
                ? Text(
                    name[0].toUpperCase(),
                    style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w900),
                  )
                : Text(
                    role,
                    style: TextStyle(color: Colors.white.withValues(alpha: 0.4), fontSize: 8, fontWeight: FontWeight.w600),
                  ),
          ),
        ),
        const SizedBox(height: 2),
        Text(
          hasPlayer && name != null ? name.split(' ').last : role,
          style: TextStyle(
            color: hasPlayer ? Colors.white : Colors.white.withValues(alpha: 0.3),
            fontSize: 8,
            fontWeight: hasPlayer ? FontWeight.w700 : FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Widget _buildTeamStats(GameProvider game) {
    if (game.starters.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Text(
          'Nessun giocatore in campo',
          style: TextStyle(color: Colors.white54, fontSize: 13),
          textAlign: TextAlign.center,
        ),
      );
    }

    final starters = game.starters;
    int avgOverall = (starters.map((p) => p.overall).reduce((a, b) => a + b) / starters.length).round();
    int avgPace = (starters.map((p) => p.pace).reduce((a, b) => a + b) / starters.length).round();
    int avgShooting = (starters.map((p) => p.shooting).reduce((a, b) => a + b) / starters.length).round();
    int avgPassing = (starters.map((p) => p.passing).reduce((a, b) => a + b) / starters.length).round();
    int avgDefending = (starters.map((p) => p.defending).reduce((a, b) => a + b) / starters.length).round();
    int avgPhysical = (starters.map((p) => p.physical).reduce((a, b) => a + b) / starters.length).round();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Column(
        children: [
          _buildStatBar('Overall', avgOverall, const Color(0xFFf4a261)),
          const SizedBox(height: 10),
          _buildStatBar('Velocità', avgPace, Colors.lightBlue),
          const SizedBox(height: 10),
          _buildStatBar('Tiro', avgShooting, Colors.red.shade300),
          const SizedBox(height: 10),
          _buildStatBar('Passaggi', avgPassing, Colors.green.shade300),
          const SizedBox(height: 10),
          _buildStatBar('Difesa', avgDefending, Colors.blue.shade300),
          const SizedBox(height: 10),
          _buildStatBar('Fisico', avgPhysical, Colors.purple.shade300),
        ],
      ),
    );
  }

  Widget _buildStatBar(String label, int value, Color color) {
    return Row(
      children: [
        SizedBox(
          width: 70,
          child: Text(label, style: const TextStyle(color: Colors.white60, fontSize: 12)),
        ),
        Expanded(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: value / 99.0,
              backgroundColor: Colors.white.withValues(alpha: 0.1),
              valueColor: AlwaysStoppedAnimation<Color>(color),
              minHeight: 6,
            ),
          ),
        ),
        const SizedBox(width: 8),
        SizedBox(
          width: 28,
          child: Text(
            '$value',
            style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w700),
            textAlign: TextAlign.right,
          ),
        ),
      ],
    );
  }
}

class _PitchPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withValues(alpha: 0.08)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;

    // Linea di metà campo
    canvas.drawLine(Offset(0, size.height / 2), Offset(size.width, size.height / 2), paint);

    // Cerchio centrocampo
    canvas.drawCircle(Offset(size.width / 2, size.height / 2), 40, paint);

    // Area portiere nostra (in basso)
    final rectBottom = Rect.fromCenter(
      center: Offset(size.width / 2, size.height - 20),
      width: 100, height: 40,
    );
    canvas.drawRect(rectBottom, paint);

    // Area portiere avversario (in alto)
    final rectTop = Rect.fromCenter(
      center: Offset(size.width / 2, 20),
      width: 100, height: 40,
    );
    canvas.drawRect(rectTop, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
