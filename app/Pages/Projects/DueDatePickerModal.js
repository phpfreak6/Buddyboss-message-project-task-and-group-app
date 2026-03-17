import React from 'react';
import DatePicker from 'react-native-date-picker';

/**
 * Reusable due date picker modal using react-native-date-picker (third-party).
 * Props: visible, onClose, value (Date or date string), onChange(event, date), minDate?, maxDate?
 * On confirm: calls onChange({ type: 'set' }, date) then onClose().
 */
const DueDatePickerModal = ({
  visible,
  onClose,
  value,
  onChange,
  minDate,
  maxDate,
}) => {
  const dateValue = value ? new Date(value) : new Date();

  return (
    <DatePicker
      modal
      open={visible}
      date={dateValue}
      mode="date"
      minimumDate={minDate}
      maximumDate={maxDate}
      onConfirm={(date) => {
        onChange?.({ type: 'set' }, date);
        onClose();
      }}
      onCancel={() => onClose()}
      theme="light"
      confirmText="Done"
      cancelText="Cancel"
    />
  );
};

export default DueDatePickerModal;
