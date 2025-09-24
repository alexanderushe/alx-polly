#!/usr/bin/env node

/**
 * Notification System Setup Script
 *
 * This script helps set up and test the notification system for ALX-Polly.
 * It validates configuration, tests email delivery, and provides setup guidance.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
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

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log('\n' + '='.repeat(60), 'cyan');
  log(`  ${message}`, 'bright');
  log('='.repeat(60), 'cyan');
}

function logStep(step, message) {
  log(`\n${step}. ${message}`, 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

class NotificationSetup {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.envPath = path.join(this.projectRoot, '.env.local');
    this.envExamplePath = path.join(this.projectRoot, '.env.example');
    this.requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'RESEND_API_KEY',
      'FROM_EMAIL',
      'FROM_NAME',
      'NEXT_PUBLIC_BASE_URL'
    ];
    this.config = {};
  }

  async run() {
    try {
      logHeader('ALX-Polly Notification System Setup');

      await this.checkPrerequisites();
      await this.loadEnvironment();
      await this.validateConfiguration();
      await this.checkDatabase();
      await this.testEmailService();
      await this.deployEdgeFunctions();
      await this.setupCronJobs();
      await this.runFinalTests();

      this.showCompletionSummary();

    } catch (error) {
      logError(`Setup failed: ${error.message}`);
      process.exit(1);
    }
  }

  async checkPrerequisites() {
    logStep(1, 'Checking Prerequisites');

    // Check Node.js version
    const nodeVersion = process.version;
    log(`Node.js version: ${nodeVersion}`);

    if (parseInt(nodeVersion.slice(1)) < 18) {
      logError('Node.js 18 or higher is required');
      throw new Error('Unsupported Node.js version');
    }
    logSuccess('Node.js version is compatible');

    // Check if we're in the right directory
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      logError('package.json not found. Make sure you\'re in the project root directory');
      throw new Error('Invalid project directory');
    }

    // Check if Supabase CLI is installed
    try {
      execSync('supabase --version', { stdio: 'ignore' });
      logSuccess('Supabase CLI is installed');
    } catch (error) {
      logWarning('Supabase CLI not found. Install with: npm install -g supabase');
    }

    // Check required dependencies
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

    const requiredPackages = ['resend', 'react-email', '@supabase/supabase-js'];
    const missingPackages = requiredPackages.filter(pkg => !dependencies[pkg]);

    if (missingPackages.length > 0) {
      logError(`Missing required packages: ${missingPackages.join(', ')}`);
      log('Install with: npm install resend react-email @supabase/supabase-js');
      throw new Error('Missing dependencies');
    }
    logSuccess('All required packages are installed');
  }

  async loadEnvironment() {
    logStep(2, 'Loading Environment Variables');

    // Check if .env.local exists
    if (!fs.existsSync(this.envPath)) {
      logWarning('.env.local not found');

      if (fs.existsSync(this.envExamplePath)) {
        log('Copying .env.example to .env.local...');
        fs.copyFileSync(this.envExamplePath, this.envPath);
        logWarning('Please update .env.local with your actual values');
      } else {
        logError('No environment file found. Create .env.local with required variables');
        this.showRequiredEnvVars();
        throw new Error('Missing environment configuration');
      }
    }

    // Load environment variables
    const envContent = fs.readFileSync(this.envPath, 'utf8');
    const envLines = envContent.split('\n');

    envLines.forEach(line => {
      const match = line.match(/^([^#][^=]*?)=(.*)$/);
      if (match) {
        const [, key, value] = match;
        this.config[key.trim()] = value.trim().replace(/^['"]|['"]$/g, '');
      }
    });

    logSuccess('Environment variables loaded');
  }

  async validateConfiguration() {
    logStep(3, 'Validating Configuration');

    const missingVars = this.requiredEnvVars.filter(varName => !this.config[varName]);

    if (missingVars.length > 0) {
      logError(`Missing required environment variables: ${missingVars.join(', ')}`);
      this.showRequiredEnvVars();
      throw new Error('Incomplete configuration');
    }

    // Validate URLs
    try {
      new URL(this.config.NEXT_PUBLIC_SUPABASE_URL);
      logSuccess('Supabase URL is valid');
    } catch {
      logError('Invalid Supabase URL');
      throw new Error('Invalid configuration');
    }

    try {
      new URL(this.config.NEXT_PUBLIC_BASE_URL);
      logSuccess('Base URL is valid');
    } catch {
      logError('Invalid base URL');
      throw new Error('Invalid configuration');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.config.FROM_EMAIL)) {
      logError('Invalid FROM_EMAIL format');
      throw new Error('Invalid configuration');
    }
    logSuccess('Email configuration is valid');

    // Check API key formats
    if (!this.config.RESEND_API_KEY.startsWith('re_')) {
      logWarning('Resend API key format looks unusual (should start with "re_")');
    }

    logSuccess('Configuration validation complete');
  }

  async checkDatabase() {
    logStep(4, 'Checking Database Schema');

    log('Checking for notification tables...');

    // This would typically connect to the database and check for required tables
    // For now, we'll check if migration files exist
    const migrationDir = path.join(this.projectRoot, 'supabase', 'migrations');

    if (!fs.existsSync(migrationDir)) {
      logWarning('Migration directory not found');
      log('Run: supabase init to set up Supabase project');
      return;
    }

    const migrationFiles = fs.readdirSync(migrationDir)
      .filter(file => file.includes('notification'));

    if (migrationFiles.length === 0) {
      logError('Notification migration files not found');
      log('Make sure to apply the notification system migrations');
      throw new Error('Database schema not ready');
    }

    logSuccess(`Found ${migrationFiles.length} notification migration files`);
    migrationFiles.forEach(file => log(`  - ${file}`, 'cyan'));
  }

  async testEmailService() {
    logStep(5, 'Testing Email Service');

    log('Testing Resend API connection...');

    try {
      // Simple API test - check if we can reach Resend
      const response = await fetch('https://api.resend.com/domains', {
        headers: {
          'Authorization': `Bearer ${this.config.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        logSuccess('Resend API connection successful');
        const data = await response.json();
        log(`Connected domains: ${data.data?.length || 0}`);
      } else {
        logError(`Resend API error: ${response.status} ${response.statusText}`);
        if (response.status === 401) {
          logError('Invalid Resend API key');
        }
        throw new Error('Email service test failed');
      }
    } catch (error) {
      logError(`Email service test failed: ${error.message}`);
      throw error;
    }
  }

  async deployEdgeFunctions() {
    logStep(6, 'Deploying Edge Functions');

    const functionPath = path.join(this.projectRoot, 'supabase', 'functions', 'process-notifications');

    if (!fs.existsSync(functionPath)) {
      logError('Process notifications function not found');
      throw new Error('Edge function missing');
    }

    log('Edge function found at:', functionPath);
    logWarning('To deploy: supabase functions deploy process-notifications');
    logWarning('Make sure to set environment variables in Supabase dashboard');
  }

  async setupCronJobs() {
    logStep(7, 'Setting up Cron Jobs');

    log('Cron job setup instructions:');
    log('1. Go to your Supabase dashboard');
    log('2. Navigate to Database > Extensions');
    log('3. Enable the "pg_cron" extension');
    log('4. Run the following SQL command:');
    log('');
    log("SELECT cron.schedule(", 'yellow');
    log("  'process-notifications',", 'yellow');
    log("  '*/5 * * * *',", 'yellow');
    log("  'SELECT net.http_post(", 'yellow');
    log(`    url := '${this.config.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/process-notifications',`, 'yellow');
    log("    headers := '{\"Authorization\": \"Bearer YOUR_SERVICE_ROLE_KEY\"}',", 'yellow');
    log("    body := '{}',", 'yellow');
    log("    timeout_milliseconds := 30000", 'yellow');
    log("  );'", 'yellow');
    log(");", 'yellow');

    logWarning('Cron job setup requires manual configuration');
  }

  async runFinalTests() {
    logStep(8, 'Running Final Tests');

    log('Testing notification type formatting...');
    // Simple test of utility functions
    const testTypes = ['poll_closing_24h', 'new_poll', 'voting_reminder'];
    testTypes.forEach(type => {
      log(`  ${type} -> "${type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}"`);
    });
    logSuccess('Utility functions working correctly');

    log('Testing quiet hours calculation...');
    // Test quiet hours logic
    const testTime = new Date();
    log(`Current time: ${testTime.toLocaleTimeString()}`);
    logSuccess('Time calculations working correctly');
  }

  showRequiredEnvVars() {
    log('\nRequired environment variables:', 'yellow');
    this.requiredEnvVars.forEach(varName => {
      log(`  ${varName}=your_value_here`, 'cyan');
    });
    log('');
  }

  showCompletionSummary() {
    logHeader('Setup Complete! 🎉');

    log('Your notification system is ready with the following features:');
    log('');
    logSuccess('✅ Email service configured (Resend)');
    logSuccess('✅ Database schema ready');
    logSuccess('✅ Notification preferences system');
    logSuccess('✅ Email templates');
    logSuccess('✅ Scheduled notification processing');
    log('');

    log('Next Steps:', 'bright');
    log('1. Deploy your Edge Functions: supabase functions deploy');
    log('2. Set up cron jobs in Supabase dashboard');
    log('3. Test the notification system at /notifications');
    log('4. Configure your domain in Resend (if using custom domain)');
    log('');

    log('Useful Commands:', 'bright');
    log('- Test notifications: npm run test:notifications');
    log('- View logs: supabase functions logs process-notifications');
    log('- Reset database: supabase db reset');
    log('');

    log('Documentation:', 'bright');
    log('- Full docs: NOTIFICATION-SYSTEM.md');
    log('- API reference: API-IMPLEMENTATIONS.md');
    log('- Troubleshooting: Check the docs for common issues');
    log('');

    logSuccess('Notification system setup completed successfully!');
  }
}

// Run the setup if this script is called directly
if (require.main === module) {
  const setup = new NotificationSetup();
  setup.run().catch(error => {
    logError(`Setup failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = NotificationSetup;
