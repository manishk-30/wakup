const fs = require('fs');

let content = fs.readFileSync('./app/onboarding.tsx', 'utf-8');

// We want to replace <View style={styles.centerContainer}> with a ScrollView
// But only for the cases that need it. Cases 1-12, 14-17.
const targetRegex = /<View style=\{styles\.centerContainer\}>([\s\S]*?)<\/View>\s*(?=\);?\s*case |\);?\s*default:)/g;

content = content.replace(targetRegex, (match, innerContent) => {
    return `<ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={styles.scrollCenterContainer} showsVerticalScrollIndicator={false}>\n${innerContent}\n          </ScrollView>`;
});

// Also fix progressBarContainer absolute positioning
content = content.replace(
    `  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
    width: '100%',
    position: 'absolute',
    top: 50, // safe area approx
    zIndex: 10,
  },`,
    `  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
    width: '100%',
    marginVertical: Spacing.sm,
  },`
);

// Add scrollCenterContainer to styles
content = content.replace(
    `  centerContainer: {`,
    `  scrollCenterContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  centerContainer: {`
);

fs.writeFileSync('./app/onboarding.tsx', content, 'utf-8');
console.log('Fixed onboarding.tsx successfully');
