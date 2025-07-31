import React, { useState, useEffect } from 'react';
import TabbedModal from '../../TabbedModal';
import { TabContent } from '../../TabbedModal';
import UsersTabContent from './UsersTabContent';
import PINTabContent from './PINTabContent';

const AccessModal = ({
  visible,
  onClose,
  theme,
  users,
  currentUser,
  onAddUser,
  onSelectUser,
  onDeleteUser,
  hasSecurePin,
  showToast,
  onSetPin,
  onRemovePin,
  onVerifyPin,
  initialTab = 0,
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);

  // Reset to initial tab when modal opens
  useEffect(() => {
    if (visible) {
      setActiveTab(initialTab);
    }
  }, [visible, initialTab]);

  const tabs = [
    { id: 'users', label: 'Users', icon: 'group' },
    { id: 'pin', label: 'PIN', icon: 'lock' },
  ];

  return (
    <TabbedModal
      visible={visible}
      onClose={onClose}
      theme={theme}
      title="Access Management"
      icon="security"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      <TabContent isActive={activeTab === 0} modalVisible={visible}>
        <UsersTabContent
          theme={theme}
          users={users}
          currentUser={currentUser}
          onAddUser={onAddUser}
          onSelectUser={onSelectUser}
          onDeleteUser={onDeleteUser}
          showToast={showToast}
          loading={loading}
          setLoading={setLoading}
        />
      </TabContent>
      
      <TabContent isActive={activeTab === 1} modalVisible={visible}>
        <PINTabContent
          theme={theme}
          hasSecurePin={hasSecurePin}
          onSetPin={onSetPin}
          onRemovePin={onRemovePin}
          onVerifyPin={onVerifyPin}
          showToast={showToast}
          loading={loading}
          setLoading={setLoading}
        />
      </TabContent>
    </TabbedModal>
  );
};

export default AccessModal;