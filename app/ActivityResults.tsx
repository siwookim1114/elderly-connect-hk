import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ActivityDetailModal from "./ActivityDetailModal";
import { Activity } from "./services/activitiesApi";

interface ActivityResultsProps {
  activities: Activity[];
  district: string;
  onBack: () => void;
  useGenAI?: boolean; // Add this new prop
  startMtrStation?: string; // Add this prop to pass the selected MTR station
}

export default function ActivityResults({
  activities,
  district,
  onBack,
  useGenAI = true, // Default to true since AI is now always enabled
  startMtrStation, // Default to undefined
}: ActivityResultsProps) {
  const { t } = useTranslation();
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleActivityPress = (activity: Activity) => {
    setSelectedActivity(activity);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedActivity(null);
  };

  const renderActivity = ({ item }: { item: Activity }) => (
    <TouchableOpacity
      style={styles.activityCard}
      onPress={() => handleActivityPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.activityName} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{item.category}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Text style={styles.icon}>📍</Text>
          <Text style={styles.infoText} numberOfLines={1}>
            {item.venue}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.icon}>📅</Text>
          <Text style={styles.infoText} numberOfLines={1}>
            {item.date}
          </Text>
        </View>

        {item.time && (
          <View style={styles.infoRow}>
            <Text style={styles.icon}>⏰</Text>
            <Text style={styles.infoText}>{item.time}</Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.icon}>💰</Text>
          <Text style={styles.infoText}>{item.fee}</Text>
        </View>

        {/* MTR Directions Section */}
        {item.mtr_directions && (
          <View style={[styles.infoRow, styles.directionsRow]}>
            <Text style={styles.icon}>🚇</Text>
            <View style={styles.directionsTextContainer}>
              <Text style={styles.directionsTitle}>
                {t("activities.mtrDirections")}
              </Text>
              <Text style={styles.directionsText}>
                {/* Use the startMtrStation prop if available, otherwise use the activity's start station */}
                {startMtrStation || item.mtr_directions.start_station} → {item.mtr_directions.end_station}
              </Text>
              <Text style={styles.directionsDetails}>
                {t("activities.estimatedTime")}: {item.mtr_directions.estimated_time}
              </Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.viewDetailsText}>
          {t("activities.viewDetails")} →
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← {t("common.back")}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>
          {t("activities.activitiesIn")}{" "}
          {t(`districts.${district.replace(/\s+/g, "_").replace(/&/g, "and")}`)}
        </Text>

        {/* Always show AI badge since AI recommendations are now default */}
        <View style={styles.aiBadge}>
          <Text style={styles.aiBadgeText}>🤖 {t("activities.aiRecommended")}</Text>
        </View>

        <View style={styles.resultCountContainer}>
          <Text style={styles.resultCount}>
            {t("activities.found")}{" "}
            <Text style={styles.resultCountBold}>{activities.length}</Text>{" "}
            {t("activities.activities")}
          </Text>
        </View>
      </View>

      {/* Results */}
      {activities.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>😔</Text>
          <Text style={styles.emptyTitle}>{t("activities.noActivities")}</Text>
          <Text style={styles.emptySubtitle}>{t("activities.tryAnother")}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onBack}>
            <Text style={styles.retryButtonText}>
              {t("activities.searchAgain")}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={activities}
          renderItem={renderActivity}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Activity Detail Modal */}
      <ActivityDetailModal
        visible={modalVisible}
        activity={selectedActivity}
        onClose={closeModal}
        startMtrStation={startMtrStation || null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: "#FFF",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 15,
    paddingVertical: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
  },
  aiBadge: {
    backgroundColor: "#E3F2FD",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: "center",
    marginBottom: 10,
  },
  aiBadgeText: {
    color: "#1976D2",
    fontSize: 14,
    fontWeight: "600",
  },
  resultCountContainer: {
    backgroundColor: "#E3F2FD",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: "center",
  },
  resultCount: {
    fontSize: 14,
    color: "#333",
  },
  resultCountBold: {
    fontWeight: "700",
    color: "#2196F3",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  activityCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  activityName: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginRight: 10,
  },
  categoryBadge: {
    backgroundColor: "#E3F2FD",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 12,
    color: "#1976D2",
    fontWeight: "600",
  },
  cardBody: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
    width: 20,
    textAlign: "center",
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#666",
  },
  directionsRow: {
    backgroundColor: "#F5F5F5",
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  directionsTextContainer: {
    flex: 1,
  },
  directionsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  directionsText: {
    fontSize: 14,
    color: "#1976D2",
    fontWeight: "600",
    marginBottom: 2,
  },
  directionsDetails: {
    fontSize: 12,
    color: "#666",
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: "#EEE",
    paddingTop: 10,
  },
  viewDetailsText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
    textAlign: "right",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});