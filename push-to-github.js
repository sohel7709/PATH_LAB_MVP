/**
 * Script to push code to GitHub
 * This script provides detailed output for each step of the process
 */

const { execSync } = require('child_process');
const path = require('path');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// GitHub repository URL
const GITHUB_REPO = 'https://github.com/sohel7709/PATH_LAB_MVP';

// Helper function to execute commands and log output
function runCommand(command, description) {
  console.log(`\n${colors.bright}${colors.blue}=== ${description} ===${colors.reset}\n`);
  try {
    const output = execSync(command, { encoding: 'utf8' });
    console.log(output);
    console.log(`\n${colors.green}✓ Success: ${description}${colors.reset}\n`);
    return { success: true, output };
  } catch (error) {
    console.error(`\n${colors.red}✗ Error: ${description} failed${colors.reset}`);
    console.error(`${colors.red}${error.message}${colors.reset}\n`);
    return { success: false, error: error.message };
  }
}

// Main function to push code to GitHub
async function pushToGitHub() {
  console.log(`\n${colors.bright}${colors.magenta}======================================${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}  PUSHING CODE TO GITHUB  ${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}======================================${colors.reset}\n`);
  
  // Check if we're in a git repository
  const isGitRepo = runCommand('git rev-parse --is-inside-work-tree 2>/dev/null || echo "false"', 'Checking if we\'re in a git repository');
  
  if (isGitRepo.output.trim() !== 'true') {
    console.log(`${colors.yellow}Not in a git repository. Initializing a new one...${colors.reset}\n`);
    runCommand('git init', 'Initializing git repository');
  }
  
  // Check git status
  const gitStatus = runCommand('git status', 'Checking git status');
  
  // Add all files
  runCommand('git add .', 'Adding all files to git');
  
  // Commit changes
  runCommand('git commit -m "Deployment-ready enhancements with security features" --allow-empty', 'Committing changes');
  
  // Check if remote exists
  const remoteCheck = runCommand('git remote -v', 'Checking remote repositories');
  
  if (!remoteCheck.output.includes('origin')) {
    console.log(`${colors.yellow}Remote 'origin' not found. Adding it...${colors.reset}\n`);
    runCommand(`git remote add origin ${GITHUB_REPO}`, 'Adding GitHub remote');
  } else if (!remoteCheck.output.includes(GITHUB_REPO)) {
    console.log(`${colors.yellow}Remote 'origin' exists but points to a different URL. Updating it...${colors.reset}\n`);
    runCommand(`git remote set-url origin ${GITHUB_REPO}`, 'Updating GitHub remote URL');
  }
  
  // Get current branch
  const branchResult = runCommand('git rev-parse --abbrev-ref HEAD', 'Getting current branch');
  const currentBranch = branchResult.output.trim() || 'master';
  
  // Push to GitHub
  console.log(`${colors.cyan}Pushing to GitHub branch: ${currentBranch}${colors.reset}\n`);
  const pushResult = runCommand(`git push -u origin ${currentBranch}`, `Pushing to GitHub branch: ${currentBranch}`);
  
  if (pushResult.success) {
    console.log(`\n${colors.bright}${colors.green}========================================${colors.reset}`);
    console.log(`${colors.bright}${colors.green}  CODE SUCCESSFULLY PUSHED TO GITHUB!  ${colors.reset}`);
    console.log(`${colors.bright}${colors.green}========================================${colors.reset}\n`);
    
    console.log(`${colors.cyan}Repository URL: ${GITHUB_REPO}${colors.reset}\n`);
  } else {
    console.log(`\n${colors.bright}${colors.red}========================================${colors.reset}`);
    console.log(`${colors.bright}${colors.red}  FAILED TO PUSH CODE TO GITHUB  ${colors.reset}`);
    console.log(`${colors.bright}${colors.red}========================================${colors.reset}\n`);
    
    console.log(`${colors.yellow}You may need to push manually with:${colors.reset}`);
    console.log(`${colors.bright}git push -u origin ${currentBranch}${colors.reset}\n`);
    
    console.log(`${colors.yellow}If you're having authentication issues, you might need to:${colors.reset}`);
    console.log(`1. Use a personal access token instead of a password`);
    console.log(`2. Configure SSH authentication`);
    console.log(`3. Use a credential helper like git credential-manager\n`);
  }
}

// Run the script
pushToGitHub().catch(err => {
  console.error(`\n${colors.red}Script failed: ${err.message}${colors.reset}\n`);
  process.exit(1);
});
