import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  Platform,
} from 'react-native';
import { IconButton } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import agent from '@/agent';

const WEEK_DAYS = [
  { index: 0, label: 'Sun', fullLabel: 'Sunday' },
  { index: 1, label: 'Mon', fullLabel: 'Monday' },
  { index: 2, label: 'Tue', fullLabel: 'Tuesday' },
  { index: 3, label: 'Wed', fullLabel: 'Wednesday' },
  { index: 4, label: 'Thu', fullLabel: 'Thursday' },
  { index: 5, label: 'Fri', fullLabel: 'Friday' },
  { index: 6, label: 'Sat', fullLabel: 'Saturday' },
];

const RECURRENCE_TYPES = [
  { value: 4, label: 'Daily' },
  { value: 1, label: 'Weekly' },
  { value: 2, label: 'Monthly' },
  { value: 3, label: 'Annually' },
];

const TaskRecurringSection = ({
  taskData,
  projectId,
  onRefreshMainTaskData,
  onRefreshTaskData,
  style,
}) => {
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState(4);
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [recurrenceStartDate, setRecurrenceStartDate] = useState('');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [recurrenceDays, setRecurrenceDays] = useState([]);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [originalRecurringData, setOriginalRecurringData] = useState({
    isRecurring: false,
    recurrenceType: 4,
    recurrenceInterval: 1,
    recurrenceStartDate: '',
    recurrenceEndDate: '',
    recurrenceDays: [],
  });

  const formatDateForInput = (dateValue) => {
    if (!dateValue) return '';
    try {
      if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        return dateValue;
      }
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      return '';
    }
  };

  useEffect(() => {
    if (taskData) {
      const recurrent = taskData.recurrent !== undefined ? taskData.recurrent : 0;
      const isRecurringValue = recurrent !== 0 && recurrent !== 9;
      const recurrenceMeta = taskData.metas?.recurrence || taskData.recurrence;
      const recurrenceIntervalValue = recurrenceMeta?.repeat || 1;
      const recurrenceStartDateValue =
        recurrenceMeta?.repeat_year || recurrenceMeta?.start_date || '';
      const recurrenceEndDateValue =
        recurrenceMeta?.expire_after_date || recurrenceMeta?.expire_date || '';

      let recurrenceDaysArray = [];
      if (recurrenceMeta?.weekdays && Array.isArray(recurrenceMeta.weekdays)) {
        recurrenceDaysArray = recurrenceMeta.weekdays
          .filter(
            (day) =>
              day.checked === true ||
              day.checked === 'true' ||
              day.checked === 1 ||
              day.checked === '1'
          )
          .map((day) => parseInt(day.value, 10))
          .filter((day) => !isNaN(day));
      } else {
        const days = recurrenceMeta?.days || recurrenceMeta?.by_day || [];
        recurrenceDaysArray = Array.isArray(days) ? days.map((d) => parseInt(d, 10)) : [];
      }

      setIsRecurring(isRecurringValue);
      setRecurrenceType(recurrent || 4);
      setRecurrenceInterval(recurrenceIntervalValue);
      setRecurrenceStartDate(recurrenceStartDateValue);
      setRecurrenceEndDate(recurrenceEndDateValue);
      setRecurrenceDays(recurrenceDaysArray);
      setOriginalRecurringData({
        isRecurring: isRecurringValue,
        recurrenceType: recurrent || 4,
        recurrenceInterval: recurrenceIntervalValue,
        recurrenceStartDate: recurrenceStartDateValue,
        recurrenceEndDate: recurrenceEndDateValue,
        recurrenceDays: recurrenceDaysArray,
      });
    }
  }, [taskData]);

  const handleRecurringToggle = async (value) => {
    setIsRecurring(value);
    if (!value) {
      await handleDisableRecurring();
      setRecurrenceType(4);
      setRecurrenceInterval(1);
      setRecurrenceStartDate('');
      setRecurrenceEndDate('');
      setRecurrenceDays([]);
    }
  };

  const handleRecurrenceTypeChange = (newType) => {
    const typeValue = parseInt(newType, 10);
    setRecurrenceType(typeValue);
    setShowTypePicker(false);
    if (typeValue !== 1) {
      setRecurrenceDays([]);
    }
  };

  const handleRecurrenceStartDateChange = (event, date) => {
    if (Platform.OS === 'android') setShowStartDatePicker(false);
    if (date) {
      setRecurrenceStartDate(formatDateForInput(date));
    }
  };

  const handleRecurrenceEndDateChange = (event, date) => {
    if (Platform.OS === 'android') setShowEndDatePicker(false);
    if (date) {
      setRecurrenceEndDate(formatDateForInput(date));
    }
  };

  const handleRecurrenceDayToggle = (dayIndex) => {
    const newDays = recurrenceDays.includes(dayIndex)
      ? recurrenceDays.filter((d) => d !== dayIndex)
      : [...recurrenceDays, dayIndex].sort();
    setRecurrenceDays(newDays);
  };

  const hasRecurringChanges = () => {
    const currentRecurrent = isRecurring ? recurrenceType : 0;
    return (
      isRecurring !== originalRecurringData.isRecurring ||
      currentRecurrent !== originalRecurringData.recurrenceType ||
      recurrenceInterval !== originalRecurringData.recurrenceInterval ||
      recurrenceStartDate !== originalRecurringData.recurrenceStartDate ||
      recurrenceEndDate !== originalRecurringData.recurrenceEndDate ||
      JSON.stringify([...recurrenceDays].sort()) !==
        JSON.stringify([...originalRecurringData.recurrenceDays].sort())
    );
  };

  const handleDisableRecurring = async () => {
    const currentTask = taskData;
    if (!currentTask?.id || !projectId) return;
    try {
      await agent.Tasks.updateTask(projectId, currentTask.id, {
        recurrent: 0,
        action: 'disable_recurring',
      });
      if (typeof onRefreshTaskData === 'function') {
        await onRefreshTaskData();
      }
    } catch (err) {
      console.error('Failed to disable recurring:', err);
    }
  };

  const handleSaveRecurring = async () => {
    const currentTask = taskData;
    if (!currentTask?.id || !projectId) return;

    const recurrentValue = isRecurring ? recurrenceType : 0;
    const updateData = {
      recurrent: recurrentValue,
      action: 'update_recurring',
    };

    if (isRecurring) {
      updateData.recurrence_interval = recurrenceInterval;
      if (recurrenceStartDate) updateData.recurrence_start_date = recurrenceStartDate;
      if (recurrenceEndDate) updateData.recurrence_end_date = recurrenceEndDate;
      if (recurrenceType === 1 && recurrenceDays.length > 0) {
        updateData.recurrence_days = recurrenceDays;
      }
    }

    try {
      await agent.Tasks.updateTask(projectId, currentTask.id, updateData);
      setOriginalRecurringData({
        isRecurring,
        recurrenceType: recurrentValue,
        recurrenceInterval,
        recurrenceStartDate,
        recurrenceEndDate,
        recurrenceDays: [...recurrenceDays],
      });
      if (typeof onRefreshMainTaskData === 'function') {
        onRefreshMainTaskData(currentTask?.task_list_id);
      }
      if (typeof onRefreshTaskData === 'function') {
        await onRefreshTaskData();
      }
    } catch (err) {
      console.error('Failed to save recurring:', err);
    }
  };

  const currentTypeLabel =
    RECURRENCE_TYPES.find((t) => t.value === recurrenceType)?.label || 'Daily';
  const intervalLabel =
    recurrenceType === 4
      ? 'day(s)'
      : recurrenceType === 1
      ? 'week(s)'
      : recurrenceType === 2
      ? 'month(s)'
      : 'year(s)';

  return (
    <View style={[styles.section, style]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View>
            <Text style={styles.label}>Recurring</Text>
          </View>
        </View>
        <View style={styles.toggleRow}>
          {/* <Text style={styles.toggleLabel}>{isRecurring ? 'On' : 'Off'}</Text> */}
          <Switch
            value={isRecurring}
            onValueChange={handleRecurringToggle}
            trackColor={{ false: '#dadce0', true: '#ffb77a' }}
            thumbColor={isRecurring ? '#ff7a08' : '#ffffff'}
          />
        </View>
      </View>

      {isRecurring && (
        <View style={styles.options}>
          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Repeat</Text>
            <TouchableOpacity
              style={styles.select}
              onPress={() => setShowTypePicker(!showTypePicker)}
            >
              <Text style={styles.selectText}>{currentTypeLabel}</Text>
              <IconButton icon="chevron-down" size={18} style={styles.selectIcon} />
            </TouchableOpacity>
          </View>
          {showTypePicker && (
            <View style={styles.pickerList}>
              {RECURRENCE_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[
                    styles.pickerItem,
                    recurrenceType === t.value && styles.pickerItemActive,
                  ]}
                  onPress={() => handleRecurrenceTypeChange(t.value)}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      recurrenceType === t.value && styles.pickerItemTextActive,
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Every</Text>
            <View style={styles.intervalRow}>
              <TextInput
                style={styles.intervalInput}
                value={String(recurrenceInterval)}
                onChangeText={(t) => setRecurrenceInterval(parseInt(t, 10) || 1)}
                keyboardType="number-pad"
              />
              <Text style={styles.intervalLabel}>{intervalLabel}</Text>
            </View>
          </View>

          {recurrenceType === 1 && (
            <View style={styles.optionRow}>
              <Text style={styles.optionLabel}>Repeat on</Text>
              <View style={styles.daysRow}>
                {WEEK_DAYS.map((day) => {
                  const active = recurrenceDays.includes(day.index);
                  return (
                    <TouchableOpacity
                      key={day.index}
                      style={[
                        styles.dayBtn,
                        active && styles.dayBtnActive,
                      ]}
                      onPress={() => handleRecurrenceDayToggle(day.index)}
                    >
                      <Text
                        style={[
                          styles.dayBtnText,
                          active && styles.dayBtnTextActive,
                        ]}
                      >
                        {day.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Start date</Text>
            <TouchableOpacity
              style={styles.dateValue}
              onPress={() => setShowStartDatePicker(true)}
            >
              <IconButton icon="calendar" size={18} style={styles.dateIcon} />
              <Text style={styles.dateValueText}>
                {recurrenceStartDate
                  ? new Date(recurrenceStartDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'No start date'}
              </Text>
            </TouchableOpacity>
          </View>
          {showStartDatePicker && (
            <DateTimePicker
              value={
                recurrenceStartDate
                  ? new Date(recurrenceStartDate)
                  : new Date()
              }
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleRecurrenceStartDateChange}
              onTouchCancel={() => setShowStartDatePicker(false)}
            />
          )}

          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>End date</Text>
            <TouchableOpacity
              style={styles.dateValue}
              onPress={() => setShowEndDatePicker(true)}
            >
              <IconButton icon="calendar" size={18} style={styles.dateIcon} />
              <Text style={styles.dateValueText}>
                {recurrenceEndDate
                  ? new Date(recurrenceEndDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'No end date'}
              </Text>
            </TouchableOpacity>
          </View>
          {showEndDatePicker && (
            <DateTimePicker
              value={
                recurrenceEndDate ? new Date(recurrenceEndDate) : new Date()
              }
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleRecurrenceEndDateChange}
              onTouchCancel={() => setShowEndDatePicker(false)}
            />
          )}

          {hasRecurringChanges() && (
            <View style={styles.saveRow}>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveRecurring}
              >
                <IconButton icon="check" size={16} color="#fff" />
                <Text style={styles.saveBtnText}>Save changes</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#fff8f5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffe1cc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#202124',
  },
  labelSub: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#ff7a08',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#5f6368',
  },
  options: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ffe1cc',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5f6368',
    minWidth: 80,
  },
  select: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ffddc2',
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
  selectText: {
    fontSize: 14,
    color: '#202124',
    fontWeight: '500',
  },
  selectIcon: {
    margin: 0,
  },
  pickerList: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e8eaed',
    overflow: 'hidden',
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  pickerItemActive: {
    backgroundColor: '#fff3e6',
  },
  pickerItemText: {
    fontSize: 14,
    color: '#202124',
  },
  pickerItemTextActive: {
    color: '#ff7a08',
    fontWeight: '600',
  },
  intervalRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  intervalInput: {
    width: 80,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e8eaed',
    borderRadius: 8,
    fontSize: 14,
    color: '#202124',
    backgroundColor: '#fff',
  },
  intervalLabel: {
    fontSize: 14,
    color: '#5f6368',
  },
  daysRow: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayBtn: {
    minWidth: 40,
    height: 40,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ffe1cc',
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBtnActive: {
    backgroundColor: '#ff7a08',
    borderColor: '#ff7a08',
  },
  dayBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#5f6368',
  },
  dayBtnTextActive: {
    color: '#fff',
  },
  dateValue: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ffddc2',
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  dateIcon: {
    margin: 0,
  },
  dateValueText: {
    fontSize: 14,
    color: '#202124',
  },
  divider: {
    height: 1,
    backgroundColor: '#ffe1cc',
    marginVertical: 4,
  },
  saveRow: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e8eaed',
    alignItems: 'flex-end',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#ff7a08',
    borderRadius: 8,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
});

export default TaskRecurringSection;
