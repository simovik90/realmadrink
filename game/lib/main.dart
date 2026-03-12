import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/game_provider.dart';
import 'screens/dashboard_screen.dart';
import 'screens/squad_screen.dart';
import 'screens/tactics_screen.dart';
import 'screens/standings_screen.dart';
import 'screens/match_screen.dart';

// URL della tua app RealMadrink
// Usa la stessa origin quando il gioco è servito da Vercel (iframe in /game)
// oppure forza l'URL di produzione se servito separatamente
const String kApiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'https://realmadrink.vercel.app',
);

void main() {
  runApp(
    ChangeNotifierProvider(
      create: (_) => GameProvider(),
      child: const RealMadrinkGameApp(),
    ),
  );
}

class RealMadrinkGameApp extends StatelessWidget {
  const RealMadrinkGameApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'RealMadrink FC',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF1a6b4f),
          brightness: Brightness.dark,
          primary: const Color(0xFF2da86a),
          secondary: const Color(0xFFff6b35),
          surface: const Color(0xFF0d3b2e),
        ),
        scaffoldBackgroundColor: const Color(0xFF0d3b2e),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF0d3b2e),
          elevation: 0,
          centerTitle: false,
        ),
        useMaterial3: true,
      ),
      home: const GameInitScreen(),
    );
  }
}

class GameInitScreen extends StatefulWidget {
  const GameInitScreen({super.key});

  @override
  State<GameInitScreen> createState() => _GameInitScreenState();
}

class _GameInitScreenState extends State<GameInitScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initGame();
    });
  }

  Future<void> _initGame() async {
    final game = context.read<GameProvider>();
    // Determina l'URL API: usa quello configurato o auto-detect
    String apiUrl = kApiBaseUrl;
    if (apiUrl.isEmpty) {
      // Se siamo in web, usiamo l'URL corrente (stessa origin = funziona!)
      apiUrl = _detectApiUrl();
    }
    await game.initialize(apiUrl);
  }

  String _detectApiUrl() {
    // In Flutter Web, window.location.origin è accessibile via Uri
    // Se il gioco è dentro /game/ dell'app Next.js, l'API è alla stessa origin
    try {
      // Prova a usare l'URL del documento corrente come base
      final uri = Uri.base;
      // Rimuove il path /game/ per ottenere la root dell'app
      return '${uri.scheme}://${uri.host}${uri.port != 80 && uri.port != 443 ? ':${uri.port}' : ''}';
    } catch (_) {
      return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    final game = context.watch<GameProvider>();

    if (game.state == GameState.loading) {
      return const Scaffold(
        backgroundColor: Color(0xFF0d3b2e),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('🍺', style: TextStyle(fontSize: 72)),
              SizedBox(height: 20),
              Text(
                'RealMadrink FC',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1,
                ),
              ),
              SizedBox(height: 8),
              Text(
                'Serie A 2024/25',
                style: TextStyle(color: Colors.white54, fontSize: 14),
              ),
              SizedBox(height: 32),
              CircularProgressIndicator(color: Color(0xFF2da86a)),
              SizedBox(height: 16),
              Text(
                'Caricamento rosa...',
                style: TextStyle(color: Colors.white38, fontSize: 12),
              ),
            ],
          ),
        ),
      );
    }

    return const MainGameScreen();
  }
}

class MainGameScreen extends StatefulWidget {
  const MainGameScreen({super.key});

  @override
  State<MainGameScreen> createState() => _MainGameScreenState();
}

class _MainGameScreenState extends State<MainGameScreen> {
  int _selectedIndex = 0;

  final List<Widget> _screens = const [
    DashboardScreen(),
    SquadScreen(),
    TacticsScreen(),
    StandingsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final game = context.watch<GameProvider>();

    return Scaffold(
      body: IndexedStack(
        index: _selectedIndex,
        children: _screens,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF071f18),
          border: Border(top: BorderSide(color: Colors.white.withValues(alpha: 0.1))),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildNavItem(0, Icons.home_rounded, 'Home'),
                _buildNavItem(1, Icons.people_rounded, 'Rosa'),
                _buildNavItemMatch(context, game),
                _buildNavItem(2, Icons.sports_soccer, 'Tattiche'),
                _buildNavItem(3, Icons.emoji_events_rounded, 'Classifica'),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(int index, IconData icon, String label) {
    final isSelected = _selectedIndex == index;
    return GestureDetector(
      onTap: () => setState(() => _selectedIndex = index),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF1a6b4f).withValues(alpha: 0.4) : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              color: isSelected ? const Color(0xFF2da86a) : Colors.white38,
              size: 22,
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? const Color(0xFF2da86a) : Colors.white38,
                fontSize: 10,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNavItemMatch(BuildContext context, GameProvider game) {
    return GestureDetector(
      onTap: () => Navigator.push(context, MaterialPageRoute(
        builder: (_) => const MatchScreen(),
      )),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFFff6b35), Color(0xFFe85d25)],
          ),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFFff6b35).withValues(alpha: 0.4),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: const Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('⚽', style: TextStyle(fontSize: 20)),
            SizedBox(height: 2),
            Text(
              'PARTITA',
              style: TextStyle(
                color: Colors.white,
                fontSize: 9,
                fontWeight: FontWeight.w900,
                letterSpacing: 0.5,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
