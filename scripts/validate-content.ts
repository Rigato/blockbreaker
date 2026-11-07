import { formatContentReport, validateContent } from '../src/content/phases';

const issues = validateContent();

console.log(formatContentReport());

if (issues.length > 0) {
  console.error(`\nContent validation failed with ${issues.length} issue(s):`);
  for (const issue of issues) {
    console.error(`  [${issue.path}] ${issue.message}`);
  }
  process.exitCode = 1;
} else {
  console.log('\nContent validation passed.');
}
