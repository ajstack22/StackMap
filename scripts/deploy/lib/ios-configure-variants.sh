#!/bin/bash

# ============================================
# iOS Build Variant Configuration
# Programmatically configures Xcode project for multi-environment builds
# ============================================
#
# This script sets up iOS build variants similar to Android's product flavors:
# - QUAL: Local testing (development signing)
# - STAGE: Internal testing (TestFlight Internal)
# - BETA: External testing (TestFlight External)
# - PROD: Production (App Store)
#
# Each variant has:
# - Unique bundle ID (except prod)
# - Environment-specific app name
# - Runtime-accessible BUILD_TYPE_ENV
#
# ============================================

# Source common functions if not already loaded
if [ -z "$(type -t log_info)" ]; then
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
    source "$SCRIPT_DIR/lib/common.sh"
fi

# ============================================
# Configuration
# ============================================

get_project_root() {
    cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd
}

PROJECT_ROOT=$(get_project_root)
IOS_DIR="$PROJECT_ROOT/ios"
XCODEPROJ="$IOS_DIR/StackMapNative.xcodeproj"
PROJECT_FILE="$XCODEPROJ/project.pbxproj"
INFO_PLIST="$IOS_DIR/StackMapNative/Info.plist"

# Verify files exist
if [ ! -f "$PROJECT_FILE" ]; then
    echo "❌ ERROR: Xcode project not found at $PROJECT_FILE" >&2
    exit 1
fi

if [ ! -f "$INFO_PLIST" ]; then
    echo "❌ ERROR: Info.plist not found at $INFO_PLIST" >&2
    exit 1
fi

# ============================================
# Step 1: Update Info.plist to read BUILD_TYPE_ENV
# ============================================

configure_info_plist() {
    log_step "Configuring Info.plist to read BUILD_TYPE_ENV from xcconfig..."

    # Check if BUILD_TYPE_ENV already exists in Info.plist
    if grep -q "BUILD_TYPE_ENV" "$INFO_PLIST"; then
        log_info "BUILD_TYPE_ENV already exists in Info.plist"
    else
        # Add BUILD_TYPE_ENV key that reads from xcconfig variable
        /usr/libexec/PlistBuddy -c "Add :BUILD_TYPE_ENV string \$(BUILD_TYPE_ENV)" "$INFO_PLIST" 2>/dev/null || {
            log_warning "BUILD_TYPE_ENV key may already exist"
        }
        log_success "✅ Added BUILD_TYPE_ENV to Info.plist"
    fi
}

# ============================================
# Step 2: Verify xcconfig files exist
# ============================================

verify_xcconfig_files() {
    log_step "Verifying xcconfig files..."

    local missing_files=false

    for config in Qual Stage Beta Prod; do
        if [ ! -f "$IOS_DIR/${config}.xcconfig" ]; then
            log_error "Missing xcconfig file: $IOS_DIR/${config}.xcconfig"
            missing_files=true
        else
            log_info "✓ Found ${config}.xcconfig"
        fi
    done

    if [ "$missing_files" = true ]; then
        echo "❌ ERROR: Missing xcconfig files" >&2
        echo "Run this script from deployment pipeline or create files manually" >&2
        exit 1
    fi

    log_success "✅ All xcconfig files present"
}

# ============================================
# Step 3: Add xcconfig references to Xcode project
# ============================================

add_xcconfig_to_project() {
    log_step "Adding xcconfig file references to Xcode project..."

    # Check if xcconfig files are already referenced
    if grep -q "Qual.xcconfig" "$PROJECT_FILE"; then
        log_info "xcconfig files already referenced in project"
        return 0
    fi

    # Backup project file
    cp "$PROJECT_FILE" "$PROJECT_FILE.backup"
    log_info "💾 Backed up project.pbxproj"

    # Generate UUIDs for xcconfig file references (using MD5 for consistency)
    QUAL_UUID=$(echo "Qual.xcconfig" | md5 | cut -c 1-24 | tr '[:lower:]' '[:upper:]')
    STAGE_UUID=$(echo "Stage.xcconfig" | md5 | cut -c 1-24 | tr '[:lower:]' '[:upper:]')
    BETA_UUID=$(echo "Beta.xcconfig" | md5 | cut -c 1-24 | tr '[:lower:]' '[:upper:]')
    PROD_UUID=$(echo "Prod.xcconfig" | md5 | cut -c 1-24 | tr '[:lower:]' '[:upper:]')

    log_info "Adding xcconfig file references..."

    # Find the PBXFileReference section and add xcconfig references
    # This is complex - we'll use a simpler approach: ruby script or manual guidance

    log_warning "⚠️  Manual step required: Add xcconfig files to Xcode project"
    log_info "Run: open $XCODEPROJ"
    log_info "Then: File → Add Files → Select all .xcconfig files"
    log_info ""
    log_info "Or run this script with --auto flag to use ruby automation"
}

# ============================================
# Step 4: Create/Update Build Configurations
# ============================================

configure_build_configurations() {
    log_step "Configuring build configurations..."

    # This requires complex project.pbxproj manipulation
    # For now, provide manual instructions

    cat <<'EOF'

📋 Manual Configuration Steps (one-time setup):

1. Open Xcode project:
   open ios/StackMapNative.xcodeproj

2. Select project in navigator → Select "StackMapNative" project → Info tab

3. Under "Configurations", duplicate existing configurations:
   - Duplicate "Debug" → Rename to "Qual"
   - Duplicate "Release" → Rename to "Stage"
   - Duplicate "Release" → Rename to "Beta"
   - Rename "Release" to "Prod"

4. For each configuration, set the xcconfig file:
   - Qual → Based on: Qual.xcconfig
   - Stage → Based on: Stage.xcconfig
   - Beta → Based on: Beta.xcconfig
   - Prod → Based on: Prod.xcconfig

5. Select "StackMapNative" target → Build Settings
   - Search for "Product Bundle Identifier"
   - Verify it shows $(PRODUCT_BUNDLE_IDENTIFIER) for all configurations

6. Search for "Product Name"
   - Verify it shows $(PRODUCT_NAME) for all configurations

✅ After completing these steps, run deployment scripts normally.
   They will automatically use the correct configuration.

EOF

    log_info "Configuration instructions displayed above"
}

