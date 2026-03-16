import React, { useState } from "react";
import { reloadAppAsync } from "expo";
import {
  StyleSheet,
  View,
  Pressable,
  ScrollView,
  Text,
  Modal,
} from "react-native";
import { Feather } from "@expo/vector-icons";

export type ErrorFallbackProps = {
  error: Error;
  resetError: () => void;
};

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleRestart = async () => {
    try {
      await reloadAppAsync();
    } catch (restartError) {
      console.error("Failed to restart app:", restartError);
      resetError();
    }
  };

  const formatErrorDetails = (): string => {
    let details = `Error: ${error.message}\n\n`;
    if (error.stack) details += `Stack Trace:\n${error.stack}`;
    return details;
  };

  return (
    <View style={styles.container}>
      {__DEV__ ? (
        <Pressable
          android_ripple={{ color: "transparent" }}
          onPress={() => setIsModalVisible(true)}
          style={({ pressed }) => [
            styles.topButton,
            { opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Feather name="alert-circle" size={20} color="#fff" />
        </Pressable>
      ) : null}

      <View style={styles.content}>
        <Text style={styles.title}>Something went wrong</Text>

        <Text style={styles.message}>Please reload the app to continue.</Text>

        <Pressable
          android_ripple={{ color: "transparent" }}
          onPress={handleRestart}
          style={({ pressed }) => [
            styles.button,
            {
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <Text style={styles.buttonText}>Try Again</Text>
        </Pressable>
      </View>

      {__DEV__ ? (
        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Error Details</Text>
                <Pressable
                  android_ripple={{ color: "transparent" }}
                  onPress={() => setIsModalVisible(false)}
                  style={({ pressed }) => [
                    styles.closeButton,
                    { opacity: pressed ? 0.6 : 1 },
                  ]}
                >
                  <Feather name="x" size={24} color="#fff" />
                </Pressable>
              </View>

              <ScrollView
                style={styles.modalScrollView}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator
              >
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText} selectable>
                    {formatErrorDetails()}
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#0f172a",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    width: "100%",
    maxWidth: 600,
  },
  title: {
    textAlign: "center",
    lineHeight: 40,
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },
  message: {
    textAlign: "center",
    opacity: 0.8,
    lineHeight: 24,
    fontSize: 14,
    color: "#e5e7eb",
  },
  topButton: {
    position: "absolute",
    top: 24,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    paddingHorizontal: 24,
    minWidth: 200,
    backgroundColor: "#2d7dff",
  },
  buttonText: {
    fontWeight: "700",
    textAlign: "center",
    fontSize: 16,
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    width: "100%",
    height: "90%",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: "#0b1220",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.12)",
  },
  modalTitle: {
    fontWeight: "700",
    fontSize: 16,
    color: "#fff",
  },
  closeButton: {
    padding: 6,
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 16,
  },
  errorContainer: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  errorText: {
    fontSize: 12,
    lineHeight: 18,
    width: "100%",
    color: "#e5e7eb",
    fontFamily: "monospace",
  },
});
