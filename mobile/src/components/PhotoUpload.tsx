import { View, Text, Pressable, Image, Alert, Platform, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../lib/constants";

interface PhotoUploadProps {
  photoUri: string | null;
  onPhotoSelected: (uri: string, mimeType: string) => void;
}

export default function PhotoUpload({
  photoUri,
  onPhotoSelected,
}: PhotoUploadProps) {
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      onPhotoSelected(asset.uri, asset.mimeType || "image/jpeg");
    }
  };

  const takePhoto = async () => {
    try {
      const available = await ImagePicker.getCameraPermissionsAsync();
      if (Platform.OS === "ios" && !available.granted) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        onPhotoSelected(asset.uri, asset.mimeType || "image/jpeg");
      }
    } catch {
      Alert.alert(
        "Camera Unavailable",
        "Camera is not available on this device. Please choose a photo from your gallery instead.",
        [{ text: "Choose Photo", onPress: pickImage }, { text: "Cancel" }]
      );
    }
  };

  if (photoUri) {
    return (
      <Pressable onPress={pickImage} style={styles.previewContainer}>
        <Image source={{ uri: photoUri }} style={styles.preview} />
        <View style={styles.previewOverlay}>
          <Text style={styles.changeText}>Tap to change photo</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={takePhoto} style={styles.uploadButton}>
        <View style={styles.iconCircle}>
          <Ionicons name="camera" size={40} color={COLORS.gold[400]} />
        </View>
        <Text style={styles.title}>Take a Photo</Text>
        <Text style={styles.subtitle}>Use your camera</Text>
      </Pressable>

      <Pressable onPress={pickImage} style={styles.uploadButton}>
        <View style={styles.iconCircle}>
          <Ionicons name="images" size={40} color={COLORS.gold[400]} />
        </View>
        <Text style={styles.title}>Choose Photo</Text>
        <Text style={styles.subtitle}>From your gallery</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    aspectRatio: 3 / 4,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: COLORS.white[20],
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(229,161,60,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  subtitle: {
    color: COLORS.white[40],
    fontSize: 12,
  },
  previewContainer: {
    aspectRatio: 3 / 4,
    borderRadius: 24,
    overflow: "hidden",
  },
  preview: {
    width: "100%",
    height: "100%",
  },
  previewOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  changeText: {
    color: COLORS.white[70],
    fontSize: 13,
  },
});