# ============================================
# Alternative: Automated Configuration with Ruby
# ============================================

configure_build_configurations_auto() {
    log_step "Automatically configuring build configurations with ruby..."

    # Create a ruby script to manipulate Xcode project
    local ruby_script="$IOS_DIR/configure_variants.rb"

    cat > "$ruby_script" << 'RUBY_EOF'
#!/usr/bin/env ruby

require 'xcodeproj'

project_path = 'StackMapNative.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Get the project and target
target = project.targets.first
project_obj = project.root_object

puts "📱 Configuring build configurations for: #{target.name}"

# Configuration names and their xcconfig files
configs = {
  'Qual' => 'Qual.xcconfig',
  'Stage' => 'Stage.xcconfig',
  'Beta' => 'Beta.xcconfig',
  'Prod' => 'Prod.xcconfig'
}

# Get build configuration list
config_list = project_obj.build_configuration_list

# Create new configurations
configs.each do |config_name, xcconfig_file|
  # Check if configuration already exists
  existing_config = config_list.build_configurations.find { |c| c.name == config_name }

  if existing_config
    puts "✓ Configuration '#{config_name}' already exists"
    config = existing_config
  else
    # Create new configuration based on Release
    base_config = config_list.build_configurations.find { |c| c.name == 'Release' }

    # Add new configuration
    config = project.new(Xcodeproj::Project::Object::XCBuildConfiguration)
    config.name = config_name

    # Copy settings from Release
    if base_config
      config.build_settings = base_config.build_settings.dup
    end

    config_list.build_configurations << config

    puts "✅ Created configuration: #{config_name}"
  end

  # Find xcconfig file reference
  xcconfig_ref = project.files.find { |f| f.path == xcconfig_file }

  unless xcconfig_ref
    # Add xcconfig file to project
    xcconfig_ref = project.new_file(xcconfig_file)
    puts "📄 Added xcconfig file: #{xcconfig_file}"
  end

  # Assign xcconfig to configuration
  config.base_configuration_reference = xcconfig_ref

  puts "✅ Linked #{config_name} → #{xcconfig_file}"
end

# Also update target configurations
target.build_configuration_list.build_configurations.each do |target_config|
  config_name = target_config.name

  # Create corresponding target config if needed
  if configs.keys.include?(config_name)
    xcconfig_file = configs[config_name]
    xcconfig_ref = project.files.find { |f| f.path == xcconfig_file }

    if xcconfig_ref
      target_config.base_configuration_reference = xcconfig_ref
      puts "✅ Linked target config #{config_name} → #{xcconfig_file}"
    end
  end
end

# Ensure target has all configurations
configs.each do |config_name, xcconfig_file|
  unless target.build_configuration_list.build_configurations.find { |c| c.name == config_name }
    # Create target configuration
    target_config = project.new(Xcodeproj::Project::Object::XCBuildConfiguration)
    target_config.name = config_name

    # Copy from base if exists
    base_config = target.build_configuration_list.build_configurations.find { |c| c.name == 'Release' }
    if base_config
      target_config.build_settings = base_config.build_settings.dup
    end

    # Link xcconfig
    xcconfig_ref = project.files.find { |f| f.path == xcconfig_file }
    target_config.base_configuration_reference = xcconfig_ref if xcconfig_ref

    target.build_configuration_list.build_configurations << target_config
    puts "✅ Added target configuration: #{config_name}"
  end
end

# Save project
project.save

puts ""
puts "🎉 Build configurations setup complete!"
puts ""
puts "Configurations created:"
configs.keys.each do |name|
  puts "  • #{name}"
end

RUBY_EOF

    chmod +x "$ruby_script"

    # Check if xcodeproj gem is installed
    if ! gem list xcodeproj -i > /dev/null 2>&1; then
        log_error "❌ 'xcodeproj' gem not installed"
        log_info "Install with: gem install xcodeproj"
        log_info "Or run manual configuration (see above)"
        return 1
    fi

    # Run ruby script
    log_info "Running configuration script..."
    cd "$IOS_DIR" && ruby "$ruby_script"

    if [ $? -eq 0 ]; then
        log_success "✅ Automated configuration complete!"
        rm "$ruby_script"
    else
        log_error "❌ Automated configuration failed"
        log_info "Fallback to manual configuration (see above)"
        return 1
    fi
}

# ============================================
# Main Execution
# ============================================

main() {
    log_header "🍎 iOS Build Variant Configuration"

    # Parse arguments
    local auto_mode=false
    if [ "$1" = "--auto" ]; then
        auto_mode=true
    fi

    # Step 1: Configure Info.plist
    configure_info_plist

    # Step 2: Verify xcconfig files
    verify_xcconfig_files

    # Step 3 & 4: Configure Xcode project
    if [ "$auto_mode" = true ]; then
        configure_build_configurations_auto
    else
        configure_build_configurations
    fi

    echo ""
    log_success "🎉 iOS variant configuration complete!"
    echo ""
    log_info "Next steps:"
    log_info "1. If manual setup shown above, complete those steps in Xcode"
    log_info "2. Run deployment: ./scripts/deploy.sh qual --ios"
    log_info "3. Verify app installs with 'StackMap QUAL' name"
}

# Run main function
main "$@"
