import 'package:flutter_test/flutter_test.dart';
import 'package:realmadrink_game/main.dart';

void main() {
  testWidgets('RealMadrink game smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const RealMadrinkGameApp());
    expect(find.text('RealMadrink FC'), findsWidgets);
  });
}
