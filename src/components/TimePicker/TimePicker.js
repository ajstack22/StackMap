import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { TYPOGRAPHY, SPACING, RADIUS } from '../../constants';

const TimePicker = ({
  value = '',
  onChange,
  placeholder = 'Select time',
  theme,
  error,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState('12');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedPeriod, setSelectedPeriod] = useState('PM');

  // Parse initial value
  useEffect(() => {
    if (value) {
      const [time, period] = value.split(' ');
      if (time) {
        const [hour, minute] = time.split(':');
        if (hour && minute) {
          setSelectedHour(hour);
          setSelectedMinute(minute);
          setSelectedPeriod(period || 'PM');
        }
      }
    }
  }, [value]);

  const hours = Array.from({ length: 12 }, (_, i) => {
    const hour = i + 1;
    return hour.toString().padStart(2, '0');
  });

  const minutes = Array.from({ length: 60 }, (_, i) => 
    i.toString().padStart(2, '0')
  );

  const handleDone = () => {
    const timeString = `${selectedHour}:${selectedMinute} ${selectedPeriod}`;
    onChange(timeString);
    setShowPicker(false);
  };

  const handleClear = () => {
    onChange('');
    setShowPicker(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.input,
          error && styles.inputError,
          { borderColor: error ? '#d32f2f' : '#E0E0E0' }
        ]}
        onPress={() => setShowPicker(true)}
      >
        <Text style={[
          styles.inputText,
          !value && styles.placeholder
        ]}>
          {value || placeholder}
        </Text>
        <Icon name="access-time" size={20} color="#666" />
      </TouchableOpacity>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPicker(false)}
        >
          <View style={[styles.pickerContainer, { backgroundColor: theme.light }]}>
            <View style={[styles.pickerHeader, { backgroundColor: theme.primary }]}>
              <Text style={styles.pickerTitle}>Select Time</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Icon name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.pickerContent}>
              <View style={styles.pickerRow}>
                {/* Hour Picker */}
                <View style={styles.pickerColumn}>
                  <Text style={styles.columnLabel}>Hour</Text>
                  <ScrollView
                    style={styles.scrollColumn}
                    showsVerticalScrollIndicator={false}
                  >
                    {hours.map(hour => (
                      <TouchableOpacity
                        key={hour}
                        style={[
                          styles.pickerItem,
                          selectedHour === hour && styles.pickerItemSelected,
                          selectedHour === hour && { backgroundColor: theme.primary + '20' }
                        ]}
                        onPress={() => setSelectedHour(hour)}
                      >
                        <Text style={[
                          styles.pickerItemText,
                          selectedHour === hour && styles.pickerItemTextSelected,
                          selectedHour === hour && { color: theme.primary }
                        ]}>
                          {hour}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Minute Picker */}
                <View style={styles.pickerColumn}>
                  <Text style={styles.columnLabel}>Minute</Text>
                  <ScrollView
                    style={styles.scrollColumn}
                    showsVerticalScrollIndicator={false}
                  >
                    {minutes.map(minute => (
                      <TouchableOpacity
                        key={minute}
                        style={[
                          styles.pickerItem,
                          selectedMinute === minute && styles.pickerItemSelected,
                          selectedMinute === minute && { backgroundColor: theme.primary + '20' }
                        ]}
                        onPress={() => setSelectedMinute(minute)}
                      >
                        <Text style={[
                          styles.pickerItemText,
                          selectedMinute === minute && styles.pickerItemTextSelected,
                          selectedMinute === minute && { color: theme.primary }
                        ]}>
                          {minute}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* AM/PM Picker */}
                <View style={styles.pickerColumn}>
                  <Text style={styles.columnLabel}>Period</Text>
                  <View style={styles.periodColumn}>
                    {['AM', 'PM'].map(period => (
                      <TouchableOpacity
                        key={period}
                        style={[
                          styles.periodItem,
                          selectedPeriod === period && styles.periodItemSelected,
                          selectedPeriod === period && { backgroundColor: theme.primary }
                        ]}
                        onPress={() => setSelectedPeriod(period)}
                      >
                        <Text style={[
                          styles.periodItemText,
                          selectedPeriod === period && styles.periodItemTextSelected
                        ]}>
                          {period}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Preview */}
              <View style={styles.preview}>
                <Text style={styles.previewLabel}>Selected Time</Text>
                <Text style={styles.previewTime}>
                  {selectedHour}:{selectedMinute} {selectedPeriod}
                </Text>
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.button, styles.clearButton]}
                  onPress={handleClear}
                >
                  <Text style={styles.clearButtonText}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.doneButton, { backgroundColor: theme.primary }]}
                  onPress={handleDone}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.medium,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    minHeight: 48,
  },
  inputError: {
    borderColor: '#d32f2f',
  },
  inputText: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000',
    flex: 1,
  },
  placeholder: {
    color: '#999',
  },
  errorText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#d32f2f',
    marginTop: SPACING.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    borderTopLeftRadius: RADIUS.large,
    borderTopRightRadius: RADIUS.large,
    maxHeight: '80%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderTopLeftRadius: RADIUS.large,
    borderTopRightRadius: RADIUS.large,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: Platform.OS === 'ios' ? '700' : '800',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: 'white',
  },
  pickerContent: {
    padding: SPACING.md,
  },
  pickerRow: {
    flexDirection: 'row',
    height: 200,
    marginBottom: SPACING.md,
  },
  pickerColumn: {
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
  columnLabel: {
    fontSize: 14,
    fontWeight: Platform.OS === 'ios' ? '600' : '700',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: '#666',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  scrollColumn: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: RADIUS.medium,
  },
  pickerItem: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
  },
  pickerItemSelected: {
    borderRadius: RADIUS.small,
    marginHorizontal: SPACING.xs,
  },
  pickerItemText: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#666',
  },
  pickerItemTextSelected: {
    fontWeight: Platform.OS === 'ios' ? '600' : '700',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  periodColumn: {
    flex: 1,
    justifyContent: 'center',
    gap: SPACING.md,
  },
  periodItem: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderRadius: RADIUS.medium,
    backgroundColor: '#f5f5f5',
  },
  periodItemSelected: {},
  periodItemText: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#666',
  },
  periodItemTextSelected: {
    color: 'white',
    fontWeight: Platform.OS === 'ios' ? '600' : '700',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  preview: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    backgroundColor: '#f5f5f5',
    borderRadius: RADIUS.medium,
    marginBottom: SPACING.md,
  },
  previewLabel: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#666',
    marginBottom: SPACING.xs,
  },
  previewTime: {
    fontSize: 24,
    fontWeight: Platform.OS === 'ios' ? '700' : '800',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: '#000',
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  button: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.medium,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#f5f5f5',
  },
  clearButtonText: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#666',
  },
  doneButton: {},
  doneButtonText: {
    fontSize: 16,
    fontWeight: Platform.OS === 'ios' ? '600' : '700',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: 'white',
  },
});

export default TimePicker;