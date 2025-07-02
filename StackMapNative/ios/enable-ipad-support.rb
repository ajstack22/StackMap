#!/usr/bin/env ruby

require 'xcodeproj'

# Open the project
project_path = './StackMapNative.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Find the main target
target = project.targets.find { |t| t.name == 'StackMapNative' }

if target
  # Update build configurations
  target.build_configurations.each do |config|
    # Set to support both iPhone and iPad
    config.build_settings['TARGETED_DEVICE_FAMILY'] = '1,2'
    
    # Enable iPad multitasking
    config.build_settings['SUPPORTS_MACCATALYST'] = 'NO'
    config.build_settings['SUPPORTS_MAC_DESIGNED_FOR_IPHONE_IPAD'] = 'YES'
  end
  
  puts "✅ Updated StackMapNative to support iPad"
  
  # Save the project
  project.save
else
  puts "❌ Could not find StackMapNative target"
end