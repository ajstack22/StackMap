import React from 'react';
import { View, TouchableOpacity, Platform } from 'react-native';
import { Text } from '../../../Typography';
import Logo from '../../../Logo/Logo';
import { BUILD_VERSION } from '../../../../utils/version';
import { styles } from '../styles';
import { isTablet } from '../helpers';

const screenWidth = isTablet() ? 768 : 400;

const WelcomeScreen = ({
  theme,
  onNewUser,
  onExistingUser,
  onShowPrivacy,
  onShowSupport,
}) => (
  <View style={styles.stepContainer}>
    <>
      <View style={styles.logoSection}>
        <Logo size={screenWidth >= 768 ? 100 : 80} theme={theme} color={theme.primary} />
        <Text style={styles.logoText}>StackMap</Text>
        <Text style={styles.tagline}>Better days through shared understanding</Text>
      </View>

      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.primary }]}
          onPress={onNewUser}
          accessibilityLabel="I'm new to StackMap - Get started with a new account"
        >
          <Text style={styles.buttonText}>I'm new to StackMap</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={onExistingUser}
          accessibilityLabel="I already use StackMap - Continue with existing account"
        >
          <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>
            I already use StackMap
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footerLinks}>
        <TouchableOpacity
          style={styles.footerLink}
          onPress={() => onShowPrivacy?.()}
        >
          <Text style={[styles.footerLinkText, { color: theme.primary }]}>
            Privacy Policy
          </Text>
        </TouchableOpacity>

        {Platform.OS === 'web' && !!onShowSupport && (
          <>
            <Text style={styles.footerSeparator}>•</Text>
            <TouchableOpacity
              style={styles.footerLink}
              onPress={() => onShowSupport?.()}
            >
              <Text style={[styles.footerLinkText, { color: theme.primary }]}>
                Support StackMap
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>v{BUILD_VERSION}</Text>
      </View>
    </>
  </View>
);

export default WelcomeScreen;