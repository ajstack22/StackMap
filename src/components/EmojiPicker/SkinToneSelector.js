import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '../Typography';
import { SKIN_TONE_MODIFIERS, applySkinTone } from './skinToneUtils';
import { styles } from './styles';

const SkinToneSelector = ({
  selectedSkinTone,
  onSelectSkinTone,
}) => (
  <View style={styles.skinToneContainer}>
    <View style={styles.skinToneOptions}>
      <TouchableOpacity
        style={[
          styles.skinToneOption,
          !selectedSkinTone && styles.selectedSkinTone,
        ]}
        onPress={() => onSelectSkinTone(null)}
      >
        <Text style={styles.skinToneEmoji}>👋</Text>
      </TouchableOpacity>
      {Object.entries(SKIN_TONE_MODIFIERS)
        .filter(([key]) => key !== 'none')
        .map(([key, modifier]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.skinToneOption,
              selectedSkinTone === modifier && styles.selectedSkinTone,
            ]}
            onPress={() => onSelectSkinTone(modifier)}
          >
            <Text style={styles.skinToneEmoji}>
              {applySkinTone('👋', modifier)}
            </Text>
          </TouchableOpacity>
        ))}
    </View>
  </View>
);

export default SkinToneSelector;