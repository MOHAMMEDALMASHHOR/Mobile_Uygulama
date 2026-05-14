import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureScreen, captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { AuditWidget } from '@xtatistix/mobile-audit';
import { auditStorage } from './auditStorage';

const KATEGORILER = ['Mobil', 'Veritabanı', 'Tasarım', 'Algoritma'];
const ONCELIKLER = ['Düşük', 'Orta', 'Yüksek'];
const FILTRELER = ['Tümü', 'Aktif', 'Tamamlanan'];

export default function App() {
  // --- State Yönetimi ---
  const [tasks, setTasks] = useState([
    {
      id: '1',
      title: 'Mobil uygulama ödevi',
      description: 'Bugün ödev yapılacak',
      category: 'Mobil',
      priority: 'Yüksek',
      isCompleted: false,
    },
    {
      id: '2',
      title: 'React Native bileşenlerini tekrar et',
      description: '',
      category: 'Mobil',
      priority: 'Yüksek',
      isCompleted: false,
    }
  ]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Mobil');
  const [selectedPriority, setSelectedPriority] = useState('Orta');
  const [activeFilter, setActiveFilter] = useState('Tümü');

  // --- İstatistik Hesaplamaları ---
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.isCompleted).length;
  const activeTasks = totalTasks - completedTasks;
  const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  // --- Fonksiyonlar ---
  const handleAddTask = () => {
    if (title.trim() === '') return;

    const newTask = {
      id: Date.now().toString(),
      title,
      description,
      category: selectedCategory,
      priority: selectedPriority,
      isCompleted: false,
    };

    setTasks([newTask, ...tasks]);
    setTitle('');
    setDescription('');
  };

  const handleDeleteTask = (id) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const toggleTaskCompletion = (id) => {
    setTasks(
      tasks.map((t) =>
        t.id === id ? { ...t, isCompleted: !t.isCompleted } : t
      )
    );
  };

  // --- Rapor Dışa Aktarma (Manuel) ---
  const handleExportReport = async () => {
    try {
      const notes = await auditStorage.loadNotes();
      if (notes.length === 0) {
        Alert.alert('Bilgi', 'Henüz kaydedilmiş bir denetim notu bulunmuyor. Sağ alttaki ikon ile not ekleyebilirsiniz.');
        return;
      }

      let md = `# Denetim Raporu - ${new Date().toLocaleDateString('tr-TR')}\n\n`;
      notes.forEach((note, index) => {
        md += `### ${index + 1}. Denetim Notu\n`;
        md += `- **Tarih:** ${new Date(note.timestamp).toLocaleString('tr-TR')}\n`;
        md += `- **Ekran:** ${note.screen}\n`;
        md += `- **Not:** ${note.note || 'Açıklama yok'}\n`;
        if (note.imageUri) {
          md += `- **Görsel Yolu:** ${note.imageUri}\n`;
        }
        md += `\n---\n\n`;
      });

      const filename = `rapor_${Date.now()}.md`;
      const uri = FileSystem.documentDirectory + filename;
      await FileSystem.writeAsStringAsync(uri, md);
      await Sharing.shareAsync(uri);
    } catch (error) {
      Alert.alert('Hata', 'Rapor oluşturulurken bir hata oluştu.');
    }
  };

  // --- Filtreleme ---
  const filteredTasks = tasks.filter((task) => {
    if (activeFilter === 'Aktif') return !task.isCompleted;
    if (activeFilter === 'Tamamlanan') return task.isCompleted;
    return true;
  });

  // --- Alt Bileşenler (UI Parçaları) ---
  const renderPill = (items, selectedItem, onSelect) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillContainer}>
      {items.map((item) => (
        <TouchableOpacity
          key={item}
          style={[styles.pill, selectedItem === item && styles.pillActive]}
          onPress={() => onSelect(item)}
        >
          <Text style={[styles.pillText, selectedItem === item && styles.pillTextActive]}>
            {item}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderTaskItem = ({ item }) => (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <Text style={[styles.taskTitle, item.isCompleted && styles.taskTitleCompleted]}>
          {item.title}
        </Text>
        <View style={styles.priorityBadge}>
          <Text style={styles.priorityText}>{item.priority}</Text>
        </View>
      </View>
      
      {item.description ? <Text style={styles.taskDesc}>{item.description}</Text> : null}
      
      <View style={styles.taskFooter}>
        <Text style={styles.taskCategory}>{item.category}</Text>
        <View style={styles.taskActions}>
          <TouchableOpacity onPress={() => toggleTaskCompletion(item.id)}>
            <Text style={styles.statusText}>
              {item.isCompleted ? 'Tamamlandı' : 'Devam ediyor'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteTask(item.id)}>
            <Text style={styles.deleteButtonText}>Sil</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // --- Ana Render ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          renderItem={renderTaskItem}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.headerContent}>
              {/* Başlık */}
              <Text style={styles.mainTitle}>Ders Görev Takip</Text>
              <Text style={styles.subTitle}>Mobil uygulama geliştirme dersi için görev yöneticisi</Text>

              {/* İstatistikler */}
              <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{totalTasks}</Text>
                  <Text style={styles.statLabel}>Toplam</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{activeTasks}</Text>
                  <Text style={styles.statLabel}>Aktif</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{completedTasks}</Text>
                  <Text style={styles.statLabel}>Biten</Text>
                </View>
              </View>

              {/* İlerleme Çubuğu */}
              <Text style={styles.progressText}>Tamamlanma Oranı: %{completionRate}</Text>
              <View style={styles.progressBarWrapper}>
                <View style={styles.progressBarBackground}>
                  <View style={[styles.progressBarFill, { width: `${completionRate}%` }]} />
                </View>
              </View>

              {/* Rapor İndirme Butonu */}
              <TouchableOpacity style={styles.exportButton} onPress={handleExportReport}>
                <Text style={styles.exportButtonText}>📊 Denetim Raporunu İndir (.md)</Text>
              </TouchableOpacity>

              {/* Form Alanı */}
              <TextInput
                style={styles.input}
                placeholder="Görev başlığı"
                value={title}
                onChangeText={setTitle}
                placeholderTextColor="#999"
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Görev açıklaması"
                value={description}
                onChangeText={setDescription}
                multiline
                placeholderTextColor="#999"
              />

              <Text style={styles.sectionTitle}>Kategori</Text>
              {renderPill(KATEGORILER, selectedCategory, setSelectedCategory)}

              <Text style={styles.sectionTitle}>Öncelik</Text>
              {renderPill(ONCELIKLER, selectedPriority, setSelectedPriority)}

              <TouchableOpacity style={styles.addButton} onPress={handleAddTask}>
                <Text style={styles.addButtonText}>Görev Ekle</Text>
              </TouchableOpacity>

              {/* Filtreler */}
              <Text style={styles.sectionTitle}>Liste Filtresi</Text>
              {renderPill(FILTRELER, activeFilter, setActiveFilter)}
            </View>
          }
        />
      </KeyboardAvoidingView>
      <AuditWidget
        appName="Ders_1"
        deps={{
          captureScreen: () => captureScreen({ format: 'png', result: 'tmpfile' }),
          captureRef: (ref) => captureRef(ref, { format: 'png', result: 'tmpfile' }),
          writeFile: async (filename, content) => {
            const uri = FileSystem.documentDirectory + filename;
            await FileSystem.writeAsStringAsync(uri, content);
            return uri;
          },
          writeFileBinary: async (filename, base64) => {
            const uri = FileSystem.documentDirectory + filename;
            await FileSystem.writeAsStringAsync(uri, base64, {
              encoding: FileSystem.EncodingType.Base64,
            });
            return uri;
          },
          shareFile: (uri) => Sharing.shareAsync(uri),
          storage: auditStorage,
          currentScreen: 'HomeScreen',
          reporterId: 'qa-team',
          BugIcon: <Text style={{ fontSize: 22 }}>🐛</Text>,
        }}
        initialPosition={{ bottom: 110, right: 16 }}
        onNoteSaved={(notes, exportMd) => {
          Alert.alert(
            "Denetim Kaydedildi",
            "Notunuz ve ekran görüntüsü başarıyla alındı. Raporu şimdi indirmek ister misiniz?",
            [
              { text: "Daha Sonra", style: "cancel" },
              { text: "Raporu İndir", onPress: () => exportMd() }
            ]
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerContent: {
    paddingTop: 20,
    paddingBottom: 10,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
    marginBottom: 8,
  },
  progressBarWrapper: {
    marginBottom: 15,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E0E7FF',
    borderRadius: 4,
  },
  progressBarFill: {
    height: 8,
    backgroundColor: '#34D399',
    borderRadius: 4,
  },
  exportButton: {
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    alignItems: 'center',
    marginBottom: 20,
  },
  exportButtonText: {
    color: '#4338CA',
    fontWeight: '600',
    fontSize: 14,
  },
  input: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    marginTop: 10,
  },
  pillContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  pill: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
  },
  pillActive: {
    backgroundColor: '#4F46E5',
  },
  pillText: {
    color: '#4B5563',
    fontWeight: '500',
  },
  pillTextActive: {
    color: '#FFF',
  },
  addButton: {
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  taskCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  priorityBadge: {
    backgroundColor: '#FECACA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 10,
  },
  priorityText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: 'bold',
  },
  taskDesc: {
    color: '#6B7280',
    marginBottom: 12,
    fontSize: 14,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskCategory: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 14,
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    color: '#9CA3AF',
    marginRight: 15,
    fontSize: 14,
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#DC2626',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
