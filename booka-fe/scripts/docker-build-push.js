#!/usr/bin/env node

/**
 * Docker Build and Push Script for Frontend
 *
 * This script:
 * 1. Reads version from package.json
 * 2. Updates .env file with APP_VERSION (optional)
 * 3. Builds Docker image for multi-platform (linux/amd64, linux/arm64)
 * 4. Pushes versioned image
 * 5. Tags and pushes as latest
 */

 import fs from 'fs';
 import path from 'path';
 import { execSync } from 'child_process';

/**
 * Read version from package.json
 * @returns {string} Version string
 */
function getVersionFromPackageJson() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  if (!packageJson.version) {
    console.error('Please add a "version" field to package.json');
    process.exit(1);
  }

  return packageJson.version;
}

/**
 * Update .env file with APP_VERSION (optional, for consistency)
 * Creates .env if it doesn't exist
 * Updates APP_VERSION if it exists, otherwise appends it
 * @param {string} version - Version to set
 */
function updateEnvFile(version) {
  const envPath = path.join(process.cwd(), '.env');
  let envContent = '';

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  const appVersionRegex = /^APP_VERSION=.*$/m;
  if (appVersionRegex.test(envContent)) {
    envContent = envContent.replace(appVersionRegex, `APP_VERSION=${version}`);
  } else {
    if (envContent && !envContent.endsWith('\n')) {
      envContent += '\n';
    }
    envContent += `APP_VERSION=${version}\n`;
  }

  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log(`✓ Updated .env with APP_VERSION=${version}`);
}

/**
 * Check if docker buildx is available
 * @returns {boolean} True if buildx is available
 */
function checkDockerBuildx() {
  try {
    execSync('docker buildx version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Ensure buildx builder exists and is set up
 */
function setupBuildx() {
  try {
    execSync('docker buildx inspect booka-builder > /dev/null 2>&1', { stdio: 'ignore' });
    console.log('✓ Using existing buildx builder: booka-builder');
    execSync('docker buildx use booka-builder', { stdio: 'ignore' });
  } catch (error) {
    console.log('Creating new buildx builder with docker-container driver...');
    execSync('docker buildx create --name booka-builder --driver docker-container --use', { stdio: 'inherit' });
  }

  // Bootstrap the builder to ensure it's ready
  console.log('Bootstrapping buildx builder...');
  execSync('docker buildx inspect --bootstrap', { stdio: 'inherit' });
}

/**
 * Build and push Docker image for multi-platform
 * @param {string} version - Version tag
 */
function buildAndPush(version) {
  const imageName = 'shayazulay/booka-frontend';
  const versionTag = `${imageName}:${version}`;
  const latestTag = `${imageName}:latest`;

  console.log(`\n🔨 Building multi-platform image: ${versionTag}`);
  console.log('Platforms: linux/amd64, linux/arm64\n');

  const buildCommand = `docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --tag ${versionTag} \
    --tag ${latestTag} \
    --push \
    --file Dockerfile \
    .`;

  try {
    execSync(buildCommand, { stdio: 'inherit' });
    console.log(`\n✓ Successfully built and pushed: ${versionTag}`);
    console.log(`✓ Successfully tagged and pushed: ${latestTag}`);
  } catch (error) {
    console.error('Error building or pushing Docker image');
    process.exit(1);
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 Starting Docker build and push process for frontend...\n');

  if (!checkDockerBuildx()) {
    console.error('❌ Error: docker buildx is not available');
    console.error('Please install Docker with buildx support');
    process.exit(1);
  }

  const version = getVersionFromPackageJson();
  console.log(`📦 Version from package.json: ${version}\n`);

  updateEnvFile(version);
  setupBuildx();
  buildAndPush(version);

  console.log('\n✅ Build and push completed successfully!');
}

main();

