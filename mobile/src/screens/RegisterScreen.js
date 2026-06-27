import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { useAuth } from '../auth/AuthContext';

const INITIAL_FORM = {
  username: '',
  password: '',
  confirmPassword: '',
  fullName: '',
  phone: '',
  address: '',
};

const IMAGE_PICKER_OPTIONS = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.7,
};

export default function RegisterScreen() {
  const { signUp } = useAuth();

  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [profileImage, setProfileImage] = useState(null);
  const [imageError, setImageError] = useState('');
  const [imageMenuVisible, setImageMenuVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(name, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    setFieldErrors((currentErrors) => {
      const nextErrors = {
        ...currentErrors,
        [name]: '',
      };

      if (name === 'password') {
        nextErrors.confirmPassword = '';
      }

      return nextErrors;
    });

    setMessage('');
  }

  function validateForm() {
    const errors = {};

    if (!form.username.trim()) {
      errors.username = 'Username is required.';
    } else if (form.username.trim().length < 3) {
      errors.username = 'Username must be at least 3 characters long.';
    }

    if (!form.fullName.trim()) {
      errors.fullName = 'Full name is required.';
    } else if (form.fullName.trim().length < 2) {
      errors.fullName = 'Full name must be at least 2 characters long.';
    }

    const phone = form.phone.trim();

    if (!phone) {
      errors.phone = 'Phone number is required.';
    } else if (!/^0\d{9}$/.test(phone)) {
      errors.phone =
        'Phone number must contain exactly 10 digits and start with 0.';
    }

    if (!form.address.trim()) {
      errors.address = 'Address is required.';
    }

    if (!form.password) {
      errors.password = 'Password is required.';
    } else if (form.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    } else if (
      !/[a-zA-Z]/.test(form.password) ||
      !/[0-9]/.test(form.password)
    ) {
      errors.password = 'Password must contain both letters and numbers.';
    }

    if (!form.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (form.password !== form.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    return errors;
  }

  function openImageMenu() {
    if (isSubmitting) {
      return;
    }

    setImageError('');

    if (Platform.OS === 'web') {
      setImageMenuVisible(true);
      return;
    }

    Alert.alert(
      'Add profile photo',
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
      {
        cancelable: true,
      }
    );
  }

  function closeImageMenu() {
    setImageMenuVisible(false);
  }

  function saveSelectedImage(result) {
    if (result.canceled) {
      return;
    }

    const selectedAsset = result.assets?.[0];

    if (!selectedAsset?.uri) {
      setImageError('The selected image could not be used. Please try again.');
      return;
    }

    setProfileImage({
      name: selectedAsset.fileName || 'Profile image',
      uri: selectedAsset.uri,
    });

    setImageError('');
    setMessage('');
  }

  function getPermissionMessage(permission, sourceName) {
    if (permission.canAskAgain === false) {
      return `${sourceName} permission is disabled. Enable it in device settings and try again.`;
    }

    return `${sourceName} permission is required to add a profile image.`;
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
          'Could not open the gallery. Please try choosing an image again.'
      );
    }
  }

  async function takeImageWithCamera() {
    setImageError('');

    if (Platform.OS === 'web') {
      closeImageMenu();
      setImageError(
        'Camera capture is available in the mobile app. Use Expo Go on a phone to take a photo.'
      );
      return;
    }

    try {
      const permission =
        await ImagePicker.requestCameraPermissionsAsync();

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
          'Could not open the camera. Check Expo Go camera permission and try again.'
      );
    }
  }

  function removeSelectedImage() {
    setProfileImage(null);
    setImageError('');
    setMessage('');
  }

  async function handleRegister() {
    if (isSubmitting) {
      return;
    }
    const errors = validateForm();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setMessage(
        'Please fix the highlighted fields before creating the account.'
      );
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      await signUp({
        username: form.username.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
      });
    } catch (error) {
      setMessage(error.message || 'Could not create the account.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderFieldMessage(fieldName, helperText) {
    const error = fieldErrors[fieldName];

    return (
      <Text style={error ? styles.fieldError : styles.fieldHelper}>
        {error || helperText}
      </Text>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>
            Register and continue directly to the app.
          </Text>

          <View style={styles.imageSection}>
            <Text style={styles.fieldLabel}>Profile image</Text>

            <Pressable
              accessibilityLabel="Choose a profile image"
              disabled={isSubmitting}
              onPress={openImageMenu}
              style={({ pressed }) => [
                styles.avatarButton,
                pressed ? styles.avatarButtonPressed : null,
                isSubmitting ? styles.buttonDisabled : null,
              ]}
            >
              {profileImage ? (
                <Image
                  source={{ uri: profileImage.uri }}
                  style={styles.avatarPreview}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarPlus}>+</Text>
                  <Text style={styles.avatarPlaceholderText}>Add photo</Text>
                </View>
              )}
            </Pressable>

            <Text style={styles.fieldHelper}>
              {profileImage
                ? 'Tap the photo to change it.'
                : 'Tap the circle to add a profile image.'}
            </Text>

            {profileImage ? (
              <>
                <Text style={styles.fieldHelper}>{profileImage.name}</Text>

                <Pressable
                  disabled={isSubmitting}
                  onPress={removeSelectedImage}
                  style={[
                    styles.removeImageButton,
                    isSubmitting ? styles.buttonDisabled : null,
                  ]}
                >
                  <Text style={styles.removeImageButtonText}>
                    Remove photo
                  </Text>
                </Pressable>
              </>
            ) : null}

            {imageError ? (
              <Text style={styles.fieldError}>{imageError}</Text>
            ) : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Username</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSubmitting}
              onChangeText={(value) => updateField('username', value)}
              placeholder="Username"
              style={[
                styles.input,
                fieldErrors.username ? styles.inputError : null,
              ]}
              value={form.username}
              blurOnSubmit={true}
              enterKeyHint="done"
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />
            {renderFieldMessage('username', 'Use at least 3 characters.')}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Full name</Text>
            <TextInput
              editable={!isSubmitting}
              onChangeText={(value) => updateField('fullName', value)}
              placeholder="Full name"
              style={[
                styles.input,
                fieldErrors.fullName ? styles.inputError : null,
              ]}
              value={form.fullName}
              blurOnSubmit={true}
              enterKeyHint="done"
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />
            {renderFieldMessage(
              'fullName',
              'Enter the name that will appear in the app.'
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Phone</Text>
            <TextInput
              editable={!isSubmitting}
              inputMode="numeric"
              keyboardType="phone-pad"
              onChangeText={(value) => updateField('phone', value)}
              placeholder="Phone"
              style={[
                styles.input,
                fieldErrors.phone ? styles.inputError : null,
              ]}
              value={form.phone}
              blurOnSubmit={true}
              enterKeyHint="done"
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />
            {renderFieldMessage(
              'phone',
              'Enter a 10-digit Israeli phone number.'
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Address</Text>
            <TextInput
              editable={!isSubmitting}
              onChangeText={(value) => updateField('address', value)}
              placeholder="Address"
              style={[
                styles.input,
                fieldErrors.address ? styles.inputError : null,
              ]}
              value={form.address}
              blurOnSubmit={true}
              enterKeyHint="done"
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />
            {renderFieldMessage('address', 'Enter your delivery address.')}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Password</Text>
            <TextInput
              autoCapitalize="none"
              editable={!isSubmitting}
              onChangeText={(value) => updateField('password', value)}
              placeholder="Password"
              secureTextEntry
              style={[
                styles.input,
                fieldErrors.password ? styles.inputError : null,
              ]}
              value={form.password}
              blurOnSubmit={true}
              enterKeyHint="done"
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />
            {renderFieldMessage(
              'password',
              'Use at least 8 characters with letters and numbers.'
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Confirm password</Text>
            <TextInput
              autoCapitalize="none"
              editable={!isSubmitting}
              onChangeText={(value) =>
                updateField('confirmPassword', value)
              }
              placeholder="Repeat password"
              secureTextEntry
              style={[
                styles.input,
                fieldErrors.confirmPassword ? styles.inputError : null,
              ]}
              value={form.confirmPassword}
              blurOnSubmit={true}
              enterKeyHint="done"
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />
            {renderFieldMessage(
              'confirmPassword',
              'Repeat the same password.'
            )}
          </View>

          {message ? <Text style={styles.message}>{message}</Text> : null}

          <Pressable
            disabled={isSubmitting}
            onPress={handleRegister}
            style={[
              styles.primaryButton,
              isSubmitting ? styles.buttonDisabled : null,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryButtonText}>Create account</Text>
            )}
          </Pressable>
        </View>
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

          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Add profile photo</Text>
            <Text style={styles.modalSubtitle}>
              Choose how you want to add your image.
            </Text>

            <Pressable
              onPress={pickImageFromGallery}
              style={styles.modalActionButton}
            >
              <Text style={styles.modalActionText}>Upload from device</Text>
            </Pressable>

            <Text style={styles.modalSubtitle}>
              Camera capture is available when the app is opened through Expo Go on a phone.
            </Text>

            <Pressable
              onPress={closeImageMenu}
              style={styles.modalCancelButton}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f7f7f7',
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    gap: 18,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#5f6368',
    fontSize: 16,
    marginBottom: 4,
  },
  imageSection: {
    alignItems: 'center',
    borderColor: '#e2e2e2',
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  avatarButton: {
    borderRadius: 56,
  },
  avatarButtonPressed: {
    opacity: 0.72,
  },
  avatarPreview: {
    borderRadius: 56,
    height: 112,
    width: 112,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    backgroundColor: '#edf7fc',
    borderColor: '#009de0',
    borderRadius: 56,
    borderStyle: 'dashed',
    borderWidth: 1,
    height: 112,
    justifyContent: 'center',
    width: 112,
  },
  avatarPlus: {
    color: '#007cb3',
    fontSize: 30,
    fontWeight: '400',
    lineHeight: 34,
  },
  avatarPlaceholderText: {
    color: '#007cb3',
    fontSize: 13,
    fontWeight: '700',
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  input: {
    borderColor: '#d7d7d7',
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 16,
    padding: 14,
  },
  inputError: {
    borderColor: '#c62828',
  },
  fieldHelper: {
    color: '#5f6368',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  fieldError: {
    color: '#c62828',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  message: {
    color: '#c62828',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#009de0',
    borderRadius: 10,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  removeImageButton: {
    paddingVertical: 4,
  },
  removeImageButtonText: {
    color: '#c62828',
    fontSize: 14,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    gap: 12,
    padding: 20,
    width: '100%',
  },
  modalTitle: {
    fontSize: 21,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalSubtitle: {
    color: '#5f6368',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
    textAlign: 'center',
  },
  modalActionButton: {
    alignItems: 'center',
    backgroundColor: '#edf7fc',
    borderRadius: 10,
    paddingVertical: 14,
  },
  modalActionText: {
    color: '#007cb3',
    fontSize: 16,
    fontWeight: '700',
  },
  modalCancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  modalCancelText: {
    color: '#5f6368',
    fontSize: 16,
    fontWeight: '700',
  },
});