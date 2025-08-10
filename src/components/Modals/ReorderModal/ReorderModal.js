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
          {/* Header with close button */}
          <View style={styles.modalHeader}>
            <Text style={[styles.reorderModalTitle, { color: '#000' }]}>
              Move Activity
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCancel}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          {/* Main panel */}
          <View style={styles.formPanel}>
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
            
            {/* Divider */}
            <View style={styles.divider} />
            
            <View style={styles.positionSection}>
              <Text style={[styles.reorderModalLabel, { color: '#000' }]}>
                Select new position:
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
            </View>
            
            {/* Divider */}
            <View style={styles.divider} />
            
            {/* Action button within the panel */}
            <TouchableOpacity
              style={[
                styles.actionButton, 
                { backgroundColor: theme.primary },
                isReorderDisabled && { backgroundColor: '#ccc' }
              ]}
              onPress={onReorder}
              disabled={isReorderDisabled}
            >
              <Text style={[styles.actionButtonText, { color: 'white' }]}>Move to Position {newPosition || '?'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default React.memo(ReorderModal);