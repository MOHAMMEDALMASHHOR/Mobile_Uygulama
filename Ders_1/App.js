import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  FlatList,
  KeyboardAvoidingView,
  Platform
} from 'react-native';

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
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${completionRate}%` }]} />
              </View>

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
    color: '#4F46E5', // İndigo mavi
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
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E0E7FF',
    borderRadius: 4,
    marginBottom: 20,
  },
  progressBarFill: {
    height: 8,
    backgroundColor: '#34D399', // Yeşil
    borderRadius: 4,
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