import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import {
  updateCurrentUserImage,
  updateCurrentUserProfile,
} from '../api/users';
import { useAuth } from '../auth/AuthContext';
import AppButton from '../components/AppButton';
import AppCard from '../components/AppCard';
import { useAppTheme } from '../theme/ThemeContext';

const IMAGE_PICKER_OPTIONS = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.7,
  base64: true,
};

const SUPPORTED_IMAGE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/heic',
]);

const MAX_IMAGE_DATA_URI_LENGTH = 4 * 1024 * 1024;

function getUserLabel(user) {
  return user?.fullName || user?.displayName || user?.username || 'Customer';
}

function getUserInitial(userLabel) {
  return userLabel.trim().charAt(0).toUpperCase() || 'C';
}

function getPermissionMessage(permission, sourceName) {
  if (permission.canAskAgain === false) {
    return `${sourceName} permission is disabled. Enable it in device settings and try again.`;
  }

  return `${sourceName} permission is required to add a profile image.`;
}

export default function ProfileScreen() {
  const { token, updateUser, user } = useAuth();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme.colors), [theme.colors]);

  const [selectedImage, setSelectedImage] = useState(null);
  const [imageError, setImageError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [imageMenuVisible, setImageMenuVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [detailsError, setDetailsError] = useState('');
  const [detailsSuccess, setDetailsSuccess] = useState('');
  const [isDetailsSaving, setIsDetailsSaving] = useState(false);

  useEffect(() => {
    setFullName(user?.fullName || '');
    setPhone(user?.phone || '');
    setAddress(user?.address || '');
  }, [user?.address, user?.fullName, user?.phone]);

  const userLabel = getUserLabel(user);
  const currentImage =
    typeof user?.image === 'string' ? user.image.trim() : '';
  const previewImage = selectedImage?.uri || currentImage;

  function clearFeedback() {
    setImageError('');
    setSuccessMessage('');
  }

  function openImageMenu() {
    if (isSaving) {
      return;
    }

    clearFeedback();

    if (Platform.OS === 'web') {
      setImageMenuVisible(true);
      return;
    }

    Alert.alert(
      'Choose profile photo',
      'Choose how you want to add your image.',
      [
        {
          text: 'Upload from device',
          onPress: pickImageFromGallery,
        },
        {
          text: 'Take photo',
          onPress: takeImageWithCamera,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  }

  function closeImageMenu() {
    setImageMenuVisible(false);
  }

  function saveSelectedImage(result) {
    if (result.canceled) {
      return;
    }

    const asset = result.assets?.[0];

    if (!asset?.uri) {
      setImageError('The selected image could not be used. Please try again.');
      return;
    }

    const mimeType = (asset.mimeType || 'image/jpeg').toLowerCase();

    if (!SUPPORTED_IMAGE_TYPES.has(mimeType)) {
      setImageError('Choose a PNG, JPEG, WebP, or HEIC image.');
      return;
    }

    const dataUri = asset.base64
      ? `data:${mimeType};base64,${asset.base64}`
      : '';

    if (!dataUri) {
      setImageError(
        'The selected image could not be prepared for upload. Please choose it again.'
      );
      return;
    }

    if (dataUri.length > MAX_IMAGE_DATA_URI_LENGTH) {
      setImageError(
        'This image is too large. Choose a smaller image and try again.'
      );
      return;
    }

    setSelectedImage({
      dataUri,
      name: asset.fileName || 'Profile image',
      uri: asset.uri,
    });
    clearFeedback();
  }

  async function pickImageFromGallery() {
    setImageError('');

    try {
      if (Platform.OS === 'web') {
        closeImageMenu();
        const result = await ImagePicker.launchImageLibraryAsync(
          IMAGE_PICKER_OPTIONS
        );
        saveSelectedImage(result);
        return;
      }

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setImageError(getPermissionMessage(permission, 'Gallery'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync(
        IMAGE_PICKER_OPTIONS
      );

      saveSelectedImage(result);
    } catch (error) {
      setImageError(
        error?.message ||
          'Could not open the gallery. Please choose an image again.'
      );
    }
  }

  async function takeImageWithCamera() {
    setImageError('');

    if (Platform.OS === 'web') {
      closeImageMenu();
      setImageError(
        'Camera capture is available in Expo Go on a phone. Choose an image from your device instead.'
      );
      return;
    }

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        setImageError(getPermissionMessage(permission, 'Camera'));
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        ...IMAGE_PICKER_OPTIONS,
        cameraType: ImagePicker.CameraType.front,
      });

      saveSelectedImage(result);
    } catch (error) {
      setImageError(
        error?.message ||
          'Could not open the camera. Check its permission and try again.'
      );
    }
  }

  async function saveImage(image, message) {
    if (!token) {
      setImageError('You must be signed in to update your profile photo.');
      return;
    }

    setIsSaving(true);
    clearFeedback();

    try {
      const updatedUser = await updateCurrentUserImage(token, image);

      if (!updatedUser?.id) {
        throw new Error('The server returned an invalid profile response.');
      }

      await updateUser(updatedUser);
      setSelectedImage(null);
      setSuccessMessage(message);
    } catch (error) {
      setImageError(
        error?.message ||
          'Your profile image could not be updated. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleSaveImage() {
    if (!selectedImage?.dataUri) {
      return;
    }

    saveImage(selectedImage.dataUri, 'Profile photo updated.');
  }

  function handleRemoveImage() {
    saveImage('', 'Profile photo removed.');
  }

  function discardSelection() {
    setSelectedImage(null);
    clearFeedback();
  }

  async function handleSaveDetails() {
    if (!token) {
      setDetailsError('You must be signed in to update your profile.');
      return;
    }

    const profile = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      address: address.trim(),
    };

    if (!profile.fullName || !profile.phone || !profile.address) {
      setDetailsSuccess('');
      setDetailsError('Full name, phone number, and address are required.');
      return;
    }

    setIsDetailsSaving(true);
    setDetailsError('');
    setDetailsSuccess('');

    try {
      const updatedUser = await updateCurrentUserProfile(token, profile);

      if (!updatedUser?.id) {
        throw new Error('The server returned an invalid profile response.');
      }

      await updateUser(updatedUser);
      setDetailsSuccess('Profile details updated.');
    } catch (error) {
      setDetailsError(
        error?.message ||
          'Your profile details could not be updated. Please try again.'
      );
    } finally {
      setIsDetailsSaving(false);
    }
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>ACCOUNT</Text>
          <Text style={styles.title}>Your profile</Text>
          <Text style={styles.subtitle}>
            Keep your delivery details and profile photo up to date.
          </Text>
        </View>

        <AppCard style={styles.profileCard}>
          <View style={styles.summary}>
            {previewImage ? (
              <Image source={{ uri: previewImage }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitial}>
                  {getUserInitial(userLabel)}
                </Text>
              </View>
            )}

            <View style={styles.summaryDetails}>
              <Text numberOfLines={1} style={styles.userName}>
                {userLabel}
              </Text>
              <Text numberOfLines={1} style={styles.username}>
                @{user?.username || 'account'}
              </Text>
              <Text style={styles.role}>{user?.role || 'customer'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Account details</Text>
            <Text style={styles.sectionDescription}>
              Keep your name and delivery contact details accurate for future orders.
            </Text>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Full name</Text>
              <TextInput
                accessibilityLabel="Full name"
                autoComplete="name"
                editable={!isDetailsSaving}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor={theme.colors.textMuted}
                style={styles.input}
                value={fullName}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Phone number</Text>
              <TextInput
                accessibilityLabel="Phone number"
                autoComplete="tel"
                editable={!isDetailsSaving}
                keyboardType="phone-pad"
                onChangeText={setPhone}
                placeholder="Enter your phone number"
                placeholderTextColor={theme.colors.textMuted}
                style={styles.input}
                value={phone}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Address</Text>
              <TextInput
                accessibilityLabel="Address"
                autoComplete="street-address"
                editable={!isDetailsSaving}
                multiline
                numberOfLines={2}
                onChangeText={setAddress}
                placeholder="Enter your delivery address"
                placeholderTextColor={theme.colors.textMuted}
                style={[styles.input, styles.addressInput]}
                textAlignVertical="top"
                value={address}
              />
            </View>

            <AppButton
              loading={isDetailsSaving}
              onPress={handleSaveDetails}
              style={styles.saveDetailsButton}
              title="Save details"
            />

            {detailsError ? (
              <Text style={styles.errorMessage}>{detailsError}</Text>
            ) : null}

            {detailsSuccess ? (
              <Text accessibilityLiveRegion="polite" style={styles.successMessage}>
                {detailsSuccess}
              </Text>
            ) : null}
          </View>

          <View style={styles.divider} />

          <View style={styles.imageSection}>
            <Text style={styles.sectionTitle}>Profile photo</Text>
            <Text style={styles.sectionDescription}>
              Upload a PNG, JPEG, WebP, or HEIC image. Images that exceed the
              server limit are rejected before upload.
            </Text>

            <Pressable
              accessibilityLabel="Choose a profile image"
              accessibilityRole="button"
              disabled={isSaving}
              onPress={openImageMenu}
              style={({ pressed }) => [
                styles.imagePickerButton,
                pressed && !isSaving ? styles.pressed : null,
                isSaving ? styles.disabled : null,
              ]}
            >
              {previewImage ? (
                <Image source={{ uri: previewImage }} style={styles.imagePreview} />
              ) : (
                <View style={styles.imagePreviewPlaceholder}>
                  <Text style={styles.imagePreviewPlus}>+</Text>
                  <Text style={styles.imagePreviewText}>Add photo</Text>
                </View>
              )}
            </Pressable>

            {selectedImage ? (
              <Text style={styles.selectedFile}>
                Selected: {selectedImage.name}
              </Text>
            ) : null}

            <View style={styles.actions}>
              <AppButton
                disabled={isSaving}
                onPress={openImageMenu}
                title={previewImage ? 'Choose another photo' : 'Choose photo'}
                variant="secondary"
              />

              {selectedImage ? (
                <>
                  <AppButton
                    loading={isSaving}
                    onPress={handleSaveImage}
                    title="Save photo"
                  />
                  <AppButton
                    disabled={isSaving}
                    onPress={discardSelection}
                    title="Discard selection"
                    variant="text"
                  />
                </>
              ) : currentImage ? (
                <Pressable
                  accessibilityLabel="Remove profile photo"
                  accessibilityRole="button"
                  disabled={isSaving}
                  onPress={handleRemoveImage}
                  style={({ pressed }) => [
                    styles.removeButton,
                    pressed && !isSaving ? styles.pressed : null,
                    isSaving ? styles.disabled : null,
                  ]}
                >
                  <Text style={styles.removeButtonText}>
                    {isSaving ? 'Removing...' : 'Remove photo'}
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {imageError ? (
              <Text style={styles.errorMessage}>{imageError}</Text>
            ) : null}

            {successMessage ? (
              <Text accessibilityLiveRegion="polite" style={styles.successMessage}>
                {successMessage}
              </Text>
            ) : null}
          </View>
        </AppCard>
      </ScrollView>

      <Modal
        animationType="fade"
        onRequestClose={closeImageMenu}
        transparent
        visible={imageMenuVisible}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            accessibilityLabel="Close image picker menu"
            onPress={closeImageMenu}
            style={StyleSheet.absoluteFill}
          />

          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={styles.modalTitle}>Choose profile photo</Text>
            <Text style={styles.modalSubtitle}>
              Select an image from your device.
            </Text>

            <Pressable
              onPress={pickImageFromGallery}
              style={styles.modalActionButton}
            >
              <Text style={styles.modalActionText}>Upload from device</Text>
            </Pressable>

            <Pressable
              onPress={closeImageMenu}
              style={styles.modalCancelButton}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      flexGrow: 1,
      gap: 20,
      padding: 20,
      paddingBottom: 36,
    },
    heading: {
      gap: 7,
      paddingTop: 6,
    },
    eyebrow: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 1.1,
    },
    title: {
      color: colors.text,
      fontSize: 30,
      fontWeight: '800',
      letterSpacing: -0.7,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 15,
      lineHeight: 21,
      marginTop: 5,
    },
    profileCard: {
      gap: 24,
      padding: 22,
    },
    summary: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 16,
    },
    avatar: {
      borderRadius: 999,
      height: 92,
      width: 92,
    },
    avatarPlaceholder: {
      alignItems: 'center',
      backgroundColor: colors.primarySoft,
      justifyContent: 'center',
    },
    avatarInitial: {
      color: colors.primary,
      fontSize: 36,
      fontWeight: '800',
    },
    summaryDetails: {
      flex: 1,
      gap: 5,
    },
    userName: {
      color: colors.text,
      fontSize: 21,
      fontWeight: '800',
    },
    username: {
      color: colors.textMuted,
      fontSize: 14,
    },
    role: {
      alignSelf: 'flex-start',
      backgroundColor: colors.primarySoft,
      borderRadius: 999,
      color: colors.primary,
      fontSize: 12,
      fontWeight: '800',
      marginTop: 4,
      overflow: 'hidden',
      paddingHorizontal: 9,
      paddingVertical: 5,
      textTransform: 'capitalize',
    },
    divider: {
      backgroundColor: colors.border,
      height: 1,
    },
    detailsSection: {
      gap: 12,
    },
    field: {
      gap: 7,
    },
    fieldLabel: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '800',
    },
    input: {
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderRadius: 14,
      borderWidth: 1,
      color: colors.text,
      fontSize: 16,
      minHeight: 50,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    addressInput: {
      minHeight: 74,
    },
    saveDetailsButton: {
      alignSelf: 'flex-end',
      marginTop: 2,
    },
    imageSection: {
      gap: 12,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 19,
      fontWeight: '800',
    },
    sectionDescription: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
    },
    imagePickerButton: {
      alignSelf: 'flex-start',
      borderRadius: 18,
      overflow: 'hidden',
    },
    imagePreview: {
      borderRadius: 18,
      height: 152,
      width: 152,
    },
    imagePreviewPlaceholder: {
      alignItems: 'center',
      backgroundColor: colors.primarySoft,
      borderRadius: 18,
      height: 152,
      justifyContent: 'center',
      width: 152,
    },
    imagePreviewPlus: {
      color: colors.primary,
      fontSize: 38,
      fontWeight: '700',
      lineHeight: 42,
    },
    imagePreviewText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '800',
    },
    selectedFile: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '700',
    },
    actions: {
      alignItems: 'flex-start',
      gap: 10,
    },
    removeButton: {
      alignSelf: 'flex-start',
      borderColor: colors.danger,
      borderRadius: 14,
      borderWidth: 1,
      minHeight: 44,
      paddingHorizontal: 15,
      paddingVertical: 11,
    },
    removeButtonText: {
      color: colors.danger,
      fontSize: 14,
      fontWeight: '800',
    },
    errorMessage: {
      color: colors.danger,
      fontSize: 14,
      fontWeight: '700',
      lineHeight: 20,
    },
    successMessage: {
      color: colors.success,
      fontSize: 14,
      fontWeight: '700',
      lineHeight: 20,
    },
    pressed: {
      opacity: 0.72,
    },
    disabled: {
      opacity: 0.55,
    },
    modalBackdrop: {
      backgroundColor: 'rgba(0, 0, 0, 0.42)',
      flex: 1,
      justifyContent: 'flex-end',
      padding: 20,
    },
    modalSheet: {
      borderRadius: 20,
      borderWidth: 1,
      gap: 12,
      padding: 20,
    },
    modalTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '800',
    },
    modalSubtitle: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
    },
    modalActionButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 14,
      justifyContent: 'center',
      minHeight: 48,
      marginTop: 4,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    modalActionText: {
      color: colors.onPrimary,
      fontSize: 15,
      fontWeight: '800',
    },
    modalCancelButton: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 42,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    modalCancelText: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: '800',
    },
  });
}
