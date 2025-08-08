import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import TabbedModal from '../../TabbedModal';
import { TabContent } from '../../TabbedModal';
import CompleteTabContent from './CompleteTabContent';
import PlanTabContent from './PlanTabContent';
import { styles } from './styles';

const DayManagementModal = ({
  visible,
  onClose,
  theme,
  activities = [],
  completedCount = 0,
  totalCount = 0,
  onCompleteDay,
  showToast,
  users = {},
  currentUser,
  initialActiveTab = 0,
  dayMode,
  setDayMode,
  onSelectUserDay,
}) => {
  const [activeTab, setActiveTab] = useState(initialActiveTab);
  const [loading, setLoading] = useState(false);

  // Reset activeTab when modal opens with a different tab
  useEffect(() => {
    if (visible) {
      setActiveTab(initialActiveTab);
    }
  }, [visible, initialActiveTab]);

  const tabs = [
    { id: 'plan', label: 'Plan', icon: 'event' },
    { id: 'complete', label: 'Complete', icon: 'check-circle' },
  ];

  const handleCompleteDay = async () => {
    setLoading(true);
    try {
      await onCompleteDay();
      showToast({ message: 'Day completed successfully!' });
      onClose();
    } catch (error) {
      showToast({ message: 'Failed to complete day', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <TabbedModal
      visible={visible}
      onClose={onClose}
      theme={theme}
      title="Day"
      icon="event"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      <TabContent isActive={activeTab === 0} modalVisible={visible}>
        <PlanTabContent
          theme={theme}
          users={users}
          currentUser={currentUser}
          showToast={showToast}
          dayMode={dayMode}
          setDayMode={setDayMode}
          onSelectUserDay={onSelectUserDay}
          onClose={onClose}
        />
      </TabContent>
      <TabContent isActive={activeTab === 1} modalVisible={visible}>
        <CompleteTabContent
          theme={theme}
          activities={activities}
          onCompleteDay={handleCompleteDay}
          loading={loading}
          showToast={showToast}
          currentUser={currentUser}
          users={users}
        />
      </TabContent>
    </TabbedModal>
  );
};

export default React.memo(DayManagementModal);