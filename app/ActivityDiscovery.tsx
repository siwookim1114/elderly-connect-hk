import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
import ActivityResults from "./ActivityResults";
import LoadingAnimation from "./LoadingAnimation";

// Import the activities API service
import activitiesApi, { Activity, MTR_STATIONS_BY_DISTRICT, UserLocation } from "./services/activitiesApi";

// Create a mapping from English station names to translation keys
const getStationTranslationKey = (stationName: string): string => {
  const stationKeyMap: { [key: string]: string } = {
    "Central": "mtrStations.central",
    "Admiralty": "mtrStations.admiralty",
    "Sheung Wan": "mtrStations.sheung_wan",
    "Sai Ying Pun": "mtrStations.sai_ying_pun",
    "Wan Chai": "mtrStations.wan_chai",
    "Causeway Bay": "mtrStations.causeway_bay",
    "Tin Hau": "mtrStations.tin_hau",
    "Fortress Hill": "mtrStations.fortress_hill",
    "North Point": "mtrStations.north_point",
    "Quarry Bay": "mtrStations.quarry_bay",
    "Tai Koo": "mtrStations.tai_koo",
    "Sai Wan Ho": "mtrStations.sai_wan_ho",
    "Shau Kei Wan": "mtrStations.shau_kei_wan",
    "Heng Fa Chuen": "mtrStations.heng_fa_chuen",
    "Chai Wan": "mtrStations.chai_wan",
    "Siu Sai Wan": "mtrStations.siu_sai_wan",
    "Wong Chuk Hang": "mtrStations.wong_chuk_hang",
    "Ocean Park": "mtrStations.ocean_park",
    "Lei Tung": "mtrStations.lei_tung",
    "Mong Kok": "mtrStations.mong_kok",
    "Prince Edward": "mtrStations.prince_edward",
    "Tsim Sha Tsui": "mtrStations.tsim_sha_tsui",
    "Jordan": "mtrStations.jordan",
    "Yau Ma Tei": "mtrStations.yau_ma_tei",
    "Sham Shui Po": "mtrStations.sham_shui_po",
    "Cheung Sha Wan": "mtrStations.cheung_sha_wan",
    "Lai Chi Kok": "mtrStations.lai_chi_kok",
    "Mei Foo": "mtrStations.mei_foo",
    "Lai King": "mtrStations.lai_king",
    "Kowloon Tong": "mtrStations.kowloon_tong",
    "Shek Kip Mei": "mtrStations.shek_kip_mei",
    "Kowloon City": "mtrStations.kowloon_city",
    "Wong Tai Sin": "mtrStations.wong_tai_sin",
    "Diamond Hill": "mtrStations.diamond_hill",
    "Choi Hung": "mtrStations.choi_hung",
    "Kowloon Bay": "mtrStations.kowloon_bay",
    "Kwun Tong": "mtrStations.kwun_tong",
    "Ngau Tau Kok": "mtrStations.ngau_tau_kok",
    "Lam Tin": "mtrStations.lam_tin",
    "Yau Tong": "mtrStations.yau_tong",
    "Tiu Keng Leng": "mtrStations.tiu_keng_leng",
    "Tseung Kwan O": "mtrStations.tseung_kwan_o",
    "Kwai Fong": "mtrStations.kwai_fong",
    "Kwai Hing": "mtrStations.kwai_hing",
    "Tai Wo Hau": "mtrStations.tai_wo_hau",
    "Tsuen Wan West": "mtrStations.tsuen_wan_west",
    "Tsuen Wan": "mtrStations.tsuen_wan",
    "Tuen Mun": "mtrStations.tuen_mun",
    "Siu Hong": "mtrStations.siu_hong",
    "Tin Shui Wai": "mtrStations.tin_shui_wai",
    "Long Ping": "mtrStations.long_ping",
    "Yuen Long": "mtrStations.yuen_long",
    "Tai Wo": "mtrStations.tai_wo",
    "Fanling": "mtrStations.fanling",
    "Sheung Shui": "mtrStations.sheung_shui",
    "Tai Po Market": "mtrStations.tai_po_market",
    "Tai Po": "mtrStations.tai_po",
    "Fu Heng": "mtrStations.fu_heng",
    "Wan Tau Kok Lai": "mtrStations.wan_tau_kok_lai",
    "Sha Tin": "mtrStations.sha_tin",
    "City One": "mtrStations.city_one",
    "Shek Mun": "mtrStations.shek_mun",
    "Tai Shui Hang": "mtrStations.tai_shui_hang",
    "Heng On": "mtrStations.heng_on",
    "Ma On Shan": "mtrStations.ma_on_shan",
    "Wu Kai Sha": "mtrStations.wu_kai_sha",
    "Mosque Junction": "mtrStations.mosque_junction",
    "Che Kung Temple": "mtrStations.che_kung_temple",
    "Tai Wai": "mtrStations.tai_wai",
    "Shatin Wai": "mtrStations.shatin_wai",
    "Fo Tan": "mtrStations.fo_tan",
    "Racecourse": "mtrStations.racecourse",
    "University": "mtrStations.university",
    "Po Lam": "mtrStations.po_lam",
    "Hang Hau": "mtrStations.hang_hau",
    "Hong Kong": "mtrStations.hong_kong",
    "Kennedy Town": "mtrStations.kennedy_town",
    "HKU": "mtrStations.hku"
  };
  
  return stationKeyMap[stationName] || stationName;
};

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
  const params = useLocalSearchParams();
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedActivityType, setSelectedActivityType] =
    useState<string>("All Types");
  const [selectedMtrStation, setSelectedMtrStation] = useState<string>("");
  const [preSelectedMtrStation, setPreSelectedMtrStation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [useGenAI] = useState(true); // AI is now always enabled
  const [userLocation, setUserLocation] = useState<UserLocation | undefined>(undefined);
  const [locationStatus, setLocationStatus] = useState<string>(""); // For UI feedback

  // Get MTR stations for the selected district
  const getMtrStationsForDistrict = (district: string) => {
    return MTR_STATIONS_BY_DISTRICT[district as keyof typeof MTR_STATIONS_BY_DISTRICT] || [];
  };

  const handleSearch = async () => {
    if (!selectedDistrict) {
      Alert.alert(t("activities.error"), t("activities.selectDistrictAlert"));
      return;
    }

    // Show loading animation
    setIsLoading(true);
    setShowResults(false);
    setLocationStatus(t("activities.detectingLocation"));

    try {
      // Get user's current location (fallback method)
      const location = await activitiesApi.getCurrentLocation();
      setUserLocation(location || undefined);
      
      if (location) {
        setLocationStatus(t("activities.locationDetected"));
      } else {
        setLocationStatus(t("activities.locationFailed"));
      }

      // Add a small delay to show location detection status
      await new Promise(resolve => setTimeout(resolve, 500));

      // Determine the start MTR station
      let startMtrStation = selectedMtrStation;
      
      // If no station selected but we have a location, find nearest station
      if (!startMtrStation && location) {
        // In a real implementation, we would call an API to find the nearest station
        // For now, we'll just show a message
        setLocationStatus(t("activities.pleaseSelectMtrStation"));
      }

      // Update status to show we're getting recommendations
      setLocationStatus(t("activities.gettingRecommendations"));

      // AI recommendations are now enabled by default
      const response = await activitiesApi.recommendActivities({
        district: selectedDistrict,
        activityType: selectedActivityType,
        userLocation: location || undefined,
        startMtrStation: startMtrStation || undefined,
        userPreferences: {
          // In a real app, we would collect more user preferences
          age: "65+",
          interests: "social, health, community",
        },
      });
      setFilteredActivities(response.activities);
      
      // Update status to show we're preparing results
      setLocationStatus(t("activities.preparingResults"));
    } catch (error) {
      console.error("Error fetching activities:", error);
      Alert.alert(t("activities.error"), t("activities.fetchError"));
      
      // Fallback to local filtering if API fails
      // Note: In a real implementation, you would import the JSON data
      // For now, we'll just show an empty array
      setFilteredActivities([]);
    }

    // Hide loading animation
    setIsLoading(false);
    setShowResults(true);
  };

  const handleReset = () => {
    setSelectedDistrict("");
    setSelectedActivityType("All Types");
    setSelectedMtrStation("");
    setShowResults(false);
    setFilteredActivities([]);
    setUserLocation(undefined);
    setLocationStatus("");
  };

  // Effect to handle pre-selected MTR station from route params
  useEffect(() => {
    if (params.startMtrStation) {
      const startStation = Array.isArray(params.startMtrStation) 
        ? params.startMtrStation[0] 
        : params.startMtrStation;
      setPreSelectedMtrStation(startStation);
      setSelectedMtrStation(startStation);
    }
  }, [params.startMtrStation]);

  if (isLoading) {
    return <LoadingAnimation status={locationStatus} />;
  }

  if (showResults) {
    return (
      <ActivityResults
        activities={filteredActivities}
        district={selectedDistrict}
        onBack={handleReset}
        startMtrStation={preSelectedMtrStation || selectedMtrStation || undefined}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Mingle Branding */}
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

        {/* MTR Station Selection - Only shown if not pre-selected */}
        {selectedDistrict && !preSelectedMtrStation ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              🚇 {t("activities.selectMtrStation")}
            </Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedMtrStation}
                style={styles.picker}
                onValueChange={(itemValue: string) => setSelectedMtrStation(itemValue)}
              >
                <Picker.Item label={t("activities.chooseMtrStation")} value="" />
                {getMtrStationsForDistrict(selectedDistrict).map((station) => (
                  <Picker.Item key={station} label={t(getStationTranslationKey(station))} value={station} />
                ))}
              </Picker>
            </View>
          </View>
        ) : null}

        {/* Display pre-selected MTR station */}
        {preSelectedMtrStation && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              🚇 {t("activities.startingFrom")}
            </Text>
            <View style={styles.preSelectedStationContainer}>
              <Text style={styles.preSelectedStationText}>
                {t(getStationTranslationKey(preSelectedMtrStation))}
              </Text>
            </View>
          </View>
        )}

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

        {/* Location Status */}
        {locationStatus ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              📍 {t("activities.locationStatus")}
            </Text>
            <View style={styles.locationStatusContainer}>
              <Text style={styles.locationStatusText}>
                {locationStatus}
              </Text>
            </View>
          </View>
        ) : null}

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
            {selectedMtrStation && (
              <Text style={styles.summaryText}>
                🚇 {t("activities.fromStation")}:{" "}
                <Text style={styles.summaryBold}>{t(getStationTranslationKey(selectedMtrStation))}</Text>
              </Text>
            )}
            {/* Always show AI is being used since it's now default */}
            <Text style={styles.summaryText}>
              🤖 {t("activities.usingGenAI")}
            </Text>
          </View>
        )}

        {/* Search Button */}
        <TouchableOpacity
          style={[
            styles.searchButton,
            (!selectedDistrict || (selectedDistrict && !selectedMtrStation && !preSelectedMtrStation)) ? styles.searchButtonDisabled : {},
          ]}
          onPress={handleSearch}
          disabled={!!(!selectedDistrict || (selectedDistrict && !selectedMtrStation && !preSelectedMtrStation))}
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
    backgroundColor: "#F7FAFC",
  },
  headerSection: {
    backgroundColor: "#C6F6D5",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 15,
    paddingVertical: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: "#2D3748",
    fontWeight: "600",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2D3748",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#4A5568",
    textAlign: "center",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2D3748",
    marginBottom: 15,
  },
  buttonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  districtButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    minWidth: "47%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  districtButtonActive: {
    backgroundColor: "#E53E3E",
    borderColor: "#E53E3E",
  },
  districtButtonText: {
    fontSize: 15,
    color: "#4A5568",
    fontWeight: "600",
  },
  districtButtonTextActive: {
    color: "#FFFFFF",
  },
  pickerContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  picker: {
    height: 50,
    width: "100%",
  },
  filterRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
  },
  filterChip: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  filterChipActive: {
    backgroundColor: "#38A169",
    borderColor: "#38A169",
  },
  filterChipText: {
    fontSize: 14,
    color: "#718096",
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  toggleContainer: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  toggleButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 15,
  },
  toggleButtonActive: {
    backgroundColor: "#38A169",
  },
  toggleButtonInactive: {
    backgroundColor: "#E2E8F0",
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  toggleButtonTextActive: {
    color: "#FFFFFF",
  },
  toggleButtonTextInactive: {
    color: "#4A5568",
  },
  toggleDescription: {
    fontSize: 14,
    color: "#718096",
    lineHeight: 20,
  },
  locationStatusContainer: {
    backgroundColor: "#EBF8FF",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BEE3F8",
  },
  locationStatusText: {
    fontSize: 14,
    color: "#2D3748",
    textAlign: "center",
  },
  preSelectedStationContainer: {
    backgroundColor: "#E6FFFA",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#81E6D9",
    alignItems: "center",
  },
  preSelectedStationText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#234E52",
  },
  summaryCard: {
    marginHorizontal: 20,
    backgroundColor: "#FED7D7",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  summaryText: {
    fontSize: 16,
    color: "#2D3748",
    marginBottom: 4,
  },
  summaryBold: {
    fontWeight: "700",
    color: "#9B2C2C",
  },
  searchButton: {
    backgroundColor: "#E53E3E",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginHorizontal: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  searchButtonDisabled: {
    backgroundColor: "#CBD5E1",
    shadowOpacity: 0,
    elevation: 0,
  },
  searchButtonText: {
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "700",
  },
});