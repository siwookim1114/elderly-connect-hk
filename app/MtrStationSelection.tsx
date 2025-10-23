import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Import MTR stations data
import { MTR_STATIONS_BY_DISTRICT } from "./services/activitiesApi";

// Flatten all MTR stations into a single list and remove duplicates
const ALL_MTR_STATIONS = [...new Set(Object.values(MTR_STATIONS_BY_DISTRICT).flat())];

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

// Orange color palette for Mingle app (consistent with login and home screens)
const COLORS = {
  primary: "#E67E22", // Warm orange
  primaryLight: "#F39C12", // Lighter orange
  primaryDark: "#D35400", // Darker orange
  background: "#FFF9F2", // Warm white background
  card: "#FFFFFF",
  text: "#2C3E50", // Dark blue-gray for text
  textSecondary: "#7F8C8D", // Gray for secondary text
  border: "#FAD7A0", // Light orange border
  inputBackground: "#FEF5E7", // Very light orange
  error: "#E74C3C",
  success: "#27AE60",
  accent: "#F1C40F", // Golden yellow accent
};

export default function MtrStationSelectionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [selectedMtrStation, setSelectedMtrStation] = useState<string>("");
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  const handleContinue = () => {
    if (!selectedMtrStation) {
      Alert.alert(t("activities.error"), t("activities.pleaseSelectMtrStation"));
      return;
    }
    
    // Navigate to Activity Discovery with the selected MTR station
    router.push({
      pathname: "/ActivityDiscovery",
      params: { startMtrStation: selectedMtrStation }
    });
  };

  const handleBack = () => {
    router.back();
  };

  const openPicker = () => {
    setIsPickerVisible(true);
  };

  const closePicker = () => {
    setIsPickerVisible(false);
  };

  const selectStation = (station: string) => {
    setSelectedMtrStation(station);
    setIsPickerVisible(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Mingle Branding */}
        <View style={styles.headerSection}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
          >
            <Text style={styles.backButtonText}>← {t("common.back")}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t("activities.selectMtrStation")}</Text>
          <Text style={styles.subtitle}>{t("activities.chooseMtrStation")}</Text>
        </View>

        {/* MTR Station Selection - Custom dropdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("activities.selectYourStation")}
          </Text>
          <TouchableOpacity 
            style={styles.customPicker} 
            onPress={openPicker}
          >
            <Text style={selectedMtrStation ? styles.selectedText : styles.placeholderText}>
              {selectedMtrStation ? t(getStationTranslationKey(selectedMtrStation)) : t("activities.chooseMtrStation")}
            </Text>
            <Text style={styles.arrow}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedMtrStation && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedMtrStation}
        >
          <Text style={styles.continueButtonText}>
            {t("common.continue")} →
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Custom Modal Picker */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isPickerVisible}
        onRequestClose={closePicker}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("activities.selectYourStation")}</Text>
              <TouchableOpacity onPress={closePicker}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              <TouchableOpacity 
                style={[
                  styles.modalItem, 
                  !selectedMtrStation && styles.selectedModalItem
                ]}
                onPress={() => selectStation("")}
              >
                <Text style={[
                  styles.modalItemText, 
                  !selectedMtrStation && styles.selectedModalItemText
                ]}>
                  {t("activities.chooseMtrStation")}
                </Text>
              </TouchableOpacity>
              {ALL_MTR_STATIONS.map((station) => (
                <TouchableOpacity 
                  key={station} 
                  style={[
                    styles.modalItem, 
                    selectedMtrStation === station && styles.selectedModalItem
                  ]}
                  onPress={() => selectStation(station)}
                >
                  <Text style={[
                    styles.modalItemText, 
                    selectedMtrStation === station && styles.selectedModalItemText
                  ]}>
                    {t(getStationTranslationKey(station))}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerSection: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 15,
    paddingVertical: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: "600",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 15,
  },
  customPicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    height: 60,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  placeholderText: {
    fontSize: 18,
    color: COLORS.textSecondary,
  },
  selectedText: {
    fontSize: 18,
    color: COLORS.text,
    fontWeight: "600",
  },
  arrow: {
    fontSize: 18,
    color: COLORS.primary,
  },
  continueButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginHorizontal: 20,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  continueButtonDisabled: {
    backgroundColor: COLORS.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    fontSize: 18,
    color: COLORS.card,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.primary,
  },
  closeButton: {
    fontSize: 24,
    color: COLORS.primary,
    fontWeight: "600",
  },
  modalItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectedModalItem: {
    backgroundColor: COLORS.inputBackground,
  },
  modalItemText: {
    fontSize: 18,
    color: COLORS.text,
  },
  selectedModalItemText: {
    fontWeight: "600",
    color: COLORS.primary,
  },
});