import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import activitiesApi, { Activity } from "./services/activitiesApi";

interface ActivityDetailModalProps {
  visible: boolean;
  activity: Activity | null;
  onClose: () => void;
  startMtrStation: string | null;
}

export default function ActivityDetailModal({
  visible,
  activity,
  onClose,
  startMtrStation,
}: ActivityDetailModalProps) {
  const { t, i18n } = useTranslation();
  const [summary, setSummary] = useState<string>("");
  const [loadingSummary, setLoadingSummary] = useState<boolean>(false);

  useEffect(() => {
    if (visible && activity) {
      generateSummary();
    }
  }, [visible, activity]);

  const generateSummary = async () => {
    if (!activity) return;
    
    setLoadingSummary(true);
    setSummary("");
    
    try {
      // Call the API to generate a Cantonese summary
      const generatedSummary = await activitiesApi.generateActivitySummary(activity, 'cantonese');
      setSummary(generatedSummary);
    } catch (error) {
      console.error("Error generating summary:", error);
      setSummary(t("activities.summaryError") || "無法產生摘要，請重試。");
    } finally {
      setLoadingSummary(false);
    }
  };

  if (!activity) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle} numberOfLines={2}>{activity.name}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>{t("activities.activityDetails")}</Text>
              
              <View style={styles.infoRow}>
                <Text style={styles.label}>{t("activities.category")}:</Text>
                <Text style={styles.value}>{activity.category}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.label}>{t("activities.venue")}:</Text>
                <Text style={styles.value}>{activity.venue}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.label}>{t("activities.date")}:</Text>
                <Text style={styles.value}>{activity.date}</Text>
              </View>
              
              {activity.time && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>{t("activities.time")}:</Text>
                  <Text style={styles.value}>{activity.time}</Text>
                </View>
              )}
              
              <View style={styles.infoRow}>
                <Text style={styles.label}>{t("activities.fee")}:</Text>
                <Text style={styles.value}>{activity.fee}</Text>
              </View>
            </View>
            
            {/* MTR Directions Section */}
            {activity.mtr_directions && (
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>{t("activities.mtrDirections")}</Text>
                <View style={styles.directionsCard}>
                  <Text style={styles.directionsText}>
                    {startMtrStation || activity.mtr_directions.start_station} → {activity.mtr_directions.end_station}
                  </Text>
                  <Text style={styles.directionsDetails}>
                    {t("activities.estimatedTime")}: {activity.mtr_directions.estimated_time}
                  </Text>
                  {activity.mtr_directions.transfers > 0 && (
                    <Text style={styles.directionsDetails}>
                      {activity.mtr_directions.transfers} {t("activities.transfers")}
                    </Text>
                  )}
                </View>
              </View>
            )}
            
            {/* Description Section */}
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>{t("activities.description")}</Text>
              <Text style={styles.descriptionText}>{activity.description}</Text>
            </View>
            
            {/* AI Summary Section */}
            <View style={styles.infoSection}>
              <View style={styles.summaryHeader}>
                <Text style={styles.sectionTitle}>🤖 {t("activities.aiSummary")}</Text>
                <TouchableOpacity onPress={generateSummary} disabled={loadingSummary}>
                  <Text style={[styles.refreshText, loadingSummary && styles.disabledText]}>
                    {loadingSummary ? t("activities.generating") : t("activities.refresh")}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {loadingSummary ? (
                <Text style={styles.loadingText}>{t("activities.generatingSummary")}</Text>
              ) : (
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryText}>{summary}</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "90%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: "#666",
    fontWeight: "bold",
  },
  modalContent: {
    width: "100%",
  },
  infoSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    width: 80,
  },
  value: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  directionsCard: {
    backgroundColor: "#f0f8ff",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d0e8ff",
  },
  directionsText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1976D2",
    marginBottom: 5,
  },
  directionsDetails: {
    fontSize: 14,
    color: "#666",
    marginBottom: 3,
  },
  descriptionText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  refreshText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  disabledText: {
    color: "#ccc",
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    padding: 20,
  },
  summaryCard: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  summaryText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
});