import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { styles } from './styles';

const ReorderModal = ({
  visible,
  onClose,
  theme,
  reorderingActivity,
  activities,
  newPosition,
  setNewPosition,
  onReorder,
}) => {
  const handleCancel = () => {
    onClose();
    setNewPosition('');
  };

  const isReorderDisabled = !newPosition || newPosition === reorderingActivity?.currentPosition.toString();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <View style={styles.reorderModalOverlay}>
        <View style={[styles.reorderModalContent, { backgroundColor: theme.light }]}>
          <Text style={[styles.reorderModalTitle, { color: theme.primary }]}>
            Move Activity
          </Text>
          
          {reorderingActivity && (
            <View style={styles.reorderActivityPreview}>
              <Text style={styles.reorderActivityEmoji}>
                {reorderingActivity.activity.emoji || '🎯'}
              </Text>
              <Text style={styles.reorderActivityText}>
                {reorderingActivity.activity.text || reorderingActivity.activity.title || ''}
              </Text>
            </View>
          )}
          
          <Text style={[styles.reorderModalLabel, { color: '#000' }]}>
            Tap new position:
          </Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.positionSelector}
            contentContainerStyle={styles.positionSelectorContent}
          >
            {activities.map((_, index) => {
              const position = index + 1;
              const isCurrentPosition = position === reorderingActivity?.currentPosition;
              const isSelectedPosition = position === parseInt(newPosition);
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.positionButton,
                    isCurrentPosition && [styles.positionButtonCurrent, { borderColor: theme.primary }],
                    isSelectedPosition && [styles.positionButtonSelected, { backgroundColor: theme.primary }]
                  ]}
                  onPress={() => setNewPosition(position.toString())}
                >
                  <Text style={[
                    styles.positionButtonText,
                    isCurrentPosition && { color: theme.primary },
                    isSelectedPosition && { color: 'white' }
                  ]}>
                    {position}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          
          {newPosition && (
            <View style={styles.positionPreview}>
              <Text style={styles.positionPreviewText}>
                Move from position {reorderingActivity?.currentPosition} → {newPosition}
              </Text>
            </View>
          )}
          
          <View style={styles.reorderModalButtons}>
            <TouchableOpacity
              style={[styles.reorderModalButton, styles.reorderModalButtonCancel]}
              onPress={handleCancel}
            >
              <Text style={styles.reorderModalButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.reorderModalButton, 
                { backgroundColor: theme.primary },
                isReorderDisabled && { backgroundColor: '#ccc' }
              ]}
              onPress={onReorder}
              disabled={isReorderDisabled}
            >
              <Text style={[styles.reorderModalButtonText, { color: 'white' }]}>Move</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default React.memo(ReorderModal);