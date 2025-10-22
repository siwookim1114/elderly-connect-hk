// app/memory-garden.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import memoryGardenApi from './services/memoryGardenApi';

interface Memory {
  id: string;
  title: string;
  description: string;
  imageUri: string;
  date: string;
  story?: string;
  category: string;
}

const MEMORIES_KEY = '@memories';

export default function MemoryGarden() {
  const router = useRouter();
  const { t } = useTranslation();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    checkApiConnection();
    loadMemories();
  }, []);

  const checkApiConnection = async () => {
    try {
      const isConnected = await memoryGardenApi.healthCheck();
      setApiConnected(isConnected);
    } catch (error) {
      console.log('API not available, using local storage');
      setApiConnected(false);
    }
  };

  const loadMemories = async () => {
    try {
      if (apiConnected) {
        // Load from API
        const stories = await memoryGardenApi.getAllStories();
        const apiMemories: Memory[] = stories.map(story => ({
          id: story.id,
          title: `Memory from ${story.date}`,
          description: story.story || 'A precious memory',
          imageUri: story.photos.length > 0 ? memoryGardenApi.getPhotoUrl(story.id, story.photos[0].id) : '',
          date: story.date,
          category: 'Story',
          story: story.story
        }));
        setMemories(apiMemories);
      } else {
        // Load from local storage
        const storedMemories = await AsyncStorage.getItem(MEMORIES_KEY);
        if (storedMemories) {
          setMemories(JSON.parse(storedMemories));
        }
      }
    } catch (error) {
      console.error('Error loading memories:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveMemories = async (newMemories: Memory[]) => {
    try {
      if (apiConnected) {
        // Save to API - this would require implementing the upload functionality
        console.log('API save not implemented yet, using local storage');
      }
      await AsyncStorage.setItem(MEMORIES_KEY, JSON.stringify(newMemories));
      setMemories(newMemories);
    } catch (error) {
      console.error('Error saving memories:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMemories();
    setRefreshing(false);
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission required', 'Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const date = new Date().toISOString().split('T')[0];
      if (apiConnected) {
        try {
          const name = asset.fileName || asset.uri.split('/').pop() || `photo_${Date.now()}.jpg`;
          const type = (asset as any).mimeType || 'image/jpeg';
          await memoryGardenApi.uploadPhotosAndGenerateStory(
            [
              {
                uri: asset.uri,
                name,
                type,
              },
            ],
            date,
            'Clear sky',
            'Unknown'
          );
          await loadMemories();
        } catch (e) {
          console.error('Upload failed, saving locally instead:', e);
          const newMemory: Memory = {
            id: Date.now().toString(),
            title: `Memory ${memories.length + 1}`,
            description: 'A precious moment captured',
            imageUri: asset.uri,
            date,
            category: 'General',
            story: 'This is a beautiful memory that tells a story of joy and connection.'
          };
          const updatedMemories = [...memories, newMemory];
          await saveMemories(updatedMemories);
        }
      } else {
        const newMemory: Memory = {
          id: Date.now().toString(),
          title: `Memory ${memories.length + 1}`,
          description: 'A precious moment captured',
          imageUri: asset.uri,
          date,
          category: 'General',
          story: 'This is a beautiful memory that tells a story of joy and connection.'
        };
        const updatedMemories = [...memories, newMemory];
        await saveMemories(updatedMemories);
      }
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission required', 'Permission to access camera is required!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const date = new Date().toISOString().split('T')[0];
      if (apiConnected) {
        try {
          const name = asset.fileName || asset.uri.split('/').pop() || `photo_${Date.now()}.jpg`;
          const type = (asset as any).mimeType || 'image/jpeg';
          await memoryGardenApi.uploadPhotosAndGenerateStory(
            [
              {
                uri: asset.uri,
                name,
                type,
              },
            ],
            date,
            'Clear sky',
            'Unknown'
          );
          await loadMemories();
        } catch (e) {
          console.error('Upload failed, saving locally instead:', e);
          const newMemory: Memory = {
            id: Date.now().toString(),
            title: `Photo ${memories.length + 1}`,
            description: 'A moment captured with love',
            imageUri: asset.uri,
            date,
            category: 'Photo',
            story: 'This photo captures a special moment in time, filled with warmth and memories.'
          };
          const updatedMemories = [...memories, newMemory];
          await saveMemories(updatedMemories);
        }
      } else {
        const newMemory: Memory = {
          id: Date.now().toString(),
          title: `Photo ${memories.length + 1}`,
          description: 'A moment captured with love',
          imageUri: asset.uri,
          date,
          category: 'Photo',
          story: 'This photo captures a special moment in time, filled with warmth and memories.'
        };
        const updatedMemories = [...memories, newMemory];
        await saveMemories(updatedMemories);
      }
    }
  };

  const showAddOptions = () => {
    console.log('Add memory button pressed!');
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
  };

  const renderMemory = ({ item }: { item: Memory }) => (
    <TouchableOpacity 
      style={styles.memoryCard}
      onPress={() => router.push(`/memory-detail/${item.id}`)}
    >
      <Image source={{ uri: item.imageUri }} style={styles.memoryImage} />
      <View style={styles.memoryInfo}>
        <Text style={styles.memoryTitle}>{item.title}</Text>
        <Text style={styles.memoryDate}>{item.date}</Text>
        <Text style={styles.memoryDescription} numberOfLines={2}>
          {item.description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen 
          options={{
            title: "Memory Garden",
            headerTitleAlign: "center",
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DD6B20" />
          <Text style={styles.loadingText}>Loading your memories...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: "Memory Garden",
          headerTitleAlign: "center",
        }}
      />
      
      {memories.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="flower-outline" size={80} color="#DD6B20" />
          <Text style={styles.emptyTitle}>No Memories Yet</Text>
          <Text style={styles.emptySubtitle}>
            Start building your memory garden by adding your first photo
          </Text>
          <TouchableOpacity 
            style={styles.addFirstButton}
            onPress={() => {
              console.log('Button pressed!');
              showAddOptions();
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={24} color="white" />
            <Text style={styles.addFirstButtonText}>Add Your First Memory</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={memories}
            renderItem={renderMemory}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.memoriesList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
          <TouchableOpacity 
            style={styles.fab}
            onPress={showAddOptions}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </>
      )}

      {/* Add Memory Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeAddModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Memory</Text>
            <Text style={styles.modalSubtitle}>
              Choose how you want to add a new memory
            </Text>
            
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => {
                closeAddModal();
                takePhoto();
              }}
            >
              <Ionicons name="camera" size={24} color="#DD6B20" />
              <Text style={styles.modalButtonText}>Camera</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => {
                closeAddModal();
                pickImage();
              }}
            >
              <Ionicons name="images" size={24} color="#DD6B20" />
              <Text style={styles.modalButtonText}>Photo Library</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]}
              onPress={closeAddModal}
            >
              <Ionicons name="close" size={24} color="#718096" />
              <Text style={[styles.modalButtonText, styles.cancelButtonText]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D3748',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DD6B20',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  addFirstButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  memoriesList: {
    padding: 16,
    paddingBottom: 80,
  },
  memoryCard: {
    flex: 1,
    margin: 8,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  memoryImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  memoryInfo: {
    padding: 12,
  },
  memoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  memoryDate: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 6,
  },
  memoryDescription: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 18,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#DD6B20',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3748',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: '#F7FAFC',
    borderColor: '#E2E8F0',
  },
  cancelButtonText: {
    color: '#718096',
  },
});