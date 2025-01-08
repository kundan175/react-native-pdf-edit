import React from 'react';
import {View, TouchableOpacity, Text, StyleSheet} from 'react-native';
import {colors, typography, spacing, shadows} from '../styles/theme';

interface PDFToolbarProps {
  onSave: () => void;
  onCancel: () => void;
  onAddText: () => void;
  onAddImage: () => void;
  isEditing: boolean;
}

const PDFToolbar: React.FC<PDFToolbarProps> = ({
  onSave,
  onCancel,
  onAddText,
  onAddImage,
  isEditing,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.toolGroup}>
        <TouchableOpacity style={styles.toolButton} onPress={onAddText}>
          <Text style={styles.toolButtonText}>Add Text</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolButton} onPress={onAddImage}>
          <Text style={styles.toolButtonText}>Add Image</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.actionGroup}>
        {isEditing ? (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={onSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray3,
    ...shadows.small,
  },
  toolGroup: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionGroup: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  toolButton: {
    padding: spacing.sm,
    backgroundColor: colors.gray3,
    borderRadius: 6,
  },
  toolButtonText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '500',
    color: colors.text,
  },
  actionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 6,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  cancelButton: {
    backgroundColor: colors.gray3,
  },
  saveButtonText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    color: colors.background,
  },
  cancelButtonText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    color: colors.text,
  },
});

export default PDFToolbar;
