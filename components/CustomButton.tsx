import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native'
import React from 'react'

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
}

const CustomButton: React.FC<CustomButtonProps> = ({ title, onPress, isLoading = false }) => {
  return (
    <TouchableOpacity 
      onPress={onPress} 
      style={styles.button}
      disabled={isLoading}
    >
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="white" />
          <Text style={styles.buttonText}>{title}</Text>
        </View>
      ) : (
        <Text style={styles.buttonText}>{title}</Text>
      )}
    </TouchableOpacity>
  )
}

export default CustomButton

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
})