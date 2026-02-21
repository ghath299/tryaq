import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute } from "@react-navigation/native";

import { GlowingSearchBar } from "@/components/GlowingSearchBar";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/contexts/AppContext";
import { getApiUrl } from "@/lib/query-client";
import { loadGovernorate, saveGovernorate } from "@/lib/governorate";
import { provinces } from "@/data/mockData";
import { Spacing, BorderRadius } from "@/constants/theme";

type Medicine = { id: string; nameAr: string; nameEn: string };
type Pharmacy = { id: string; nameAr: string; nameEn: string; governorate: string; governorateAr: string };

const PAGE_SIZE = 6;

export default function MedicinePharmaciesScreen() {
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { language } = useApp();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const apiUrl = getApiUrl();

  const initialQuery = route.params?.initialQuery || "";
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [governorate, setGovernorate] = useState("Baghdad");
  const [showGovernorates, setShowGovernorates] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [suggestions, setSuggestions] = useState<Medicine[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [page, setPage] = useState(1);

  const searchCache = useRef<Map<string, Medicine[]>>(new Map());

  useEffect(() => {
    loadGovernorate().then((value) => value && setGovernorate(value));
    
    // If we have an initial query, try to find a direct match in local data first for speed
    if (initialQuery) {
      const { medicines: localMedicines } = require("@/data/mockData");
      const localMatch = localMedicines.find(
        (m: any) => m.nameAr === initialQuery || m.nameEn === initialQuery
      );
      if (localMatch) {
        handleSelectMedicine({
          id: localMatch.id,
          nameAr: localMatch.nameAr,
          nameEn: localMatch.nameEn
        });
      }
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const loadSuggestions = async () => {
      const normalized = debouncedQuery.trim().toLowerCase();
      if (!normalized) {
        setSuggestions([]);
        return;
      }

      if (searchCache.current.has(normalized)) {
        setSuggestions(searchCache.current.get(normalized) || []);
        return;
      }

      const response = await fetch(`${apiUrl}/api/medicines?query=${encodeURIComponent(debouncedQuery)}`);
      const data = await response.json();
      searchCache.current.set(normalized, data.items || []);
      setSuggestions(data.items || []);

      const directMatch = (data.items || []).find(
        (item: Medicine) =>
          item.nameAr.toLowerCase() === normalized || item.nameEn.toLowerCase() === normalized,
      );
      if (directMatch) {
        handleSelectMedicine(directMatch);
      }
    };

    loadSuggestions();
  }, [apiUrl, debouncedQuery]);

  const handleSelectMedicine = async (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setQuery(language === "ar" ? medicine.nameAr : medicine.nameEn);
    setIsLoading(true);
    try {
      const response = await fetch(
        `${apiUrl}/api/availability?medicineId=${medicine.id}&governorate=${encodeURIComponent(governorate)}`,
      );
      const data = await response.json();
      setPharmacies(data.items || []);
      setPage(1);
    } finally {
      setIsLoading(false);
    }
  };

  const paginatedPharmacies = useMemo(() => pharmacies.slice(0, page * PAGE_SIZE), [pharmacies, page]);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot, paddingTop: headerHeight + Spacing.md }]}>
      <View style={styles.searchSection}>
        <GlowingSearchBar value={query} onChangeText={setQuery} placeholder="ابحث عن دواء / Search medicine" />
        <Pressable style={[styles.governorateButton, { borderColor: theme.border }]} onPress={() => setShowGovernorates(true)}>
          <ThemedText type="small">تغيير المحافظة: {governorate}</ThemedText>
        </Pressable>
      </View>

      {!selectedMedicine && suggestions.length > 0 ? (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable style={[styles.row, { borderBottomColor: theme.border }]} onPress={() => handleSelectMedicine(item)}>
              <ThemedText type="body">{language === "ar" ? item.nameAr : item.nameEn}</ThemedText>
            </Pressable>
          )}
        />
      ) : isLoading ? (
        <ActivityIndicator size="large" color={theme.primary} />
      ) : (
        <FlatList
          data={paginatedPharmacies}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <ThemedText type="small" style={{ marginBottom: Spacing.sm }}>
              {selectedMedicine ? `الصيدليات المتوفرة لـ ${language === "ar" ? selectedMedicine.nameAr : selectedMedicine.nameEn}` : ""}
            </ThemedText>
          }
          ListEmptyComponent={<ThemedText type="body">لا توجد صيدليات متوفرة ضمن المحافظة المحددة.</ThemedText>}
          onEndReached={() => {
            if (page * PAGE_SIZE < pharmacies.length) setPage((p) => p + 1);
          }}
          onEndReachedThreshold={0.5}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.card, { backgroundColor: theme.backgroundDefault }]}
              onPress={() => navigation.navigate("PharmacyDetail" as never, { pharmacyId: item.id } as never)}
            >
              <ThemedText type="body" style={{ fontWeight: "700" }}>{language === "ar" ? item.nameAr : item.nameEn}</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {language === "ar" ? item.governorateAr : item.governorate}
              </ThemedText>
            </Pressable>
          )}
        />
      )}

      <Modal transparent visible={showGovernorates} animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowGovernorates(false)}>
          <View style={[styles.modalCard, { backgroundColor: theme.backgroundDefault }]}>
            <FlatList
              data={provinces}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.row, { borderBottomColor: theme.border }]}
                  onPress={async () => {
                    await saveGovernorate(item.nameEn);
                    setGovernorate(item.nameEn);
                    setShowGovernorates(false);
                    if (selectedMedicine) handleSelectMedicine(selectedMedicine);
                  }}
                >
                  <ThemedText type="body">{language === "ar" ? item.nameAr : item.nameEn}</ThemedText>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: Spacing.lg },
  searchSection: { gap: Spacing.sm, marginBottom: Spacing.md },
  governorateButton: { borderWidth: 1, borderRadius: BorderRadius.md, padding: Spacing.sm },
  card: { borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm },
  row: { paddingVertical: Spacing.md, borderBottomWidth: 1 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: Spacing.xl },
  modalCard: { borderRadius: BorderRadius.md, maxHeight: "70%", paddingHorizontal: Spacing.md },
});
