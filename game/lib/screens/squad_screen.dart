import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/game_provider.dart';
import '../models/player.dart';

class SquadScreen extends StatefulWidget {
  const SquadScreen({super.key});

  @override
  State<SquadScreen> createState() => _SquadScreenState();
}

class _SquadScreenState extends State<SquadScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final game = context.watch<GameProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFF0d3b2e),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0d3b2e),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Rosa', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900)),
            Text(
              '${game.starters.length}/7 titolari',
              style: TextStyle(color: Colors.white.withValues(alpha: 0.6), fontSize: 12),
            ),
          ],
        ),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFFff6b35),
          labelColor: const Color(0xFFff6b35),
          unselectedLabelColor: Colors.white54,
          tabs: [
            Tab(text: 'TITOLARI (${game.starters.length})'),
            Tab(text: 'PANCHINA (${game.bench.length})'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildStartersList(context, game),
          _buildBenchList(context, game),
        ],
      ),
    );
  }

  Widget _buildStartersList(BuildContext context, GameProvider game) {
    final starters = game.starters;

    if (starters.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('👥', style: TextStyle(fontSize: 48)),
            const SizedBox(height: 12),
            Text(
              'Nessun titolare selezionato',
              style: TextStyle(color: Colors.white.withValues(alpha: 0.6), fontSize: 16),
            ),
            const SizedBox(height: 8),
            Text(
              'Vai in Panchina e aggiungi i tuoi giocatori',
              style: TextStyle(color: Colors.white.withValues(alpha: 0.4), fontSize: 13),
            ),
          ],
        ),
      );
    }

    return Column(
      children: [
        // Avvisi
        if (!game.hasGoalkeeper)
          _buildWarning('⚠️ Nessun portiere in campo! Seleziona un portiere.'),
        if (game.starters.length < 7)
          _buildWarning('ℹ️ Hai solo ${game.starters.length} titolari. Ne servono 7.'),

        // Lista titolari
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: starters.length,
            itemBuilder: (ctx, i) {
              return _buildPlayerCard(context, starters[i], true, game);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildBenchList(BuildContext context, GameProvider game) {
    final bench = game.bench;

    if (bench.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('🎉', style: TextStyle(fontSize: 48)),
            const SizedBox(height: 12),
            Text(
              'Tutti in campo!',
              style: TextStyle(color: Colors.white.withValues(alpha: 0.6), fontSize: 16),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: bench.length,
      itemBuilder: (ctx, i) {
        return _buildPlayerCard(context, bench[i], false, game);
      },
    );
  }

  Widget _buildWarning(String text) {
    return Container(
      margin: const EdgeInsets.fromLTRB(12, 8, 12, 0),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.orange.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.orange.withValues(alpha: 0.4)),
      ),
      child: Text(text, style: const TextStyle(color: Colors.orange, fontSize: 12)),
    );
  }

  Widget _buildPlayerCard(BuildContext context, Player player, bool isStarter, GameProvider game) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: isStarter
            ? const Color(0xFF1a6b4f).withValues(alpha: 0.3)
            : Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isStarter
              ? const Color(0xFF2da86a).withValues(alpha: 0.4)
              : Colors.white.withValues(alpha: 0.08),
        ),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        leading: Stack(
          children: [
            CircleAvatar(
              backgroundColor: _positionColor(player.positionLabel),
              child: player.imageUrl != null && player.imageUrl!.isNotEmpty
                  ? ClipOval(
                      child: Image.network(
                        player.imageUrl!,
                        width: 40,
                        height: 40,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Text(
                          player.name[0].toUpperCase(),
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900),
                        ),
                      ),
                    )
                  : Text(
                      player.name[0].toUpperCase(),
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900),
                    ),
            ),
            if (isStarter)
              Positioned(
                right: 0,
                bottom: 0,
                child: Container(
                  width: 14,
                  height: 14,
                  decoration: const BoxDecoration(
                    color: Color(0xFF2da86a),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.check, size: 10, color: Colors.white),
                ),
              ),
          ],
        ),
        title: Row(
          children: [
            Expanded(
              child: Text(
                player.name,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                  fontSize: 14,
                ),
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: _positionColor(player.positionLabel).withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                player.positionLabel,
                style: TextStyle(
                  color: _positionColor(player.positionLabel),
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Row(
              children: [
                _buildMiniStat('OVR', player.overall, const Color(0xFFf4a261)),
                const SizedBox(width: 8),
                if (!player.isGoalkeeper) ...[
                  _buildMiniStat('VEL', player.pace, Colors.blue.shade300),
                  const SizedBox(width: 8),
                  _buildMiniStat('TIR', player.shooting, Colors.red.shade300),
                  const SizedBox(width: 8),
                  _buildMiniStat('PAS', player.passing, Colors.green.shade300),
                ] else ...[
                  _buildMiniStat('RIF', player.reflexes, Colors.purple.shade300),
                  const SizedBox(width: 8),
                  _buildMiniStat('DIF', player.defending, Colors.blue.shade300),
                ],
              ],
            ),
          ],
        ),
        trailing: GestureDetector(
          onTap: () => _onPlayerTap(context, player, isStarter, game),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: isStarter
                  ? Colors.red.withValues(alpha: 0.2)
                  : game.starters.length < 7
                      ? const Color(0xFF1a6b4f).withValues(alpha: 0.4)
                      : Colors.grey.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: isStarter
                    ? Colors.red.withValues(alpha: 0.4)
                    : game.starters.length < 7
                        ? const Color(0xFF2da86a).withValues(alpha: 0.4)
                        : Colors.grey.withValues(alpha: 0.2),
              ),
            ),
            child: Text(
              isStarter ? 'OUT' : game.starters.length < 7 ? 'IN' : 'FULL',
              style: TextStyle(
                color: isStarter
                    ? Colors.red.shade300
                    : game.starters.length < 7
                        ? const Color(0xFF2da86a)
                        : Colors.grey,
                fontSize: 11,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _onPlayerTap(BuildContext context, Player player, bool isStarter, GameProvider game) {
    if (isStarter) {
      game.toggleStarter(player);
    } else {
      if (game.starters.length >= 7) {
        // Mostra dialog per scambio
        _showSwapDialog(context, player, game);
      } else {
        game.toggleStarter(player);
      }
    }
  }

  void _showSwapDialog(BuildContext context, Player benchPlayer, GameProvider game) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1a3a2e),
        title: Text(
          'Sostituisci con ${benchPlayer.name}',
          style: const TextStyle(color: Colors.white, fontSize: 16),
        ),
        content: SizedBox(
          width: double.maxFinite,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Scegli chi sostituire:',
                style: TextStyle(color: Colors.white.withValues(alpha: 0.6), fontSize: 13),
              ),
              const SizedBox(height: 8),
              ...game.starters.map((starter) => ListTile(
                leading: CircleAvatar(
                  backgroundColor: _positionColor(starter.positionLabel),
                  child: Text(starter.name[0], style: const TextStyle(color: Colors.white)),
                ),
                title: Text(starter.name, style: const TextStyle(color: Colors.white, fontSize: 13)),
                subtitle: Text(starter.positionLabel, style: TextStyle(color: Colors.white.withValues(alpha: 0.5), fontSize: 11)),
                onTap: () {
                  game.swapPlayers(starter, benchPlayer);
                  Navigator.pop(ctx);
                },
              )),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMiniStat(String label, int value, Color color) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          '$label ',
          style: TextStyle(color: Colors.white.withValues(alpha: 0.4), fontSize: 10),
        ),
        Text(
          '$value',
          style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w700),
        ),
      ],
    );
  }

  Color _positionColor(String pos) {
    switch (pos) {
      case 'POR': return Colors.amber.shade700;
      case 'DIF': return Colors.blue.shade700;
      case 'CEN': return Colors.green.shade700;
      case 'ATT': return Colors.red.shade700;
      default: return Colors.grey.shade700;
    }
  }
}
