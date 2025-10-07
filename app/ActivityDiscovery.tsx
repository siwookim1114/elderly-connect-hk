import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ActivityResults from "./ ActivityResults";
import LoadingAnimation from "./LoadingAnimation";

// Import your JSON data
import activitiesData from "../elderly_activities_genai.json";

const DISTRICTS = [
  "Central & Western",
  "Wan Chai",
  "Eastern",
  "Southern",
  "Yau Tsim Mong",
  "Sham Shui Po",
  "Kowloon City",
  "Wong Tai Sin",
  "Kwun Tong",
  "Kwai Tsing",
  "Tsuen Wan",
  "Tuen Mun",
  "Yuen Long",
  "North",
  "Tai Po",
  "Sha Tin",
  "Sai Kung",
  "Islands",
];

const ACTIVITY_TYPES = [
  "All Types",
  "Social & Community",
  "Table Tennis",
  "Tennis",
  "Swimming",
  "Badminton",
  "Basketball",
  "Football",
];

export default function ActivityDiscoveryScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedActivityType, setSelectedActivityType] =
    useState<string>("All Types");
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [filteredActivities, setFilteredActivities] = useState<any[]>([]);

  const handleSearch = async () => {
    if (!selectedDistrict) {
      Alert.alert(t("activities.error"), t("activities.selectDistrictAlert"));
      return;
    }

    // Show loading animation
    setIsLoading(true);
    setShowResults(false);

    // Filter activities locally (this will be replaced by API call)
    const filtered = activitiesData.activities.filter((activity: any) => {
      const districtMatch = activity.district === selectedDistrict;
      const typeMatch =
        selectedActivityType === "All Types" ||
        activity.category === selectedActivityType;
      return districtMatch && typeMatch;
    });

    // ============================================================
    // TODO: REPLACE WITH GENAI API CALL
    // ============================================================
    // Uncomment when API is ready:
    /*
    try {
      const response = await fetch('YOUR_GENAI_API_URL', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          district: selectedDistrict,
          activityType: selectedActivityType,
        }),
      });
      
      const data = await response.json();
      setFilteredActivities(data.activities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      Alert.alert(t('activities.error'), t('activities.fetchError'));
      setFilteredActivities(filtered);
    }
    */
    // ============================================================

    // Simulate API delay (2 seconds for animation)
    setTimeout(() => {
      setFilteredActivities(filtered);
      setIsLoading(false);
      setShowResults(true);
    }, 2000);
  };

  const handleReset = () => {
    setSelectedDistrict("");
    setSelectedActivityType("All Types");
    setShowResults(false);
    setFilteredActivities([]);
  };

  if (isLoading) {
    return <LoadingAnimation />;
  }

  if (showResults) {
    return (
      <ActivityResults
        activities={filteredActivities}
        district={selectedDistrict}
        onBack={handleReset}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerSection}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← {t("common.back")}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t("activities.title")}</Text>
          <Text style={styles.subtitle}>{t("activities.subtitle")}</Text>
        </View>

        {/* District Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            📍 {t("activities.selectDistrict")}
          </Text>
          <View style={styles.buttonGrid}>
            {DISTRICTS.map((district) => (
              <TouchableOpacity
                key={district}
                style={[
                  styles.districtButton,
                  selectedDistrict === district && styles.districtButtonActive,
                ]}
                onPress={() => setSelectedDistrict(district)}
              >
                <Text
                  style={[
                    styles.districtButtonText,
                    selectedDistrict === district &&
                      styles.districtButtonTextActive,
                  ]}
                >
                  {t(
                    `districts.${district
                      .replace(/\s+/g, "_")
                      .replace(/&/g, "and")}`
                  )}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Activity Type Filter */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            🎯 {t("activities.activityType")}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterRow}>
              {ACTIVITY_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.filterChip,
                    selectedActivityType === type && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedActivityType(type)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedActivityType === type &&
                        styles.filterChipTextActive,
                    ]}
                  >
                    {t(
                      `activityTypes.${type
                        .replace(/\s+/g, "_")
                        .replace(/&/g, "and")}`
                    )}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Selected Summary */}
        {selectedDistrict && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>
              {t("activities.lookingFor")}:{" "}
              <Text style={styles.summaryBold}>
                {t(
                  `activityTypes.${selectedActivityType
                    .replace(/\s+/g, "_")
                    .replace(/&/g, "and")}`
                )}
              </Text>
            </Text>
            <Text style={styles.summaryText}>
              {t("activities.in")}:{" "}
              <Text style={styles.summaryBold}>
                {t(
                  `districts.${selectedDistrict
                    .replace(/\s+/g, "_")
                    .replace(/&/g, "and")}`
                )}
              </Text>
            </Text>
          </View>
        )}

        {/* Search Button */}
        <TouchableOpacity
          style={[
            styles.searchButton,
            !selectedDistrict && styles.searchButtonDisabled,
          ]}
          onPress={handleSearch}
          disabled={!selectedDistrict}
        >
          <Text style={styles.searchButtonText}>
            🔍 {t("activities.searchButton")}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  headerSection: {
    backgroundColor: "#FFF",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
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
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginBottom: 15,
  },
  buttonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  districtButton: {
    backgroundColor: "#FFF",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    minWidth: "47%",
    alignItems: "center",
  },
  districtButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  districtButtonText: {
    fontSize: 15,
    color: "#333",
    fontWeight: "600",
  },
  districtButtonTextActive: {
    color: "#FFF",
  },
  filterRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
  },
  filterChip: {
    backgroundColor: "#FFF",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  filterChipActive: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  filterChipText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: "#FFF",
    fontWeight: "700",
  },
  summaryCard: {
    marginHorizontal: 20,
    backgroundColor: "#E3F2FD",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
  },
  summaryText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 4,
  },
  summaryBold: {
    fontWeight: "700",
    color: "#007AFF",
  },
  searchButton: {
    marginHorizontal: 20,
    backgroundColor: "#FF6B35",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  searchButtonDisabled: {
    backgroundColor: "#CCC",
  },
  searchButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
  },
});
